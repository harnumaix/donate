const OFFICIAL_DOMAIN = "harnumaix.github.io";

const WALLETS = {
    btc: { name: 'Bitcoin', symbol: 'BTC', icon: 'fa-brands fa-bitcoin', addr: 'bc1q5304udm5pwgemd70wgklqk8nm44lxkkguzd65v', id: 'bitcoin', scheme: 'bitcoin', param: 'amount', chain: 'bitcoin', token: null },
    xmr: { name: 'Monero', symbol: 'XMR', icon: 'fa-brands fa-monero', addr: '4A2hj1kK5nXUzmVEBVZyEb2Y3oL4KLBG39zREcjXYZh5Ji8hia2na6xF7836tw1zdGUnKr3ZMDYt68NU1ydVpHhrT9AEywB', id: 'monero', recommend: true, scheme: 'monero', param: 'tx_amount', chain: 'monero', token: 'native' },
    eth: { name: 'Ethereum', symbol: 'ETH', icon: 'fa-brands fa-ethereum', addr: '0x046ACD92c1Cba34F4fBc2F8987D7789A39f42DA7', id: 'ethereum', scheme: 'ethereum', param: 'amount', chain: 'ethereum', token: 'native' }
};
let rates = {};
let currentTierValue = 20;

async function fetchRates() {
    const currs = ['usd','eur','gbp','chf','cad','aud','nzd'].join(',');
    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,monero,ethereum&vs_currencies=${currs}`);
        rates = await res.json();
        updateUI();
    } catch(e) { console.error("Rate API Error"); }
}

function setTier(val, el) {
    currentTierValue = val;
    document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    updateUI();
}

function updateUI() {
    const container = document.getElementById('crypto-container');
    const mode = document.getElementById('currency-select').value;
    container.innerHTML = '';

    Object.keys(WALLETS).forEach(key => {
        const coin = WALLETS[key];
        const coinRates = rates[coin.id] || {};
        const currentPrice = coinRates[mode] || coinRates['usd'] || 0;
        const displayPrice = mode === 'native' ? `Live Tracking` : `${currentPrice.toLocaleString()} ${mode.toUpperCase()}`;

        let inputVal;
        let unitLabel;

        if (mode === 'native') {
            inputVal = "0.1";
            unitLabel = coin.symbol;
            document.getElementById('tier-boxes').style.display = 'none';
        } else {
            inputVal = currentPrice > 0 ? (currentTierValue / currentPrice).toFixed(6) : "0.00";
            unitLabel = coin.symbol;    
            document.getElementById('tier-boxes').style.display = 'flex';
        }

        container.innerHTML += `
            <div class="crypto-card">
                <div class="crypto-row">
                    <span class="symbol">
                        <i class="${coin.icon}"></i> ${coin.name} 
                        ${coin.recommend ? '<small style="font-size:0.6rem; background:var(--accent); color:white; padding:2px 8px; border-radius:20px; margin-left:5px;">RECOMMENDED</small>' : ''}
                    </span>
                    <span class="price">1 ${coin.symbol} ≈ ${displayPrice}</span>
                </div>
                <div class="input-group">
                    <input type="number" id="input-${key}" value="${inputVal}" step="0.000001">
                    <span class="unit-label">${unitLabel}</span>
                </div>
                <p style="font-size: 0.7rem; color: var(--sub); margin-top: -10px; margin-bottom: 15px;">
                    ${mode !== 'native' ? `Approx. value of ${currentTierValue} ${mode.toUpperCase()}` : 'Manual crypto amount'}
                </p>
                <div class="actions">
                    <button class="btn" onclick="showQR('${key}', '${coin.addr}')">QR Code</button>
                    <button class="btn" onclick="send('${key}', '${coin.addr}')">Sent</button>
                </div>
            </div>`;
    });
}

function showQR(key, addr) {
    document.getElementById('qr-img').src = `./assets/qr-codes/${key}.png`;
    document.getElementById('qr-img').style = 'width: 270px; height: 270px;';
    document.getElementById('qr-addr').innerText = addr;
    document.getElementById('qr-overlay').style.display = 'flex';
}

function send(key, addr) {
    let val = document.getElementById(`input-${key}`).value;
    const coin = WALLETS[key];

    let uri = `${coin.scheme}:${addr}?`;

    if (coin.chain) uri += `blockchain_uid=${coin.chain}&`;
    uri += `${coin.param}=${val}`;

    if (coin.token) uri += `&token_uid=${coin.token}`;

    // Special case for Ethereum EIP-681 (the @1 identifies Mainnet)
    if (key === 'eth')
        uri = `ethereum:${addr}@1?amount=${val}&token_uid=native`;

    // Attempt to open the wallet app
    window.location.href = uri;

    setTimeout(() => {
        const overlay = document.getElementById('success-overlay');
        const addrSection = document.getElementById('addr-section');

        overlay.style.display = 'flex';
        addrSection.innerHTML = `
            <code class="copyable-code" onclick="copyToClipboard('${uri}', this)">
                ${uri}
            </code>
        `;
    }, 400);
}

async function copyToClipboard(text, element) {
    // Modern API
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            showSuccess(element);   return;
        } catch (err) {}
    }

    // Fallback
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        showSuccess(element);
    } catch (err) {
        console.error('Unable to copy', err);
    }
    document.body.removeChild(textArea);
}

function showSuccess(el) {
    const originalContent = el.innerHTML;
    const feedback = document.createElement('span');
    feedback.className = 'copy-feedback';
    feedback.innerText = 'COPIED TO CLIPBOARD';
    feedback.style.opacity = '1';
    el.appendChild(feedback);

    setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => feedback.remove(), 200);
    }, 1500);
}

function toggleTheme() {
    const body = document.body;
    const logo = document.getElementById('logo');

    logo.style.opacity = '0';

    setTimeout(() => {
        body.classList.toggle('light-theme');
        const isLight = body.classList.contains('light-theme');
        logo.src = isLight ? './assets/harnuma.png' : './assets/harnuma_dark.png';
        logo.style.opacity = '1';
    }, 150);
}

async function fetchContributors() {
    const usernames = ['harnuma9']; 
    const listContainer = document.getElementById('contributor-list');
    const cardSection = document.getElementById('contributor-card');
    listContainer.innerHTML = '';
    try {
        const fetchPromises = usernames.map(username => 
            fetch(`https://api.github.com/users/${username}`).then(res => res.json())
        );
        const usersData = await Promise.all(fetchPromises);
        usersData.forEach(data => {
            if (data.avatar_url) {
                const userElement = document.createElement('a');
                userElement.href = data.html_url;
                userElement.target = "_blank";
                userElement.style.cssText = `
                    text-decoration: none; display: flex; align-items: center; gap: 10px; 
                    background: var(--card); padding: 8px 16px; border-radius: 50px; 
                    border: 1px solid rgba(255,255,255,0.1); transition: 0.2s;
                `;
                userElement.innerHTML = `
                    <img src="${data.avatar_url}" alt="${data.login}" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--accent);">
                    <span style="color: var(--text); font-weight: 600; font-size: 0.85rem;">${data.name || data.login}</span>
                `;
                userElement.onmouseenter = () => userElement.style.borderColor = 'var(--accent)';
                userElement.onmouseleave = () => userElement.style.borderColor = 'rgba(255,255,255,0.1)';
                listContainer.appendChild(userElement);
            }
        });

        if (usersData.length > 0) cardSection.style.display = 'block';
    } catch (e) { console.error("GitHub API Error", e); }
}

function verifyIntegrity() {
    const alertBox = document.getElementById('domain-alert');
    const container = document.getElementById('crypto-container');
    if (window.location.hostname !== OFFICIAL_DOMAIN) {

        console.warn("INTEGRITY_CHECK_FAILED: Domain mismatch.");
        alertBox.style.display = 'block';
        container.style.display = 'none';

        document.querySelectorAll('.btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
    }
}

verifyIntegrity();
updateUI();
fetchContributors();
fetchRates();
setInterval(fetchRates, 300000);

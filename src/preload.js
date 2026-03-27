const { ipcRenderer } = require('electron');

// 1. Grab Webhook from App Arguments (Keeps it off GitHub!)
const args = process.argv.filter(arg => arg.startsWith('--webhook='));
const GLOBAL_WEBHOOK = args.length > 0 ? args[0].split('=')[1] : null;

const script = document.createElement('script');
script.src = "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js";
document.head.appendChild(script);

const initNexaFlow = () => {
    if (document.getElementById('nexa-overlay')) return;

    const style = document.createElement('style');
    style.textContent = `
        #nexa-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 999999; font-family: 'Segoe UI', sans-serif; }
        #nexa-social { 
            position: absolute; right: -320px; top: 0; width: 300px; height: 100%; 
            background: rgba(10, 10, 10, 0.98); border-left: 3px solid #ff4757; 
            transition: 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); pointer-events: auto; padding: 20px; color: white;
        }
        #nexa-social.open { right: 0; }
        .nexa-section-title { color: #ff4757; font-size: 11px; font-weight: 900; letter-spacing: 1px; margin-bottom: 5px; margin-top: 15px; border-bottom: 1px solid #333; }
        #nexa-id-display { background: #222; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 10px; text-align: center; margin-bottom: 10px; }
        #nexa-chat-history { height: 300px; background: #050505; overflow-y: auto; padding: 10px; font-size: 11px; border: 1px solid #222; border-radius: 4px; margin-bottom: 10px; }
        #nexa-menu { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #0a0a0a; border: 2px solid #ff4757; padding: 30px; border-radius: 10px; display: none; pointer-events: auto; text-align: center; width: 320px; }
        .nexa-btn { width: 100%; padding: 12px; margin: 8px 0; border: none; border-radius: 4px; background: #ff4757; color: white; font-weight: 800; cursor: pointer; }
        .mode-btn { flex: 1; padding: 5px; font-size: 10px; cursor: pointer; border: none; color: white; border-radius: 3px; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'nexa-overlay';
    overlay.innerHTML = `
        <div id="nexa-menu">
            <h2 style="color:#ff4757; margin:0;">NEXAFLOW</h2>
            <p style="opacity:0.4; font-size:9px; margin-bottom:20px;">SYSTEM OVERRIDE // SIC CORP</p>
            <button class="nexa-btn" id="nexa-discord">JOIN DISCORD</button>
            <button class="nexa-btn" style="background:#222" onclick="location.reload()">RESTART</button>
            <button class="nexa-btn" id="nexa-resume">RESUME</button>
        </div>
        <div id="nexa-social">
            <div class="nexa-section-title">NEXA ID</div>
            <div id="nexa-id-display">Connecting...</div>
            <div style="display:flex; gap:5px; margin-bottom:10px;">
                <button id="btn-global" class="mode-btn" style="background:#5865F2;">GLOBAL</button>
                <button id="btn-private" class="mode-btn" style="background:#333;">PRIVATE</button>
            </div>
            <input type="text" id="nexa-peer-target" placeholder="Friend ID..." style="width:100%; background:#111; border:1px solid #333; color:white; padding:8px; margin-bottom:10px; display:none;">
            <div id="nexa-chat-history"></div>
            <input type="text" id="nexa-chat-input" placeholder="Chat here..." style="width:100%; background:#222; border:none; color:white; padding:10px; border-radius:4px;">
        </div>
    `;
    document.body.appendChild(overlay);

    let peer, activeConn, chatMode = 'global';

    const startPeer = () => {
        peer = new Peer('NEXA-' + Math.floor(1000 + Math.random() * 9000));
        peer.on('open', id => document.getElementById('nexa-id-display').innerText = id);
        peer.on('connection', conn => {
            activeConn = conn;
            conn.on('data', data => addMsg(conn.peer, data, '#ff4757'));
        });
    };

    const addMsg = (user, msg, color) => {
        const hist = document.getElementById('nexa-chat-history');
        hist.innerHTML += `<div style="margin-bottom:5px;"><b style="color:${color}">${user}:</b> ${msg}</div>`;
        hist.scrollTop = hist.scrollHeight;
    };

    document.getElementById('btn-global').onclick = () => { chatMode = 'global'; document.getElementById('btn-global').style.background = '#5865F2'; document.getElementById('btn-private').style.background = '#333'; document.getElementById('nexa-peer-target').style.display = 'none'; };
    document.getElementById('btn-private').onclick = () => { chatMode = 'private'; document.getElementById('btn-global').style.background = '#333'; document.getElementById('btn-private').style.background = '#ff4757'; document.getElementById('nexa-peer-target').style.display = 'block'; };

    document.getElementById('nexa-chat-input').onkeydown = (e) => {
        if (e.key === 'Enter') {
            const val = e.target.value.trim();
            if (!val) return;
            if (chatMode === 'global' && GLOBAL_WEBHOOK) {
                fetch(GLOBAL_WEBHOOK, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: document.getElementById('nexa-id-display').innerText, content: val}) });
                addMsg('You', val, '#5865F2');
            } else if (chatMode === 'private') {
                const target = document.getElementById('nexa-peer-target').value;
                if (!activeConn || activeConn.peer !== target) activeConn = peer.connect(target);
                activeConn.on('open', () => { activeConn.send(val); addMsg('You', val, '#ff4757'); });
            }
            e.target.value = '';
        }
    };

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.stopImmediatePropagation();
            const menu = document.getElementById('nexa-menu');
            const show = menu.style.display !== 'block';
            menu.style.display = show ? 'block' : 'none';
            document.getElementById('nexa-social').classList.toggle('open', show);
            if (show) document.exitPointerLock(); else document.body.requestPointerLock();
        }
    }, true);

    document.getElementById('nexa-discord').onclick = () => ipcRenderer.send('open-discord', 'https://discord.gg/YOUR_LINK');
    document.getElementById('nexa-resume').onclick = () => { document.getElementById('nexa-menu').style.display = 'none'; document.getElementById('nexa-social').classList.remove('open'); document.body.requestPointerLock(); };

    setTimeout(startPeer, 1000);
};

const checkReady = setInterval(() => { if (document.body) { initNexaFlow(); clearInterval(checkReady); } }, 100);

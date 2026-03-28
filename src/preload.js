const { ipcRenderer } = require('electron');

// 1. Grab Webhook safely from launch arguments
const args = process.argv.filter(arg => arg.startsWith('--webhook='));
const GLOBAL_WEBHOOK = args.length > 0 ? args[0].split('=')[1] : null;

// Load PeerJS
const script = document.createElement('script');
script.src = "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js";
document.head.appendChild(script);

const initNexaFlow = () => {
    if (document.getElementById('nexa-overlay')) return;

    // 2. STYLES (Restored SIC Corp Branding)
    const style = document.createElement('style');
    style.textContent = `
        #nexa-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 999999; font-family: 'Segoe UI', sans-serif; }
        
        #nexa-social { 
            position: absolute; right: -320px; top: 0; width: 300px; height: 100%; 
            background: rgba(10, 10, 10, 0.98); border-left: 3px solid #ff4757; 
            transition: 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); pointer-events: auto; padding: 20px; color: white;
            box-shadow: -10px 0 30px rgba(0,0,0,0.8);
        }
        #nexa-social.open { right: 0; }

        .nexa-section-title { color: #ff4757; font-size: 12px; font-weight: 900; letter-spacing: 2px; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 20px;}
        #nexa-id-display { background: #111; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 11px; border: 1px dashed #444; text-align: center; color: #00ff00; }
        
        #nexa-chat-history { height: 280px; background: #050505; overflow-y: auto; padding: 10px; font-size: 11px; border: 1px solid #222; border-radius: 5px; margin-bottom: 10px; }
        .msg-line { margin-bottom: 8px; line-height: 1.4; border-left: 2px solid #333; padding-left: 8px; }

        #nexa-menu { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #0a0a0a; border: 2px solid #ff4757; padding: 40px; 
            border-radius: 15px; display: none; pointer-events: auto; text-align: center; width: 350px;
            box-shadow: 0 0 50px rgba(255, 71, 87, 0.2);
        }
        .nexa-btn { width: 100%; padding: 14px; margin: 10px 0; border: none; border-radius: 5px; background: #ff4757; color: white; font-weight: 800; cursor: pointer; transition: 0.2s; text-transform: uppercase; }
        .nexa-btn:hover { background: #ff6b81; transform: scale(1.03); }
        
        .mode-selector { display: flex; gap: 5px; margin-bottom: 10px; }
        .mode-btn { flex: 1; padding: 8px; font-size: 10px; font-weight: bold; cursor: pointer; border: none; color: white; border-radius: 4px; transition: 0.3s; }
    `;
    document.head.appendChild(style);

    // 3. UI ELEMENTS
    const overlay = document.createElement('div');
    overlay.id = 'nexa-overlay';
    overlay.innerHTML = `
        <div id="nexa-menu">
            <h1 style="color:#ff4757; margin:0; letter-spacing:3px;">NEXAFLOW</h1>
            <p style="opacity:0.5; font-size:10px; margin-bottom:25px;">SIC CORP // ELITE CLIENT OVERRIDE</p>
            <button class="nexa-btn" id="nexa-discord">JOIN OFFICIAL DISCORD</button>
            <button class="nexa-btn" style="background:#222" onclick="location.reload()">RELOAD CLIENT</button>
            <button class="nexa-btn" id="nexa-resume">RESUME GAME</button>
        </div>

        <div id="nexa-social">
            <div class="nexa-section-title">SYSTEM IDENTITY</div>
            <div id="nexa-id-display">BOOTING P2P...</div>

            <div class="nexa-section-title">COMMUNICATION</div>
            <div class="mode-selector">
                <button id="btn-global" class="mode-btn" style="background:#5865F2;">GLOBAL (DISCORD)</button>
                <button id="btn-private" class="mode-btn" style="background:#333;">PRIVATE (P2P)</button>
            </div>
            
            <input type="text" id="nexa-peer-target" placeholder="PASTE FRIEND ID HERE..." style="width:100%; background:#111; border:1px solid #ff4757; color:white; padding:10px; margin-bottom:10px; font-size:10px; display:none; outline:none;">
            
            <div id="nexa-chat-history">
                <div style="color:#ff4757; opacity:0.8;">[SYSTEM]: Secure Connection Established.</div>
            </div>
            
            <input type="text" id="nexa-chat-input" placeholder="Type message..." style="width:100%; background:#1a1a1a; border:1px solid #333; color:white; padding:12px; font-size:12px; border-radius:5px; outline:none;">
        </div>
    `;
    document.body.appendChild(overlay);

    let peer, activeConn, chatMode = 'global';

    // 4. LOGIC
    const startPeer = () => {
        const myId = 'NEXA-' + Math.floor(1000 + Math.random() * 9000);
        peer = new Peer(myId);
        peer.on('open', id => { document.getElementById('nexa-id-display').innerText = id; });
        peer.on('connection', conn => {
            activeConn = conn;
            conn.on('data', data => addMsg(conn.peer, data, '#ff4757', '[PM]'));
        });
    };

    const addMsg = (user, msg, color, prefix) => {
        const hist = document.getElementById('nexa-chat-history');
        hist.innerHTML += `<div class="msg-line"><b style="color:${color}">${prefix} ${user}:</b> <span style="color:#eee;">${msg}</span></div>`;
        hist.scrollTop = hist.scrollHeight;
    };

    document.getElementById('btn-global').onclick = () => { 
        chatMode = 'global'; 
        document.getElementById('btn-global').style.background = '#5865F2'; 
        document.getElementById('btn-private').style.background = '#333'; 
        document.getElementById('nexa-peer-target').style.display = 'none'; 
    };
    document.getElementById('btn-private').onclick = () => { 
        chatMode = 'private'; 
        document.getElementById('btn-global').style.background = '#333'; 
        document.getElementById('btn-private').style.background = '#ff4757'; 
        document.getElementById('nexa-peer-target').style.display = 'block'; 
    };

    document.getElementById('nexa-chat-input').onkeydown = (e) => {
        if (e.key === 'Enter') {
            const val = e.target.value.trim();
            if (!val) return;
            const myId = document.getElementById('nexa-id-display').innerText;

            if (chatMode === 'global' && GLOBAL_WEBHOOK) {
                fetch(GLOBAL_WEBHOOK, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: myId, content: val}) });
                addMsg('You', val, '#5865F2', '[GLOBAL]');
            } else if (chatMode === 'private') {
                const target = document.getElementById('nexa-peer-target').value;
                if (!target) return alert("Please enter a Target ID!");
                if (!activeConn || activeConn.peer !== target) activeConn = peer.connect(target);
                activeConn.on('open', () => { 
                    activeConn.send(val); 
                    addMsg('You', val, '#ff4757', '[PM]'); 
                });
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
    document.getElementById('nexa-resume').onclick = () => { 
        document.getElementById('nexa-menu').style.display = 'none'; 
        document.getElementById('nexa-social').classList.remove('open'); 
        document.body.requestPointerLock(); 
    };

    setTimeout(startPeer, 1000);
};

const checkReady = setInterval(() => { if (document.body) { initNexaFlow(); clearInterval(checkReady); } }, 100);

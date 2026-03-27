const { ipcRenderer, shell } = require('electron');

// Load PeerJS via CDN
const script = document.createElement('script');
script.src = "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js";
document.head.appendChild(script);

const initNexaFlow = () => {
    if (document.getElementById('nexa-overlay')) return;

    // 1. STYLES
    const style = document.createElement('style');
    style.textContent = `
        #nexa-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 999999; font-family: 'Segoe UI', sans-serif; }
        #nexa-social { 
            position: absolute; right: -320px; top: 0; width: 300px; height: 100%; 
            background: rgba(10, 10, 10, 0.98); border-left: 3px solid #ff4757; 
            transition: 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); pointer-events: auto; padding: 20px; color: white;
            box-shadow: -10px 0 30px rgba(0,0,0,0.5);
        }
        #nexa-social.open { right: 0; }
        .nexa-section-title { color: #ff4757; font-size: 12px; font-weight: 900; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; }
        
        #nexa-id-display { background: #222; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 11px; margin-bottom: 20px; border: 1px dashed #444; }
        
        #nexa-chat-history { height: 250px; background: #050505; overflow-y: auto; padding: 10px; font-size: 12px; border: 1px solid #222; margin-bottom: 10px; }
        .msg-in { color: #ff4757; margin-bottom: 5px; }
        .msg-out { color: #aaa; margin-bottom: 5px; }

        #nexa-menu { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #0a0a0a; border: 2px solid #ff4757; padding: 30px; 
            border-radius: 10px; display: none; pointer-events: auto; text-align: center; width: 320px;
        }
        .nexa-btn { width: 100%; padding: 12px; margin: 8px 0; border: none; border-radius: 4px; background: #ff4757; color: white; font-weight: 800; cursor: pointer; transition: 0.2s; }
        .nexa-btn:hover { background: #ff6b81; transform: scale(1.02); }
    `;
    document.head.appendChild(style);

    // 2. UI ELEMENTS
    const overlay = document.createElement('div');
    overlay.id = 'nexa-overlay';
    overlay.innerHTML = `
        <div id="nexa-menu">
            <h2 style="color:#ff4757; margin:0; letter-spacing:2px;">NEXAFLOW</h2>
            <p style="opacity:0.4; font-size:9px; margin-bottom:20px;">SYSTEM OVERRIDE // SIC CORP</p>
            <button class="nexa-btn" id="nexa-discord">JOIN DISCORD</button>
            <button class="nexa-btn" style="background:#222" onclick="location.reload()">RESTART GAME</button>
            <button class="nexa-btn" id="nexa-resume">RESUME</button>
        </div>

        <div id="nexa-social">
            <div class="nexa-section-title">YOUR NEXA ID</div>
            <div id="nexa-id-display">Connecting to Peer Network...</div>

            <div class="nexa-section-title">DIRECT MESSAGING</div>
            <input type="text" id="nexa-peer-target" placeholder="Enter Friend's ID..." style="width:100%; background:#111; border:1px solid #333; color:white; padding:8px; margin-bottom:10px; font-size:11px;">
            
            <div id="nexa-chat-history">
                <div style="opacity:0.5 italic">Welcome to the encrypted P2P chat.</div>
            </div>
            
            <input type="text" id="nexa-chat-input" placeholder="Type message & hit Enter..." style="width:100%; background:#222; border:none; color:white; padding:10px; font-size:12px;">
        </div>
    `;
    document.body.appendChild(overlay);

    // 3. PEERJS LOGIC
    let peer;
    let activeConn;

    const startPeer = () => {
        // Generates a random SIC-ID for the user
        const randomId = 'NEXA-' + Math.floor(1000 + Math.random() * 9000);
        peer = new Peer(randomId);

        peer.on('open', (id) => {
            document.getElementById('nexa-id-display').innerText = id;
            console.log('My Nexa ID is: ' + id);
        });

        // Listen for incoming messages
        peer.on('connection', (conn) => {
            activeConn = conn;
            conn.on('data', (data) => {
                addChatMessage(conn.peer, data, 'in');
            });
        });
    };

    const addChatMessage = (sender, msg, type) => {
        const history = document.getElementById('nexa-chat-history');
        const color = type === 'in' ? '#ff4757' : '#aaa';
        history.innerHTML += `<div class="msg-${type}"><b style="color:${color}">${sender}:</b> ${msg}</div>`;
        history.scrollTop = history.scrollHeight;
    };

    // Sending Logic
    document.getElementById('nexa-chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const msg = e.target.value;
            const targetId = document.getElementById('nexa-peer-target').value;

            if (!targetId) return alert("Enter a Friend's ID first!");

            if (!activeConn || activeConn.peer !== targetId) {
                activeConn = peer.connect(targetId);
            }

            activeConn.on('open', () => {
                activeConn.send(msg);
                addChatMessage('You', msg, 'out');
                e.target.value = '';
            });
        }
    });

    // 4. GENERAL UI LOGIC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.stopImmediatePropagation();
            const menu = document.getElementById('nexa-menu');
            const show = menu.style.display !== 'block';
            menu.style.display = show ? 'block' : 'none';
            document.getElementById('nexa-social').classList.toggle('open', show);
            if (show) document.exitPointerLock();
            else document.body.requestPointerLock();
        }
    }, true);

    document.getElementById('nexa-discord').onclick = () => {
        ipcRenderer.send('open-discord', 'https://discord.gg/YOUR_LINK');
    };

    document.getElementById('nexa-resume').onclick = () => {
        document.getElementById('nexa-menu').style.display = 'none';
        document.getElementById('nexa-social').classList.remove('open');
        document.body.requestPointerLock();
    };

    setTimeout(startPeer, 1000);
};

const checkReady = setInterval(() => {
    if (document.body) {
        initNexaFlow();
        clearInterval(checkReady);
    }
}, 100);

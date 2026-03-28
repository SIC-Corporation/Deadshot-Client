const { ipcRenderer } = require('electron');

// 1. Grab Webhook safely from launch arguments
const args = process.argv.filter(arg => arg.startsWith('--webhook='));
const GLOBAL_WEBHOOK = args.length > 0 ? args[0].split('=')[1] : null;
const STAFF_CHAT_WEBHOOK = GLOBAL_WEBHOOK; // You can swap this for a private staff link later

const initNexaFlow = () => {
    if (document.getElementById('nexa-overlay')) return;

    // --- SOUND SYSTEM ---
    const sfx = {
        click: new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3'),
        msg: new Audio('https://www.soundjay.com/communication/sounds/message-marimba-01.mp3'),
        startup: new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3')
    };
    const playSound = (type) => { sfx[type].volume = 0.3; sfx[type].play().catch(() => {}); };

    // --- STYLES ---
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
        .nexa-section-title { color: #ff4757; font-size: 11px; font-weight: 900; letter-spacing: 2px; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 15px;}
        #nexa-id-display { background: #111; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 11px; border: 1px dashed #444; text-align: center; color: #00ff00; }
        #nexa-chat-history { height: 280px; background: #050505; overflow-y: auto; padding: 10px; font-size: 11px; border: 1px solid #222; border-radius: 5px; margin-bottom: 10px; }
        .msg-line { margin-bottom: 8px; border-left: 2px solid #333; padding-left: 8px; }
        #nexa-menu { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #0a0a0a; border: 2px solid #ff4757; padding: 40px; border-radius: 15px; display: none; pointer-events: auto; text-align: center; width: 350px; box-shadow: 0 0 50px rgba(255, 71, 87, 0.2); }
        .nexa-btn { width: 100%; padding: 14px; margin: 10px 0; border: none; border-radius: 5px; background: #ff4757; color: white; font-weight: 800; cursor: pointer; text-transform: uppercase; }
        .mode-selector { display: flex; gap: 5px; margin-bottom: 10px; }
        .mode-btn { flex: 1; padding: 8px; font-size: 10px; font-weight: bold; cursor: pointer; border: none; color: white; border-radius: 4px; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'nexa-overlay';
    overlay.innerHTML = `
        <div id="nexa-menu">
            <h1 style="color:#ff4757; margin:0; letter-spacing:3px;">NEXAFLOW</h1>
            <p style="opacity:0.5; font-size:10px; margin-bottom:25px;">SIC CORP // SYSTEM OVERRIDE</p>
            <button class="nexa-btn" id="nexa-discord">JOIN DISCORD</button>
            <button class="nexa-btn" id="nexa-resume">RESUME GAME</button>
        </div>
        <div id="nexa-social">
            <div class="nexa-section-title">IDENTITY</div>
            <div id="nexa-id-display">BOOTING...</div>
            <div class="nexa-section-title">CHANNELS</div>
            <div class="mode-selector">
                <button id="btn-global" class="mode-btn" style="background:#5865F2;">GLOBAL</button>
                <button id="btn-private" class="mode-btn" style="background:#333;">PRIVATE DM</button>
            </div>
            <input type="text" id="nexa-peer-target" placeholder="TARGET USER ID..." style="width:100%; background:#111; border:1px solid #ff4757; color:white; padding:10px; margin-bottom:10px; font-size:10px; display:none; outline:none;">
            <div id="nexa-chat-history"></div>
            <input type="text" id="nexa-chat-input" placeholder="Enter message..." style="width:100%; background:#1a1a1a; border:1px solid #333; color:white; padding:12px; font-size:12px; border-radius:5px; outline:none;">
        </div>
    `;
    document.body.appendChild(overlay);

    let chatMode = 'global';
    const myId = 'NEXA-' + Math.floor(1000 + Math.random() * 9999);
    document.getElementById('nexa-id-display').innerText = myId;
    playSound('startup');

    const addMsg = (user, msg, color, prefix) => {
        const hist = document.getElementById('nexa-chat-history');
        hist.innerHTML += `<div class="msg-line"><b style="color:${color}">${prefix} ${user}:</b> <span style="color:#eee;">${msg}</span></div>`;
        hist.scrollTop = hist.scrollHeight;
        playSound('msg');
    };

    document.getElementById('btn-global').onclick = () => { chatMode = 'global'; document.getElementById('btn-global').style.background = '#5865F2'; document.getElementById('btn-private').style.background = '#333'; document.getElementById('nexa-peer-target').style.display = 'none'; playSound('click'); };
    document.getElementById('btn-private').onclick = () => { chatMode = 'private'; document.getElementById('btn-global').style.background = '#333'; document.getElementById('btn-private').style.background = '#ff4757'; document.getElementById('nexa-peer-target').style.display = 'block'; playSound('click'); };

    document.getElementById('nexa-chat-input').onkeydown = (e) => {
        if (e.key === 'Enter') {
            const val = e.target.value.trim();
            if (!val || !GLOBAL_WEBHOOK) return;

            if (chatMode === 'global') {
                fetch(GLOBAL_WEBHOOK, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: `[GLOBAL] ${myId}`, content: val}) });
                addMsg('You', val, '#5865F2', '[GLOBAL]');
            } else {
                const target = document.getElementById('nexa-peer-target').value || "Unknown";
                fetch(STAFF_CHAT_WEBHOOK, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: `[DM MONITOR]`, content: `**FROM:** ${myId}\n**TO:** ${target}\n**MSG:** ${val}`}) });
                addMsg('You', val, '#ff4757', `[TO ${target}]`);
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
            playSound('click');
        }
    }, true);

    document.getElementById('nexa-discord').onclick = () => ipcRenderer.send('open-discord', 'https://discord.gg/YOUR_LINK');
    document.getElementById('nexa-resume').onclick = () => { document.getElementById('nexa-menu').style.display = 'none'; document.getElementById('nexa-social').classList.remove('open'); };
};

const checkReady = setInterval(() => { if (document.body) { initNexaFlow(); clearInterval(checkReady); } }, 100);

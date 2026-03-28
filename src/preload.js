const { ipcRenderer } = require('electron');

const getArg = (key) => {
    const found = process.argv.find(arg => arg.startsWith(`--${key}=`));
    return found ? found.split('=')[1] : null;
};

const GLOBAL_WEBHOOK = getArg('webhook');
const STAFF_CHAT_WEBHOOK = getArg('staffhook');

const initNexaFlow = () => {
    if (document.getElementById('nexa-overlay')) return;

    const sfx = {
        click: new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3'),
        msg: new Audio('https://www.soundjay.com/communication/sounds/message-marimba-01.mp3')
    };
    const playSound = (t) => { sfx[t].volume = 0.2; sfx[t].play().catch(()=>{}); };

    const style = document.createElement('style');
    style.textContent = `
        #nexa-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 999999; font-family: 'Segoe UI', sans-serif; }
        #nexa-fps { position: absolute; top: 10px; left: 10px; color: #ff4757; font-family: monospace; font-weight: bold; font-size: 14px; text-shadow: 1px 1px #000; }
        #nexa-social { position: absolute; right: -320px; top: 0; width: 300px; height: 100%; background: rgba(10, 10, 10, 0.98); border-left: 2px solid #ff4757; transition: 0.3s; pointer-events: auto; padding: 20px; color: white; }
        #nexa-social.open { right: 0; }
        .nexa-section-title { color: #ff4757; font-size: 10px; font-weight: 900; letter-spacing: 2px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 15px; text-transform: uppercase;}
        #nexa-chat-history { height: 250px; background: #050505; overflow-y: auto; padding: 10px; font-size: 11px; border: 1px solid #222; margin-bottom: 10px; border-radius: 4px; }
        #nexa-menu, #nexa-settings-panel { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #0a0a0a; border: 2px solid #ff4757; padding: 30px; border-radius: 10px; display: none; pointer-events: auto; text-align: center; width: 320px; }
        .nexa-btn { width: 100%; padding: 12px; margin: 8px 0; border: none; border-radius: 4px; background: #ff4757; color: white; font-weight: 800; cursor: pointer; text-transform: uppercase; font-size: 11px;}
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'nexa-overlay';
    overlay.innerHTML = `
        <div id="nexa-fps">FPS: 0</div>
        
        <div id="nexa-menu">
            <h2 style="color:#ff4757; margin:0;">NEXAFLOW v1.1.0</h2>
            <p style="opacity:0.5; font-size:9px; margin-bottom:20px;">SIC CORP ELITE OVERRIDE</p>
            <button class="nexa-btn" id="nexa-discord">SIC CORP DISCORD</button>
            <button class="nexa-btn" id="nexa-settings-btn" style="background:#222">CLIENT SETTINGS</button>
            <button class="nexa-btn" id="nexa-resume">RESUME</button>
        </div>

        <div id="nexa-settings-panel">
            <h3 style="color:#ff4757; margin-top:0;">SETTINGS</h3>
            <div style="text-align:left; font-size:12px; color:#ccc;">
                <label><input type="checkbox" id="chk-fps" checked> Show FPS Counter</label><br><br>
                <label><input type="checkbox" id="chk-sfx" checked> Enable UI Sounds</label>
            </div>
            <button class="nexa-btn" id="nexa-settings-back" style="margin-top:20px; background:#333;">BACK</button>
        </div>

        <div id="nexa-social">
            <div class="nexa-section-title">Identity</div>
            <div id="nexa-id-display" style="background:#111; padding:8px; border-radius:4px; font-family:monospace; font-size:10px; text-align:center; color:#0f0; margin-bottom:10px;">...</div>
            <div class="nexa-section-title">Channel</div>
            <div style="display:flex; gap:5px; margin-bottom:10px;">
                <button id="btn-global" style="flex:1; background:#5865F2; color:white; border:none; padding:8px; font-size:10px; cursor:pointer;">GLOBAL</button>
                <button id="btn-private" style="flex:1; background:#333; color:white; border:none; padding:8px; font-size:10px; cursor:pointer;">STAFF DM</button>
            </div>
            <input type="text" id="nexa-peer-target" placeholder="TARGET NAME..." style="width:100%; background:#111; border:1px solid #ff4757; color:white; padding:8px; margin-bottom:10px; font-size:10px; display:none; outline:none;">
            <div id="nexa-chat-history"></div>
            <input type="text" id="nexa-chat-input" placeholder="Press Enter to send..." style="width:100%; background:#1a1a1a; border:1px solid #333; color:white; padding:12px; font-size:11px; outline:none; border-radius:4px;">
        </div>
    `;
    document.body.appendChild(overlay);

    let chatMode = 'global';
    const myId = 'NEXA-' + Math.floor(1000 + Math.random() * 9999);
    document.getElementById('nexa-id-display').innerText = myId;

    // --- FPS ENGINE ---
    let lastTime = performance.now();
    let frames = 0;
    const updateFPS = () => {
        frames++;
        const now = performance.now();
        if (now >= lastTime + 1000) {
            document.getElementById('nexa-fps').innerText = `FPS: ${frames}`;
            frames = 0; lastTime = now;
        }
        requestAnimationFrame(updateFPS);
    };
    updateFPS();

    // --- DISCORD WEBHOOK LOGIC ---
    const sendToDiscord = (url, user, msg, threadName = null) => {
        if (!url) return;
        const payload = { username: user, content: msg };
        // Thread support for Staff DMs
        if (threadName) payload.thread_name = threadName;
        
        fetch(url, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(payload) 
        });
    };

    const addMsg = (user, msg, color) => {
        const hist = document.getElementById('nexa-chat-history');
        hist.innerHTML += `<div style="margin-bottom:8px; line-height:1.2;"><b style="color:${color}">${user}:</b> <span style="color:#eee;">${msg}</span></div>`;
        hist.scrollTop = hist.scrollHeight;
        if (document.getElementById('chk-sfx').checked) playSound('msg');
    };

    // --- BUTTON EVENTS ---
    document.getElementById('btn-global').onclick = () => { chatMode = 'global'; document.getElementById('btn-global').style.background='#5865F2'; document.getElementById('btn-private').style.background='#333'; document.getElementById('nexa-peer-target').style.display='none'; if(document.getElementById('chk-sfx').checked) playSound('click');};
    document.getElementById('btn-private').onclick = () => { chatMode = 'private'; document.getElementById('btn-global').style.background='#333'; document.getElementById('btn-private').style.background='#ff4757'; document.getElementById('nexa-peer-target').style.display='block'; if(document.getElementById('chk-sfx').checked) playSound('click');};

    document.getElementById('nexa-settings-btn').onclick = () => {
        document.getElementById('nexa-menu').style.display = 'none';
        document.getElementById('nexa-settings-panel').style.display = 'block';
    };
    document.getElementById('nexa-settings-back').onclick = () => {
        document.getElementById('nexa-settings-panel').style.display = 'none';
        document.getElementById('nexa-menu').style.display = 'block';
    };

    document.getElementById('chk-fps').onchange = (e) => { document.getElementById('nexa-fps').style.display = e.target.checked ? 'block' : 'none'; };

    document.getElementById('nexa-chat-input').onkeydown = (e) => {
        if (e.key === 'Enter') {
            const val = e.target.value.trim();
            if (!val) return;
            if (chatMode === 'global') {
                sendToDiscord(GLOBAL_WEBHOOK, `[GLOBAL] ${myId}`, val);
                addMsg('You', val, '#5865F2');
            } else {
                const target = document.getElementById('nexa-peer-target').value || "Staff";
                // STAFF DMs get sent to a thread named after the user for clean logging
                sendToDiscord(STAFF_CHAT_WEBHOOK, `Nexa DM Log`, `**TO ${target}:** ${val}`, `Log-${myId}`);
                addMsg(`TO ${target}`, val, '#ff4757');
            }
            e.target.value = '';
        }
    };

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const menu = document.getElementById('nexa-menu');
            const sett = document.getElementById('nexa-settings-panel');
            const isAnyOpen = menu.style.display === 'block' || sett.style.display === 'block';
            
            if (isAnyOpen) {
                menu.style.display = 'none';
                sett.style.display = 'none';
                document.getElementById('nexa-social').classList.remove('open');
            } else {
                menu.style.display = 'block';
                document.getElementById('nexa-social').classList.add('open');
                if(document.getElementById('chk-sfx').checked) playSound('click');
            }
        }
    }, true);

    document.getElementById('nexa-resume').onclick = () => { 
        document.getElementById('nexa-menu').style.display = 'none'; 
        document.getElementById('nexa-social').classList.remove('open'); 
    };
};

const checkReady = setInterval(() => { if (document.body) { initNexaFlow(); clearInterval(checkReady); } }, 100);

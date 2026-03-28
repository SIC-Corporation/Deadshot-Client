const { ipcRenderer, shell } = require('electron');

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
    const playSound = (t) => { if(document.getElementById('chk-sfx')?.checked) { sfx[t].volume = 0.2; sfx[t].play().catch(()=>{}); } };

    const style = document.createElement('style');
    style.textContent = `
        #nexa-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 2147483647; font-family: 'Segoe UI', sans-serif; }
        
        #nexa-fps { 
            position: absolute; top: 15px; left: 15px; 
            background: rgba(0,0,0,0.8); color: #ff4757; 
            padding: 6px 14px; border-radius: 4px; border-left: 4px solid #ff4757;
            font-family: 'Consolas', monospace; font-weight: 900; font-size: 14px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }

        #nexa-social { 
            position: absolute; left: -320px; top: 0; width: 300px; height: 100%; 
            background: rgba(5, 5, 5, 0.98); border-right: 2px solid #ff4757;
            transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); pointer-events: auto; padding: 25px; color: white;
            box-shadow: 10px 0 30px rgba(0,0,0,0.9);
        }
        #nexa-social.open { left: 0; }

        .nexa-section-title { color: #ff4757; font-size: 10px; font-weight: 900; letter-spacing: 2px; border-bottom: 1px solid #222; padding-bottom: 5px; margin-top: 25px; text-transform: uppercase;}
        #nexa-chat-history { height: calc(100% - 300px); background: #000; overflow-y: auto; padding: 12px; font-size: 12px; border: 1px solid #1a1a1a; margin: 15px 0; border-radius: 4px; border-left: 2px solid #333; }
        
        #nexa-menu, #nexa-settings-panel { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
            background: #0a0a0a; border: 1px solid #ff4757; padding: 40px; 
            border-radius: 4px; display: none; pointer-events: auto; text-align: center; 
            width: 340px; box-shadow: 0 0 100px rgba(0,0,0,1);
        }

        .nexa-btn { 
            width: 100%; padding: 14px; margin: 10px 0; border: 1px solid #333; border-radius: 2px; 
            background: #111; color: white; font-weight: 800; cursor: pointer; 
            text-transform: uppercase; font-size: 11px; transition: 0.15s; outline: none;
        }
        .nexa-btn:hover { background: #ff4757; border-color: #ff4757; transform: translateY(-2px); }
        .primary-btn { background: #ff4757; border-color: #ff4757; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'nexa-overlay';
    overlay.innerHTML = `
        <div id="nexa-fps">FPS: 000</div>
        
        <div id="nexa-menu">
            <h1 style="color:#ff4757; margin:0; font-size: 32px; letter-spacing: -1px;">NEXA<span style="color:white">FLOW</span></h1>
            <p style="opacity:0.4; font-size:9px; margin-bottom:30px; letter-spacing:4px;">SYSTEM VERSION 1.0.0</p>
            
            <button class="nexa-btn primary-btn" id="nexa-resume">RESUME GAME</button>
            <button class="nexa-btn" id="nexa-discord-btn">SIC CORP DISCORD</button>
            <button class="nexa-btn" id="nexa-settings-btn">CLIENT SETTINGS</button>
        </div>

        <div id="nexa-settings-panel">
            <h3 style="color:#ff4757; margin-top:0; letter-spacing:1px;">SETTINGS</h3>
            <div style="text-align:left; font-size:12px; color:#ccc; background:#000; padding:20px; border:1px solid #1a1a1a;">
                <label style="display:flex; justify-content:space-between; cursor:pointer;">SHOW FPS <input type="checkbox" id="chk-fps" checked></label>
                <div style="margin:15px 0; border-top:1px solid #1a1a1a;"></div>
                <label style="display:flex; justify-content:space-between; cursor:pointer;">UI SOUNDS <input type="checkbox" id="chk-sfx" checked></label>
            </div>
            <button class="nexa-btn" id="nexa-settings-back" style="margin-top:20px;">BACK</button>
        </div>

        <div id="nexa-social">
            <div class="nexa-section-title">Identity</div>
            <div id="nexa-id-display" style="background:#111; padding:12px; border-radius:2px; font-family:monospace; font-size:11px; text-align:center; color:#0f0; margin-top:10px; border:1px solid #222;">...</div>
            
            <div class="nexa-section-title">Discord Bridge</div>
            <div style="display:flex; gap:5px; margin-top:10px;">
                <button id="btn-global" style="flex:1; background:#5865F2; color:white; border:none; padding:10px; font-size:10px; cursor:pointer; font-weight:bold;">GLOBAL</button>
                <button id="btn-private" style="flex:1; background:#222; color:white; border:none; padding:10px; font-size:10px; cursor:pointer; font-weight:bold;">STAFF</button>
            </div>
            
            <input type="text" id="nexa-peer-target" placeholder="TARGET UID..." style="width:100%; background:#000; border:1px solid #ff4757; color:white; padding:12px; margin-top:10px; font-size:10px; display:none; outline:none;">
            <div id="nexa-chat-history"></div>
            <input type="text" id="nexa-chat-input" placeholder="Type message..." style="width:100%; background:#111; border:1px solid #222; color:white; padding:14px; font-size:11px; outline:none;">
        </div>
    `;
    document.body.appendChild(overlay);

    const closeAll = () => {
        document.getElementById('nexa-menu').style.display = 'none';
        document.getElementById('nexa-settings-panel').style.display = 'none';
        document.getElementById('nexa-social').classList.remove('open');
    };

    // --- BUTTONS ---
    document.getElementById('nexa-resume').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        closeAll();
        playSound('click');
    };

    document.getElementById('nexa-discord-btn').onclick = (e) => {
        e.preventDefault();
        // Replace with your link
        shell.openExternal('https://discord.gg/siccorp'); 
        playSound('click');
    };

    document.getElementById('nexa-settings-btn').onclick = () => {
        document.getElementById('nexa-menu').style.display = 'none';
        document.getElementById('nexa-settings-panel').style.display = 'block';
        playSound('click');
    };

    document.getElementById('nexa-settings-back').onclick = () => {
        document.getElementById('nexa-settings-panel').style.display = 'none';
        document.getElementById('nexa-menu').style.display = 'block';
        playSound('click');
    };

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

    // --- ESCAPE KEY HANDLER ---
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const menu = document.getElementById('nexa-menu');
            const isVisible = (menu.style.display === 'block' || document.getElementById('nexa-settings-panel').style.display === 'block');
            
            if (isVisible) {
                closeAll();
            } else {
                menu.style.display = 'block';
                document.getElementById('nexa-social').classList.add('open');
                playSound('click');
            }
        }
    }, true);
};

const checkReady = setInterval(() => { if (document.body) { initNexaFlow(); clearInterval(checkReady); } }, 100);

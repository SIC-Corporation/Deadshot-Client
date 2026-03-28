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

    const playSound = (t) => { 
        if(document.getElementById('chk-sfx')?.checked) { 
            sfx[t].volume = 0.2; 
            sfx[t].play().catch(()=>{}); 
        } 
    };

    const style = document.createElement('style');
    style.textContent = `
        #nexa-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 2147483647; font-family: 'Segoe UI', sans-serif; }
        
        #nexa-fps { 
            position: absolute; top: 15px; left: 15px; 
            background: rgba(0,0,0,0.8); color: #ff4757; 
            padding: 6px 14px; border-radius: 4px; border-left: 4px solid #ff4757;
            font-family: 'Consolas', monospace; font-weight: 900; font-size: 14px; 
        }

        #nexa-social { 
            position: absolute; left: -320px; top: 0; width: 300px; height: 100%; 
            background: rgba(5, 5, 5, 0.98); border-right: 2px solid #ff4757;
            transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); pointer-events: auto; padding: 25px; color: white;
            box-shadow: 10px 0 30px rgba(0,0,0,0.9);
        }
        #nexa-social.open { left: 0; }

        #nexa-menu, #nexa-settings-panel { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
            background: #0a0a0a; border: 1px solid #ff4757; padding: 40px; 
            border-radius: 4px; display: none; pointer-events: auto; text-align: center; 
            width: 360px; box-shadow: 0 0 100px rgba(0,0,0,1);
        }

        .nexa-btn { 
            width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #333; border-radius: 2px; 
            background: #111; color: white; font-weight: 800; cursor: pointer; 
            text-transform: uppercase; font-size: 11px; transition: 0.15s;
        }
        .nexa-btn:hover { background: #ff4757; border-color: #ff4757; }
        .danger-btn { border-color: #721c24; color: #f8d7da; }
        .danger-btn:hover { background: #721c24; }

        .setting-row { display: flex; justify-content: space-between; align-items: center; margin: 10px 0; font-size: 12px; color: #ccc; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'nexa-overlay';
    overlay.innerHTML = `
        <div id="nexa-fps">FPS: 000</div>
        
        <div id="nexa-menu">
            <h1 style="color:#ff4757; margin:0; font-size: 32px;">NEXA<span style="color:white">FLOW</span></h1>
            <p style="opacity:0.4; font-size:9px; margin-bottom:25px; letter-spacing:4px;">V1.0.0 | SIC CORP</p>
            
            <button class="nexa-btn" id="nexa-resume" style="background:#ff4757;">RESUME</button>
            <button class="nexa-btn" id="nexa-settings-btn">SETTINGS & BOOST</button>
            <button class="nexa-btn" id="nexa-discord-btn">SIC CORP DISCORD</button>
            <button class="nexa-btn danger-btn" id="nexa-quit">QUIT CLIENT</button>
        </div>

        <div id="nexa-settings-panel">
            <h3 style="color:#ff4757; margin-bottom:20px;">SYSTEM SETTINGS</h3>
            <div class="setting-row">SHOW FPS <input type="checkbox" id="chk-fps" checked></div>
            <div class="setting-row">UI SOUNDS <input type="checkbox" id="chk-sfx" checked></div>
            <hr style="border:0; border-top:1px solid #222; margin:15px 0;">
            <button class="nexa-btn" id="btn-boost-ram" style="color:#0f0; border-color:#0f0;">🚀 BOOST RAM</button>
            <button class="nexa-btn" id="nexa-settings-back">BACK</button>
        </div>

        <div id="nexa-social">
            <div style="color:#ff4757; font-weight:900; font-size:10px; letter-spacing:2px;">GLOBAL CHAT</div>
            <div id="nexa-chat-history" style="height:70%; background:#000; margin:15px 0; border:1px solid #222; overflow-y:auto; padding:10px; font-size:12px;"></div>
            <input type="text" id="nexa-chat-input" placeholder="Message..." style="width:100%; background:#111; border:1px solid #ff4757; color:white; padding:10px; outline:none;">
        </div>
    `;
    document.body.appendChild(overlay);

    const closeAll = () => {
        document.getElementById('nexa-menu').style.display = 'none';
        document.getElementById('nexa-settings-panel').style.display = 'none';
        document.getElementById('nexa-social').classList.remove('open');
    };

    // --- LOGIC ---
    document.getElementById('nexa-resume').onclick = () => { closeAll(); playSound('click'); };
    document.getElementById('nexa-quit').onclick = () => { ipcRenderer.send('quit-app'); };
    
    document.getElementById('btn-boost-ram').onclick = () => {
        ipcRenderer.send('clean-ram');
        const btn = document.getElementById('btn-boost-ram');
        btn.innerText = "RAM CLEANED!";
        setTimeout(() => btn.innerText = "🚀 BOOST RAM", 2000);
        playSound('msg');
    };

    document.getElementById('nexa-settings-btn').onclick = () => {
        document.getElementById('nexa-menu').style.display = 'none';
        document.getElementById('nexa-settings-panel').style.display = 'block';
    };

    document.getElementById('nexa-settings-back').onclick = () => {
        document.getElementById('nexa-settings-panel').style.display = 'none';
        document.getElementById('nexa-menu').style.display = 'block';
    };

    // FPS Counter
    let lastTime = performance.now();
    let frames = 0;
    const updateFPS = () => {
        frames++;
        const now = performance.now();
        if (now >= lastTime + 1000) {
            if(document.getElementById('chk-fps').checked) {
                document.getElementById('nexa-fps').style.display = 'block';
                document.getElementById('nexa-fps').innerText = `FPS: ${frames}`;
            } else {
                document.getElementById('nexa-fps').style.display = 'none';
            }
            frames = 0; lastTime = now;
        }
        requestAnimationFrame(updateFPS);
    };
    updateFPS();

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const menu = document.getElementById('nexa-menu');
            if (menu.style.display === 'block') {
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

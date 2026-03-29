const { ipcRenderer, shell } = require('electron');

const getArg = (key) => {
    const found = process.argv.find(arg => arg.startsWith(`--${key}=`));
    return found ? found.split('=')[1] : null;
};

const initNexaFlow = () => {
    if (document.getElementById('nexa-overlay')) return;

    const sfx = { click: new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3') };
    const playSound = () => { if(document.getElementById('chk-sfx')?.checked) { sfx.click.volume = 0.2; sfx.click.play().catch(()=>{}); } };

    const style = document.createElement('style');
    style.textContent = `
        #nexa-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 2147483647; font-family: 'Segoe UI', sans-serif; }
        #nexa-fps { position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.8); color: #ff4757; padding: 6px 14px; border-radius: 4px; border-left: 4px solid #ff4757; font-family: monospace; font-weight: 900; }
        #nexa-menu, #nexa-settings-panel { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #0a0a0a; border: 1px solid #ff4757; padding: 40px; border-radius: 4px; display: none; pointer-events: auto; text-align: center; width: 360px; box-shadow: 0 0 100px #000; }
        .nexa-btn { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #333; border-radius: 2px; background: #111; color: white; font-weight: 800; cursor: pointer; text-transform: uppercase; font-size: 11px; }
        .nexa-btn:hover { background: #ff4757; border-color: #ff4757; }
        .danger-btn { border-color: #441111; color: #f8d7da; }
        .danger-btn:hover { background: #721c24; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'nexa-overlay';
    overlay.innerHTML = `
        <div id="nexa-fps">FPS: 000</div>
        <div id="nexa-menu">
            <h1 style="color:#ff4757; margin:0;">NEXA<span style="color:white">FLOW</span></h1>
            <p style="opacity:0.4; font-size:9px; margin-bottom:25px;">V1.0.0 | SIC CORP</p>
            <button class="nexa-btn" id="nexa-resume" style="background:#ff4757;">RESUME</button>
            <button class="nexa-btn" id="nexa-leave-lobby">LEAVE LOBBY</button>
            <button class="nexa-btn" id="nexa-settings-btn">SETTINGS & BOOST</button>
            <button class="nexa-btn danger-btn" id="nexa-quit">QUIT CLIENT (Double Click)</button>
        </div>
        <div id="nexa-settings-panel">
            <h3 style="color:#ff4757;">BOOST SETTINGS</h3>
            <button class="nexa-btn" id="btn-boost-ram" style="color:#0f0;">🚀 ACTIVATE RAM PURGE</button>
            <div style="margin:10px; color:#ccc; font-size:10px;"><input type="checkbox" id="chk-sfx" checked> UI SOUNDS</div>
            <button class="nexa-btn" id="nexa-settings-back">BACK</button>
        </div>
    `;
    document.body.appendChild(overlay);

    const closeAll = () => { document.getElementById('nexa-menu').style.display = 'none'; document.getElementById('nexa-settings-panel').style.display = 'none'; };

    // --- BUTTON LOGIC ---
    document.getElementById('nexa-resume').onclick = () => { closeAll(); playSound(); };
    
    // Leave Lobby - Forces the game back to main menu
    document.getElementById('nexa-leave-lobby').onclick = () => {
        window.location.href = "https://deadshot.io/"; 
        closeAll();
    };

    // Quit Client - Safety double click
    let quitClicks = 0;
    document.getElementById('nexa-quit').onclick = () => {
        quitClicks++;
        if(quitClicks === 1) {
            document.getElementById('nexa-quit').innerText = "ARE YOU SURE?";
            setTimeout(() => { quitClicks = 0; document.getElementById('nexa-quit').innerText = "QUIT CLIENT (Double Click)"; }, 2000);
        } else {
            ipcRenderer.send('quit-app');
        }
    };

    document.getElementById('btn-boost-ram').onclick = () => {
        ipcRenderer.send('clean-ram');
        document.getElementById('btn-boost-ram').innerText = "RAM PURGED!";
        setTimeout(() => document.getElementById('btn-boost-ram').innerText = "🚀 ACTIVATE RAM PURGE", 2000);
    };

    document.getElementById('nexa-settings-btn').onclick = () => {
        document.getElementById('nexa-menu').style.display = 'none';
        document.getElementById('nexa-settings-panel').style.display = 'block';
    };

    document.getElementById('nexa-settings-back').onclick = () => {
        document.getElementById('nexa-settings-panel').style.display = 'none';
        document.getElementById('nexa-menu').style.display = 'block';
    };

    // FPS Counter Engine
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

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const menu = document.getElementById('nexa-menu');
            if (menu.style.display === 'block' || document.getElementById('nexa-settings-panel').style.display === 'block') {
                closeAll();
            } else {
                menu.style.display = 'block';
                playSound();
            }
        }
    }, true);
};

const checkReady = setInterval(() => { if (document.body) { initNexaFlow(); clearInterval(checkReady); } }, 100);

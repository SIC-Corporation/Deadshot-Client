const { ipcRenderer } = require('electron');

const initNexaFlow = () => {
    if (document.getElementById('nexa-overlay-container')) return;

    const style = document.createElement('style');
    style.textContent = `
        /* HIDE GAME ADS & NATIVE UI ELEMENTS */
        #ad-container, .ad-unit, .home-right, .home-left, #canvas-holder + div[style*="position: absolute"] { 
            display: none !important; visibility: hidden !important; pointer-events: none !important;
        }

        #nexa-overlay-container {
            position: fixed !important; top: 0 !important; left: 0 !important;
            width: 100vw !important; height: 100vh !important;
            pointer-events: none !important; z-index: 9999999 !important;
        }
        #nexa-fps-hud {
            position: absolute !important; top: 15px !important; left: 15px !important;
            background: rgba(10, 10, 10, 0.9) !important; border-left: 4px solid #ff4757 !important;
            padding: 8px 12px !important; border-radius: 4px !important;
            color: white !important; font-family: 'Segoe UI', Arial !important;
        }
        .nexa-menu-card {
            position: absolute !important; top: 50% !important; left: 50% !important;
            transform: translate(-50%, -50%) !important; background: #0f0f0f !important;
            border: 2px solid #ff4757 !important; padding: 30px !important;
            border-radius: 12px !important; text-align: center !important; color: white !important;
            display: none; width: 320px !important; pointer-events: auto !important;
            box-shadow: 0 0 40px rgba(0,0,0,0.8) !important;
        }
        .nexa-btn {
            background: #ff4757 !important; color: white !important; border: none !important;
            padding: 12px !important; width: 100% !important; margin-top: 10px !important;
            cursor: pointer !important; font-weight: 800 !important; border-radius: 5px !important;
            transition: 0.2s !important;
        }
        .nexa-btn:hover { background: #ff6b81 !important; transform: scale(1.02); }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'nexa-overlay-container';
    document.body.appendChild(container);

    container.innerHTML = `
        <div id="nexa-fps-hud">
            <div style="font-size: 9px; color: #ff4757; font-weight: 900;">NEXAFLOW v1.1.1</div>
            <div style="font-size: 20px; font-weight: 800;"><span id="fps-val">--</span> <span style="font-size: 10px; opacity: 0.5;">FPS</span></div>
        </div>
        <div id="nexa-esc-menu" class="nexa-menu-card">
            <h2 style="margin: 0; color: #ff4757; letter-spacing: 2px;">SYSTEM PAUSED</h2>
            <p style="font-size: 11px; opacity: 0.6; margin-bottom: 20px;">SIC CORP // NEXAFLOW CLIENT</p>
            <button class="nexa-btn" onclick="location.reload()">RELOAD GAME</button>
            <button class="nexa-btn" style="background: #222 !important;" id="close-nexa">RESUME</button>
            <button class="nexa-btn" style="background: #111 !important;" onclick="ipcRenderer.send('app-quit-action')">QUIT TO DESKTOP</button>
        </div>
    `;

    // FPS Loop
    let frames = 0, lastTime = performance.now();
    const update = () => {
        frames++;
        let now = performance.now();
        if (now - lastTime >= 1000) {
            const fpsEl = document.getElementById('fps-val');
            if (fpsEl) fpsEl.innerText = frames;
            frames = 0; lastTime = now;
        }
        requestAnimationFrame(update);
    }
    update();

    // KILL DOUBLE MENU: Keydown Hijack
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // This stops the game from seeing the ESC key
            e.stopImmediatePropagation();
            e.preventDefault();

            const menu = document.getElementById('nexa-esc-menu');
            const show = menu.style.display !== 'block';
            
            menu.style.display = show ? 'block' : 'none';
            container.style.pointerEvents = show ? 'auto' : 'none';

            if (show) {
                document.exitPointerLock(); 
            } else {
                document.body.requestPointerLock();
            }
        }
    }, true); // "true" ensures NexaFlow grabs the key BEFORE the game

    document.getElementById('close-nexa').onclick = () => {
        document.getElementById('nexa-esc-menu').style.display = 'none';
        container.style.pointerEvents = 'none';
        document.body.requestPointerLock();
    };
};

window.addEventListener('DOMContentLoaded', () => {
    initNexaFlow();
    setInterval(initNexaFlow, 3000); 
});

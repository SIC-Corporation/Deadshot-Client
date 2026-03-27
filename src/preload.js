const { ipcRenderer } = require('electron');

const initNexaFlow = () => {
    if (document.getElementById('nexa-overlay-container')) return;

    console.log("NexaFlow: Injecting SIC Corp HUD...");

    const style = document.createElement('style');
    style.textContent = `
        #nexa-overlay-container {
            position: fixed !important; top: 0 !important; left: 0 !important;
            width: 100vw !important; height: 100vh !important;
            pointer-events: none !important; z-index: 9999999 !important;
        }
        #nexa-fps-hud {
            position: absolute !important; top: 15px !important; left: 15px !important;
            background: rgba(0, 0, 0, 0.85) !important; border-left: 4px solid #ff4757 !important;
            padding: 10px 15px !important; border-radius: 5px !important;
            color: white !important; font-family: 'Segoe UI', Arial !important;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5) !important;
        }
        .nexa-menu-card {
            position: absolute !important; top: 50% !important; left: 50% !important;
            transform: translate(-50%, -50%) !important; background: #0a0a0a !important;
            border: 2px solid #ff4757 !important; padding: 35px !important;
            border-radius: 12px !important; text-align: center !important; color: white !important;
            display: none; width: 300px !important; pointer-events: auto !important;
        }
        .nexa-btn {
            background: #ff4757 !important; color: white !important; border: none !important;
            padding: 12px !important; width: 100% !important; margin-top: 10px !important;
            cursor: pointer !important; font-weight: 800 !important; border-radius: 5px !important;
        }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'nexa-overlay-container';
    document.body.appendChild(container);

    container.innerHTML = `
        <div id="nexa-fps-hud">
            <div style="font-size: 9px; color: #ff4757; font-weight: 900;">NEXAFLOW v1.1.1</div>
            <div style="font-size: 20px; font-weight: 800;"><span id="fps-val">--</span> <span style="font-size: 12px; opacity: 0.5;">FPS</span></div>
        </div>
        <div id="nexa-esc-menu" class="nexa-menu-card">
            <h2 style="margin: 0; color: #ff4757;">PAUSED</h2>
            <p style="font-size: 11px; opacity: 0.6;">SIC Corp Proprietary Software</p>
            <button class="nexa-btn" onclick="location.reload()">RELOAD GAME</button>
            <button class="nexa-btn" style="background: #222 !important;" id="close-nexa">RESUME</button>
        </div>
    `;

    // FPS Loop
    let frames = 0, lastTime = performance.now();
    const update = () => {
        frames++;
        let now = performance.now();
        if (now - lastTime >= 1000) {
            document.getElementById('fps-val').innerText = frames;
            frames = 0; lastTime = now;
        }
        requestAnimationFrame(update);
    }
    update();

    // Menu Logic
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const menu = document.getElementById('nexa-esc-menu');
            const show = menu.style.display !== 'block';
            menu.style.display = show ? 'block' : 'none';
            container.style.pointerEvents = show ? 'auto' : 'none';
        }
    });

    document.getElementById('close-nexa').onclick = () => {
        document.getElementById('nexa-esc-menu').style.display = 'none';
        container.style.pointerEvents = 'none';
    };
};

// Start injection once DOM is ready, then keep a safety loop running
window.addEventListener('DOMContentLoaded', () => {
    initNexaFlow();
    setInterval(initNexaFlow, 2500); // Safety check every 2.5 seconds
});

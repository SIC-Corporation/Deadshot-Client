const { ipcRenderer } = require('electron');

// 1. INJECT MASTER STYLES
const style = document.createElement('style');
style.textContent = `
    #nexa-overlay-container {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        pointer-events: none; z-index: 99999999; font-family: 'Segoe UI', Arial, sans-serif;
    }
    #nexa-fps-hud {
        position: absolute; top: 20px; left: 20px;
        background: rgba(0, 0, 0, 0.8); border-left: 4px solid #ff4757;
        padding: 10px 15px; border-radius: 4px; color: white;
        pointer-events: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    }
    .nexa-menu-card {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #111; border: 2px solid #ff4757; padding: 30px;
        border-radius: 12px; text-align: center; color: white;
        display: none; pointer-events: auto; width: 300px;
    }
    .nexa-btn {
        background: #ff4757; color: white; border: none; padding: 12px;
        width: 100%; margin-top: 10px; cursor: pointer; font-weight: bold;
        border-radius: 6px; transition: 0.2s;
    }
    .nexa-btn:hover { background: #ff6b81; transform: translateY(-2px); }
`;
document.head.appendChild(style);

// 2. INITIALIZE THE OVERLAY
const container = document.createElement('div');
container.id = 'nexa-overlay-container';
document.documentElement.appendChild(container);

container.innerHTML = `
    <div id="nexa-fps-hud">
        <div style="font-size: 10px; font-weight: 900; color: #ff4757; letter-spacing: 1px;">SIC CORP // NEXAFLOW</div>
        <div style="display: flex; align-items: baseline; gap: 5px;">
            <span id="fps-val" style="font-size: 22px; font-weight: 800; color: #fff;">--</span>
            <span style="font-size: 11px; font-weight: 600; opacity: 0.6;">FPS</span>
        </div>
    </div>

    <div id="nexa-esc-menu" class="nexa-menu-card">
        <h2 style="margin-bottom: 5px; color: #ff4757;">NEXAFLOW PAUSE</h2>
        <p style="font-size: 12px; opacity: 0.7; margin-bottom: 20px;">Client v1.1.1 | Developed by Roy</p>
        <button class="nexa-btn" onclick="location.reload()">RELOAD GAME</button>
        <button class="nexa-btn" style="background: #222;" onclick="alert('NexaFlow Client - SIC Corp Property')">ABOUT</button>
        <button class="nexa-btn" style="background: #333;" id="close-nexa">RESUME</button>
    </div>
`;

// 3. THE SMART FPS COUNTER
let frameCount = 0;
let lastTime = performance.now();
let fpsDisplay = document.getElementById('fps-val');

function updateFPS() {
    frameCount++;
    let currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        fpsDisplay.innerText = frameCount;
        frameCount = 0;
        lastTime = currentTime;
    }
    requestAnimationFrame(updateFPS);
}
updateFPS();

// 4. THE ESC & CLICK LOGIC
const escMenu = document.getElementById('nexa-esc-menu');

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const isShowing = escMenu.style.display === 'block';
        escMenu.style.display = isShowing ? 'none' : 'block';
        // Unlock mouse so we can click our menu buttons
        container.style.pointerEvents = isShowing ? 'none' : 'auto';
    }
});

document.getElementById('close-nexa').onclick = () => {
    escMenu.style.display = 'none';
    container.style.pointerEvents = 'none';
};

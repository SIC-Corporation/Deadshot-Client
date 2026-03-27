const { ipcRenderer } = require('electron');

const style = document.createElement('style');
style.textContent = `
    #nexa-overlay-container {
        position: fixed !important; top: 0 !important; left: 0 !important;
        width: 100vw !important; height: 100vh !important;
        pointer-events: none !important; z-index: 2147483647 !important;
        display: block !important; visibility: visible !important;
    }
    #nexa-fps-hud {
        position: absolute !important; top: 20px !important; left: 20px !important;
        background: rgba(10, 10, 10, 0.9) !important; border-left: 5px solid #ff4757 !important;
        padding: 12px 18px !important; border-radius: 6px !important; color: white !important;
        font-family: 'Segoe UI', sans-serif !important; pointer-events: auto !important;
    }
    .nexa-menu-card {
        position: absolute !important; top: 50% !important; left: 50% !important;
        transform: translate(-50%, -50%) !important; background: #0f0f0f !important;
        border: 2px solid #ff4757 !important; padding: 30px !important;
        border-radius: 12px !important; text-align: center !important;
        display: none; pointer-events: auto !important; width: 320px !important;
    }
    .nexa-btn {
        background: #ff4757 !important; color: white !important; border: none !important;
        padding: 12px !important; width: 100% !important; margin-top: 10px !important;
        cursor: pointer !important; font-weight: bold !important; border-radius: 6px !important;
    }
`;
document.head.appendChild(style);

const container = document.createElement('div');
container.id = 'nexa-overlay-container';
document.documentElement.appendChild(container);

container.innerHTML = `
    <div id="nexa-fps-hud">
        <div style="font-size: 10px; font-weight: 900; color: #ff4757;">SIC CORP // NEXAFLOW</div>
        <div style="display: flex; align-items: baseline; gap: 5px;">
            <span id="fps-val" style="font-size: 22px; font-weight: 800;">--</span>
            <span style="font-size: 11px; opacity: 0.6;">FPS</span>
        </div>
    </div>
    <div id="nexa-esc-menu" class="nexa-menu-card">
        <h2 style="color: #ff4757;">SYSTEM PAUSED</h2>
        <p style="font-size: 12px; opacity: 0.7;">Developed by Roy</p>
        <button class="nexa-btn" onclick="location.reload()">RELOAD GAME</button>
        <button class="nexa-btn" style="background: #333 !important;" id="close-nexa">RESUME</button>
    </div>
`;

let frameCount = 0, lastTime = performance.now();
function updateFPS() {
    frameCount++;
    let currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        document.getElementById('fps-val').innerText = frameCount;
        frameCount = 0; lastTime = currentTime;
    }
    requestAnimationFrame(updateFPS);
}
updateFPS();

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const menu = document.getElementById('nexa-esc-menu');
        const isShowing = menu.style.display === 'block';
        menu.style.display = isShowing ? 'none' : 'block';
        container.style.pointerEvents = isShowing ? 'none' : 'auto';
    }
});

document.getElementById('close-nexa').onclick = () => {
    document.getElementById('nexa-esc-menu').style.display = 'none';
    container.style.pointerEvents = 'none';
};

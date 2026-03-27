const { ipcRenderer } = require('electron');

// 1. STYLES (Forced to be the highest priority)
const style = document.createElement('style');
style.textContent = `
    #nexa-overlay-layer { 
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
        pointer-events: none; z-index: 2147483647; font-family: 'Segoe UI', sans-serif; 
    }
    #nexa-hud { 
        position: absolute; top: 20px; left: 20px; background: rgba(10, 10, 10, 0.85); 
        backdrop-filter: blur(8px); padding: 12px 20px; border-radius: 10px; 
        border-left: 5px solid #ff4757; color: white; pointer-events: auto;
    }
    .nexa-card { 
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #0f0f0f; border: 2px solid #ff4757; padding: 30px; 
        border-radius: 15px; text-align: center; color: white; pointer-events: auto;
        box-shadow: 0 0 30px rgba(255, 71, 87, 0.3); display: none;
    }
    .nexa-btn { 
        background: #ff4757; color: white; border: none; padding: 10px 25px; 
        border-radius: 5px; cursor: pointer; font-weight: bold; transition: 0.2s;
    }
    .nexa-btn:hover { background: #ff6b81; transform: scale(1.05); }
`;
document.head.appendChild(style);

// 2. CREATE OVERLAY LAYER
const overlayLayer = document.createElement('div');
overlayLayer.id = 'nexa-overlay-layer';
document.documentElement.appendChild(overlayLayer);

// 3. BUILD THE HUD
overlayLayer.innerHTML = `
    <div id="nexa-hud">
        <div style="font-size: 10px; font-weight: 900; color: #ff4757; letter-spacing: 2px;">SIC CORP // NEXAFLOW</div>
        <div style="display: flex; gap: 8px; align-items: baseline;">
            <span id="fps-val" style="font-size: 24px; font-weight: 800;">--</span>
            <span style="font-size: 12px; font-weight: 700; opacity: 0.7;">FPS</span>
        </div>
    </div>
    <div id="nexa-esc-menu" class="nexa-card">
        <h1 style="margin-top:0; color:#ff4757;">SYSTEM PAUSED</h1>
        <p>NexaFlow Client v1.1.1</p>
        <div style="display:flex; flex-direction:column; gap:10px;">
            <button class="nexa-btn" onclick="location.reload()">RELOAD GAME</button>
            <button class="nexa-btn" style="background:#222;" id="about-btn">ABOUT CLIENT</button>
            <button class="nexa-btn" style="background:#333;" id="close-menu">RESUME</button>
        </div>
    </div>
`;

// 4. LOGIC & KEYBINDS
const escMenu = document.getElementById('nexa-esc-menu');

window.addEventListener('keydown', (e) => {
    // ESC Toggle Logic
    if (e.key === 'Escape') {
        const isHidden = escMenu.style.display === 'none' || escMenu.style.display === '';
        escMenu.style.display = isHidden ? 'block' : 'none';
        
        // If menu is open, allow mouse interaction
        overlayLayer.style.pointerEvents = isHidden ? 'auto' : 'none';
    }
    
    // Alt+F4 Safety Logic
    if (e.altKey && e.key === 'F4') {
        if(confirm("Exit NexaFlow?")) ipcRenderer.send('app-quit-action');
    }
});

document.getElementById('close-menu').onclick = () => {
    escMenu.style.display = 'none';
    overlayLayer.style.pointerEvents = 'none';
};

document.getElementById('about-btn').onclick = () => {
    alert("NexaFlow Client v1.1.1\nCreated by Roy (SIC Corp)\nEngine: Electron 20.1.1");
};

// 5. FPS COUNTER (Optimized)
let lastCalledTime;
let fps;
function requestAnim() {
    if (!lastCalledTime) {
        lastCalledTime = performance.now();
        fps = 0;
    } else {
        let delta = (performance.now() - lastCalledTime) / 1000;
        lastCalledTime = performance.now();
        fps = Math.round(1 / delta);
        document.getElementById('fps-val').innerText = fps;
    }
    window.requestAnimationFrame(requestAnim);
}
requestAnim();

const { ipcRenderer } = require('electron');
const path = require('path');

const $ = (selector) => document.querySelector(selector);

// --- NEXAFLOW UI GENERATOR ---
const genSetting = (type, details) => {
    let element = document.createElement('template');
    switch (type) {
        case 'spacer': 
            element.innerHTML = `<div class="bar" style="background: rgba(255,255,255,0.05); height: 1px; margin: 10px 0;"></div>`;
            break;
        case 'info': 
            element.innerHTML = `<div class="setting toggle" style="margin-top: 14px; margin-bottom: 14px;">
            <p style="font-size: 12px; letter-spacing: 2px; font-weight: 800; color: #ff4757; text-transform: uppercase;">${details.text}</p></div>`;
            break;
        case 'toggle': 
            element.innerHTML = `<div class="setting toggle" style="margin-top: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <p style="font-size: 15px; color: #eee;">${details.text}</p>
            <label class="nexa-switch"><input id=${details.id} checked type="checkbox"><span class="slider"></span></label></div>`;
            break;
        case 'button': 
            element.innerHTML = `<div class="setting" style="margin-top: 10px; margin-bottom: 10px;">
            <button id="${details.id}" class="comm-btn" style="width: 100%; padding: 10px; background:#222; color:#fff; border:none; border-radius: 8px; cursor: pointer; font-weight: 700;">${details.text}</button></div>`;
            break;
    }
    return element.content;
}

// Logic to force UI into the menu whenever it opens
function injectNexaUI() {
    // Check multiple possible IDs for the settings menu
    const settingsPanel = $('#settingsDiv') || $('.settings-container') || $('.window-content');
    
    if (settingsPanel && !document.getElementById('nexa-loaded')) {
        const nexaMarker = document.createElement('div');
        nexaMarker.id = 'nexa-loaded'; // Prevents double injection
        settingsPanel.prepend(nexaMarker);

        // Append UI elements
        settingsPanel.prepend(genSetting('button', { text: 'About SIC Corp', id: 'about-sic' }));
        settingsPanel.prepend(genSetting('spacer'));
        settingsPanel.prepend(genSetting('toggle', { text: 'Smooth Play (Anti-Lag)', id: 'enableSmoothPlay' }));
        settingsPanel.prepend(genSetting('toggle', { text: 'Show FPS Counter', id: 'enableFpsDisplay' }));
        settingsPanel.prepend(genSetting('info', { text: 'NexaFlow Performance' }));

        // Wire up logic
        document.getElementById('about-sic').onclick = () => showAboutScreen();
        
        ['enableFpsDisplay', 'enableSmoothPlay'].forEach(id => {
            const el = document.getElementById(id);
            el.onchange = () => {
                if (id === 'enableFpsDisplay') document.getElementById('nexa-hud').style.display = el.checked ? 'block' : 'none';
                if (id === 'enableSmoothPlay') document.body.classList.toggle('smooth-play-active', el.checked);
                localStorage.setItem(id, el.checked);
            };
            // Load saved settings
            const saved = localStorage.getItem(id);
            if (saved !== null) { el.checked = JSON.parse(saved); el.onchange(); }
        });
    }
}

// Watch for the menu opening using a MutationObserver
const observer = new MutationObserver(() => injectNexaUI());
observer.observe(document.documentElement, { childList: true, subtree: true });

// --- HUD, OVERLAYS & STYLES ---
window.onload = () => {
    // 1. Create FPS HUD
    const hud = document.createElement('div');
    hud.id = 'nexa-hud';
    hud.innerHTML = `<div style="font-size: 9px; font-weight: 900; opacity: 0.6; letter-spacing: 1px;">NEXAFLOW</div>
                     <div style="display: flex; gap: 5px; align-items: baseline;">
                        <span id="fps-val" style="font-size: 18px; font-weight: 800; color: #ff4757;">--</span>
                        <span style="font-size: 10px; font-weight: 700; opacity: 0.8;">FPS</span>
                     </div>`;
    document.body.appendChild(hud);

    // 2. Add Styles
    const style = document.createElement('style');
    style.textContent = `
        #nexa-hud { position: fixed; top: 20px; left: 20px; z-index: 10000; background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(10px); padding: 10px 15px; border-radius: 8px; border-left: 4px solid #ff4757; color: white; font-family: sans-serif; pointer-events: none; }
        .nexa-switch { position: relative; display: inline-block; width: 40px; height: 20px; }
        .nexa-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 20px; }
        input:checked + .slider { background-color: #ff4757; }
        .smooth-play-active { image-rendering: pixelated; filter: contrast(1.1) brightness(1.1); }
        .exit-card { background: #111; border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; text-align: center; color: white; }
    `;
    document.head.appendChild(style);

    // 3. Alt+F4 / Exit Logic
    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'F4') { e.preventDefault(); showExitScreen(); }
    }, true);

    // 4. FPS Counter Loop
    let times = [];
    (function refreshLoop() {
        window.requestAnimationFrame(() => {
            const now = performance.now();
            while (times.length > 0 && times[0] <= now - 1000) { times.shift(); }
            times.push(now);
            const fpsVal = document.getElementById('fps-val');
            if(fpsVal) fpsVal.textContent = times.length;
            refreshLoop();
        });
    })();
};

// Functions for Screens
function showExitScreen() {
    if (document.getElementById('nexa-exit-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'nexa-exit-overlay';
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:999999;";
    overlay.innerHTML = `<div class="exit-card"><h2>Quit Game?</h2><br>
        <button onclick="ipcRenderer.send('app-quit-action')" style="background:#ff4757; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">EXIT</button>
        <button id="cancel-exit" style="background:#222; color:#888; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; margin-left:10px;">STAY</button></div>`;
    document.body.appendChild(overlay);
    document.getElementById('cancel-exit').onclick = () => overlay.remove();
}

function showAboutScreen() {
    // Just a placeholder for the logic you already had
    alert("NexaFlow Client v1.1.1\nCreated by Roy (SIC Corp)");
}

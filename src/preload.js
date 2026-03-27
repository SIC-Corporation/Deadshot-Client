const { ipcRenderer, shell } = require('electron');

const initNexaFlow = () => {
    if (document.getElementById('nexa-overlay')) return;

    // 1. INJECT THE UI STYLES
    const style = document.createElement('style');
    style.textContent = `
        #nexa-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 999999; font-family: 'Segoe UI', sans-serif; }
        
        /* THE SOCIAL SIDEBAR */
        #nexa-social { 
            position: absolute; right: -300px; top: 0; width: 300px; height: 100%; 
            background: rgba(10, 10, 10, 0.95); border-left: 2px solid #ff4757; 
            transition: 0.3s; pointer-events: auto; padding: 20px; color: white;
        }
        #nexa-social.open { right: 0; }
        
        .friend-item { padding: 10px; border-bottom: 1px solid #222; display: flex; justify-content: space-between; font-size: 13px; }
        .status-online { color: #2ecc71; font-size: 10px; }

        /* THE CHAT BOX */
        #nexa-chat { height: 200px; background: #000; margin-top: 20px; overflow-y: auto; padding: 10px; font-size: 12px; border: 1px solid #333; }
        
        /* CUSTOM MENU */
        #nexa-menu { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #0f0f0f; border: 2px solid #ff4757; padding: 40px; 
            border-radius: 15px; display: none; pointer-events: auto; text-align: center; width: 350px;
        }
        .nexa-btn { 
            width: 100%; padding: 12px; margin: 10px 0; border: none; border-radius: 5px; 
            background: #ff4757; color: white; font-weight: 800; cursor: pointer; 
        }
    `;
    document.head.appendChild(style);

    // 2. CREATE THE ELEMENTS
    const overlay = document.createElement('div');
    overlay.id = 'nexa-overlay';
    overlay.innerHTML = `
        <div id="nexa-menu">
            <h1 style="color:#ff4757; margin:0;">NEXAFLOW</h1>
            <p style="opacity:0.5; font-size:10px; margin-bottom:20px;">SIC CORP // CLIENT OVERRIDE</p>
            <button class="nexa-btn" id="nexa-discord">JOIN OUR DISCORD</button>
            <button class="nexa-btn" style="background:#333" id="nexa-settings">NEXA SETTINGS</button>
            <button class="nexa-btn" style="background:#222" onclick="location.reload()">RELOAD</button>
            <button class="nexa-btn" style="background:#ff4757" id="nexa-resume">RESUME</button>
        </div>

        <div id="nexa-social">
            <h3 style="color:#ff4757">FRIENDS</h3>
            <div class="friend-item">Roy (SIC Corp) <span class="status-online">● Online</span></div>
            <div class="friend-item">Guest_402 <span style="color:#555">● Offline</span></div>
            
            <h3 style="color:#ff4757; margin-top:30px;">CLIENT CHAT</h3>
            <div id="nexa-chat">
                <div style="color:#ff4757">[System]: Connected to NexaFlow Chat...</div>
            </div>
            <input type="text" placeholder="Type message..." style="width:100%; background:#222; border:none; color:white; padding:10px; margin-top:5px;">
        </div>
    `;
    document.body.appendChild(overlay);

    // 3. LOGIC: KEY HIJACK & DISCORD
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.stopImmediatePropagation(); // KILLS NORMAL MENU
            const menu = document.getElementById('nexa-menu');
            const isShown = menu.style.display === 'block';
            
            menu.style.display = isShown ? 'none' : 'block';
            document.getElementById('nexa-social').classList.toggle('open', !isShown);
            
            if (!isShown) document.exitPointerLock();
            else document.body.requestPointerLock();
        }
    }, true);

    // 4. DISCORD REDIRECT
    document.getElementById('nexa-discord').onclick = () => {
        // REPLACE THIS URL WITH YOUR ACTUAL DISCORD LINK
        require('electron').shell.openExternal('https://discord.gg/YOUR_LINK_HERE');
    };

    document.getElementById('nexa-resume').onclick = () => {
        document.getElementById('nexa-menu').style.display = 'none';
        document.getElementById('nexa-social').classList.remove('open');
        document.body.requestPointerLock();
    };
};

// Start checking
const checkReady = setInterval(() => {
    if (document.body) {
        initNexaFlow();
        clearInterval(checkReady);
    }
}, 100);

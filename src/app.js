const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const DiscordRPC = require('discord-rpc');
const electronLocalshortcut = require('electron-localshortcut');

// --- 🚀 HIGH PERFORMANCE MEMORY & FPS SWITCHES ---
// These flags allow the client to use 4GB of RAM and unlock the framerate
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096 --expose-gc');
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('force_high_performance_gpu');

const getArg = (key) => {
    const found = process.argv.find(arg => arg.startsWith(`--${key}=`));
    return found ? found.split('=')[1] : null;
};

const GLOBAL_WEBHOOK = getArg('webhook') || "";
const STAFF_HOOK = getArg('staffhook') || "";

// --- DISCORD RPC ---
const clientId = 'YOUR_DISCORD_APP_ID'; 
DiscordRPC.register(clientId);
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

async function setActivity() {
    if (!rpc) return;
    rpc.setActivity({
        details: 'Playing NexaFlow',
        state: 'v1.0.0 | SIC Corp',
        largeImageKey: 'nexa_logo',
        instance: false,
    }).catch(() => {}); 
}

rpc.on('ready', () => setActivity());
rpc.login({ clientId }).catch(() => console.log("RPC Offline"));

// --- MAIN WINDOW ---
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600, 
        height: 900,
        show: false,
        backgroundColor: '#0a0a0a',
        title: "NexaFlow Client v1.0.0", // Reverted to v1.0.0 as requested
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            additionalArguments: [
                `--webhook=${GLOBAL_WEBHOOK}`,
                `--staffhook=${STAFF_HOOK}`
            ],
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    mainWindow.loadURL('https://deadshot.io');
    mainWindow.removeMenu();

    mainWindow.once('ready-to-show', () => {
        // Essential Shortcuts
        electronLocalshortcut.register(mainWindow, 'F5', () => mainWindow.webContents.reload());
        electronLocalshortcut.register(mainWindow, 'F11', () => mainWindow.setFullScreen(!mainWindow.isFullScreen()));
        mainWindow.show();
    });
}

// --- 🛠️ SYSTEM HANDLERS ---

// Quits the entire application
ipcMain.on('quit-app', () => {
    app.quit();
});

// Advanced RAM Purge for smooth gameplay
ipcMain.on('clean-ram', () => {
    if (mainWindow && mainWindow.webContents) {
        // Triggers the V8 Engine Garbage Collector directly
        mainWindow.webContents.executeJavaScript('if(window.gc){window.gc(); console.log("NexaFlow: V8 GC Executed");}')
            .then(() => console.log("SIC Corp: RAM Purge Successful"))
            .catch(err => console.error("Purge Error:", err));
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

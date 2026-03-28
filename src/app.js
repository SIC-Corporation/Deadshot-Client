const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const DiscordRPC = require('discord-rpc');
const electronLocalshortcut = require('electron-localshortcut');

// --- PULLING ARGS FROM YOUR .BAT FILE ---
const getArg = (key) => {
    const found = process.argv.find(arg => arg.startsWith(`--${key}=`));
    return found ? found.split('=')[1] : null;
};

const GLOBAL_WEBHOOK = getArg('webhook') || "";
const STAFF_HOOK = getArg('staffhook') || "";

// --- DISCORD RPC SETUP ---
const clientId = 'YOUR_DISCORD_APP_ID'; 
DiscordRPC.register(clientId);
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

async function setActivity() {
    if (!rpc) return;
    rpc.setActivity({
        details: 'Playing NexaFlow',
        state: 'v1.0.0 | SIC Corp',
        largeImageKey: 'nexa_logo',
        largeImageText: 'NexaFlow Elite',
        instance: false,
    }).catch(() => {}); 
}

rpc.on('ready', () => {
    setActivity();
});

rpc.login({ clientId }).catch(() => console.log("RPC Offline"));

// --- MAIN WINDOW LOGIC ---
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600, 
        height: 900,
        show: false,
        backgroundColor: '#0a0a0a',
        title: "Deadshot.io - NexaFlow v1.0.0", // Kept at v1.0.0 per instructions
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
        // Register Shortcuts
        electronLocalshortcut.register(mainWindow, 'F5', () => mainWindow.webContents.reload());
        electronLocalshortcut.register(mainWindow, 'F11', () => mainWindow.setFullScreen(!mainWindow.isFullScreen()));
        mainWindow.show();
    });
}

// Single entry point
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

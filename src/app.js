const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const electronLocalshortcut = require('electron-localshortcut');
const rpc = require('./rpcHandler');

app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('force_high_performance_gpu');

let mainWindow;

// Load config with both Webhooks
let config = { GLOBAL_WEBHOOK: '', STAFF_DM_WEBHOOK: '' };
const configPath = path.join(__dirname, '..', 'config.json');
if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

const gameWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1600, height: 900,
        show: false,
        backgroundColor: '#0a0a0a',
        title: 'NexaFlow Client v1.1.0',
        icon: path.join(__dirname, '..', 'build', 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            // Injecting both webhooks safely
            additionalArguments: [
                `--webhook=${config.GLOBAL_WEBHOOK}`,
                `--staffhook=${config.STAFF_DM_WEBHOOK}`
            ],
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    mainWindow.loadURL('https://deadshot.io/');
    mainWindow.removeMenu();
}

app.on('ready', () => {
    gameWindow();
    mainWindow.once('ready-to-show', () => {
        electronLocalshortcut.register(mainWindow, 'F5', () => mainWindow.webContents.reload());
        electronLocalshortcut.register(mainWindow, 'F11', () => mainWindow.setFullScreen(!mainWindow.isFullScreen()));
        mainWindow.show();
    });
});

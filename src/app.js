const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const electronLocalshortcut = require('electron-localshortcut');

//* SIC Corp Performance Flags
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('force_high_performance_gpu');
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('ignore-gpu-blacklist');

let mainWindow;

const gameWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        backgroundColor: '#0a0a0a', // Dark theme start
        title: 'NexaFlow Client',
        icon: path.join(__dirname, '..', 'build', 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            sandbox: false
        }
    });

    mainWindow.loadURL('https://deadshot.io/');
    mainWindow.removeMenu();
}

// ... Keep your splashWindow and loadSequence exactly as they were ...

ipcMain.on('app-quit-action', () => {
    app.quit();
});

// registerKeys and other logic below...

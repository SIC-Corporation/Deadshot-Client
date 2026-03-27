const { app, BrowserWindow, ipcMain, shell } = require('electron');
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
        show: false, 
        backgroundColor: '#0a0a0a',
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

// HANDLERS FOR YOUR NEW UI
ipcMain.on('app-quit-action', () => {
    app.quit();
});

// This catches the Discord button click from your preload.js
ipcMain.on('open-discord', (event, url) => {
    shell.openExternal(url);
});

const registerKeys = () => {
    electronLocalshortcut.register(mainWindow, 'F5', () => mainWindow.webContents.reload());
    electronLocalshortcut.register(mainWindow, 'F11', () => mainWindow.setFullScreen(!mainWindow.isFullScreen()));
    electronLocalshortcut.register(mainWindow, 'F12', () => mainWindow.webContents.toggleDevTools());
}

const loadSequence = () => {
    gameWindow(); 
    if (mainWindow) {
        mainWindow.once('ready-to-show', () => {
            registerKeys();
            mainWindow.show();
        });
    }
};

app.on('ready', () => {
    loadSequence();
});

app.on('window-all-closed', () => { 
    if (process.platform !== 'darwin') app.quit(); 
});

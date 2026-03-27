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
        backgroundColor: '#0a0a0a',
        title: 'NexaFlow Client',
        icon: path.join(__dirname, '..', 'build', 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false, // Critical for Deadshot assets
            sandbox: false
        }
    });

    mainWindow.loadURL('https://deadshot.io/');
    mainWindow.removeMenu();
}

// ... Keep your splashWindow and loadSequence logic here ...

ipcMain.on('app-quit-action', () => {
    app.quit();
});

const registerKeys = () => {
    electronLocalshortcut.register(mainWindow, 'F5', () => mainWindow.webContents.reload());
    electronLocalshortcut.register(mainWindow, 'F11', () => mainWindow.setFullScreen(!mainWindow.isFullScreen()));
    electronLocalshortcut.register(mainWindow, 'F12', () => mainWindow.webContents.toggleDevTools());
}

app.on('ready', () => {
    // Your loadSequence calling gameWindow()
    loadSequence(); 
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

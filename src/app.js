const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const electronLocalshortcut = require('electron-localshortcut');
const isDev = require('electron-is-dev');

//* SIC Corp Performance Standards
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('force_high_performance_gpu');
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-2d-canvas-clip-utils');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('ignore-gpu-blacklist');

const defaultIcon = path.join(__dirname, '..', 'build', 'icon.ico');

let mainWindow;
const gameWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        title: 'NexaFlow Client for DeadShot', 
        icon: defaultIcon,
        webPreferences: {
            // Absolute path fix for packaged apps
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            sandbox: false,
            gpu: true
        }
    });

    mainWindow.loadURL('https://deadshot.io/');
    mainWindow.removeMenu();
}

let splash;
const splashWindow = () => {
    splash = new BrowserWindow({
        width: 1024, height: 600, center: true, icon: defaultIcon,
        alwaysOnTop: true, resizable: false, frame: false, transparent: true
    });
    splash.loadURL(`file://${path.join(__dirname, '../public/splash.html')}`);
}

const load = () => {
    splashWindow();
    setTimeout(() => {
        let interval = setInterval(() => {
            if (splash.isDestroyed()) return clearInterval(interval);
            let opacity = splash.getOpacity();
            if (opacity > 0.1) splash.setOpacity(opacity - 0.05);
            else { splash.close(); clearInterval(interval); open(); }
        }, 10);
    }, 1500); 
}

const open = () => {
    gameWindow();
    electronLocalshortcut.register(mainWindow, 'F5', () => mainWindow.webContents.reload());
    electronLocalshortcut.register(mainWindow, 'F11', () => mainWindow.setFullScreen(!mainWindow.isFullScreen()));
    electronLocalshortcut.register(mainWindow, 'F12', () => mainWindow.webContents.toggleDevTools());
}

app.once('ready', () => {
    load();
    try {
        const { updateActivity } = require('./rpcHandler.js');
        ipcMain.handle('rpcData', (e, arg) => updateActivity(arg));
    } catch (e) {}
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

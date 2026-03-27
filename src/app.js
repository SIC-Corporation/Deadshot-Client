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

    // Auto-open DevTools if you're debugging
    // mainWindow.webContents.openDevTools();
}

let splash;
const splashWindow = () => {
    splash = new BrowserWindow({
        width: 1024, height: 600, center: true, 
        alwaysOnTop: true, frame: false, transparent: true
    });
    splash.loadURL(`file://${path.join(__dirname, '../public/splash.html')}`);
}

const loadSequence = () => {
    splashWindow();
    setTimeout(() => {
        let interval = setInterval(() => {
            if (splash.isDestroyed()) return clearInterval(interval);
            let opacity = splash.getOpacity();
            if (opacity > 0.1) splash.setOpacity(opacity - 0.05);
            else { 
                splash.close(); 
                clearInterval(interval); 
                gameWindow(); 
                registerKeys();
            }
        }, 15);
    }, 2000);
}

const registerKeys = () => {
    electronLocalshortcut.register(mainWindow, 'F5', () => mainWindow.webContents.reload());
    electronLocalshortcut.register(mainWindow, 'F11', () => mainWindow.setFullScreen(!mainWindow.isFullScreen()));
    electronLocalshortcut.register(mainWindow, 'F12', () => mainWindow.webContents.toggleDevTools());
}

app.on('ready', loadSequence);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

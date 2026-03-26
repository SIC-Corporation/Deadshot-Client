const { dialog, app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const electronLocalshortcut = require('electron-localshortcut');
const isDev = require('electron-is-dev');

//* Performance Boosts - SIC Corp Standards
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('force_high_performance_gpu');

const defaultIcon = path.join(__dirname, '..', 'build', 'icon.ico');

let mainWindow;
const gameWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1920 * 0.8,
        height: 1080 * 0.8,
        title: 'NexaFlow Client',
        icon: defaultIcon,
        backgroundColor: '#000000', 
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('load', { isDev });
    });

    mainWindow.loadURL('https://deadshot.io/');
    mainWindow.removeMenu();
}

let splash;
const splashWindow = () => {
    splash = new BrowserWindow({
        width: 1024,
        height: 600,
        center: true,
        icon: defaultIcon,
        alwaysOnTop: true,
        resizable: false,
        frame: false,
        transparent: true,
        hasShadow: false
    });
    splash.loadURL(`file://${path.join(__dirname, '../public/splash.html')}`);
}

const load = () => {
    splashWindow();
    setTimeout(() => {
        let interval = setInterval(() => {
            if (!splash || splash.isDestroyed()) return clearInterval(interval);
            let opacity = splash.getOpacity();
            if (opacity > 0.1) {
                splash.setOpacity(opacity - 0.05);
            } else {
                splash.close();
                clearInterval(interval);
                gameWindow(); 
                setupShortcuts(); 
            }
        }, 20);
    }, 2000); 
}

const setupShortcuts = () => {
    electronLocalshortcut.register(mainWindow, 'F5', () => {
        mainWindow.webContents.reload();
    });
    electronLocalshortcut.register(mainWindow, 'Control+R', () => {
        mainWindow.webContents.session.clearCache().then(() => {
            mainWindow.webContents.reload();
        });
    });
    electronLocalshortcut.register(mainWindow, 'F11', () => {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
    });
    electronLocalshortcut.register(mainWindow, 'F12', () => {
        mainWindow.webContents.toggleDevTools();
    });
}

// --- NEXAFLOW EXIT BRIDGE ---
ipcMain.on('app-quit-action', () => {
    app.quit();
});

app.once('ready', () => {
    load();
    try {
        const { updateActivity } = require('./rpcHandler.js');
        ipcMain.handle('rpcData', (e, arg) => updateActivity(arg));
    } catch (e) {
        console.log("Discord RPC failed.");
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    electronLocalshortcut.unregisterAll();
});

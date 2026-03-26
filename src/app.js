const { dialog, app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const electronLocalshortcut = require('electron-localshortcut');
const isDev = require('electron-is-dev');

//* Performance Boosts
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('force_high_performance_gpu');

const defaultIcon = './build/icon.ico';

let mainWindow;
const gameWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1920 * 0.8,
		height: 1080 * 0.8,
		title: 'NexaFlow Client', // Updated title
		icon: defaultIcon,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true,
			contextIsolation: false,
			webSecurity: false
		}
	});

	// Send load event once the page is ready
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
		icon: './build/icon.ico',
		alwaysOnTop: true,
		resizable: false,
		frame: false,
		transparent: true
	});
	splash.loadURL(`file://${__dirname}/../public/splash.html`);
	splash.removeMenu();
}

const load = () => {
	splashWindow();
	setTimeout(() => {
		let interval = setInterval(() => {
			if (splash.isDestroyed()) return clearInterval(interval);
			splash.setOpacity(splash.getOpacity() - 0.05);
			if (splash.getOpacity() < 0.1) {
				splash.close();
				clearInterval(interval);
			}
		}, 10);
		open();
	}, 1500); // Slightly longer splash for a premium feel
}

const open = () => {
	gameWindow();

	// REFRESH
	electronLocalshortcut.register(mainWindow, 'F5', () => {
		if (!mainWindow.isFocused()) return;
		mainWindow.webContents.reload();
	});
	// FULLSCREEN
	electronLocalshortcut.register(mainWindow, 'F11', () => {
		if (!mainWindow.isFocused()) return;
		mainWindow.setFullScreen(!mainWindow.isFullScreen());
	});
	// DEVTOOLS
	electronLocalshortcut.register(mainWindow, 'F12', () => {
		if (!mainWindow.isFocused()) return;
		mainWindow.webContents.toggleDevTools();
	});

	/* NOTE: We REMOVED the 'Escape' shortcut here. 
	   The 'preload.js' now handles Escape and Alt+F4 internally 
	   to show the NexaFlow custom exit screen.
	*/
}

// --- NEXAFLOW BRIDGE ---
// This listens for the "EXIT" button click from your custom UI
ipcMain.on('app-quit-action', () => {
	app.quit();
});

app.once('ready', () => {
	load();
	try {
		const { updateActivity } = require('./rpcHandler.js');
		ipcMain.handle('rpcData', (e, arg) => updateActivity(arg));
	} catch (e) {
		console.log("Discord RPC failed to load, skipping...");
	}
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
	electronLocalshortcut.unregisterAll();
});

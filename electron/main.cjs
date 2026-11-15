const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === '1';

// Hardware acceleration and GPU optimizations for 60 FPS Canvas and Three.js 3D viewer
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Eliminate default Chromium application menu bar (File, Edit, View, Window, Help)
Menu.setApplicationMenu(null);

function createWindow() {
  const icoPath = path.join(__dirname, '../build/icon.ico');
  const pngPath = path.join(__dirname, '../build/icon.png');
  const iconFile = process.platform === 'win32'
    ? (fs.existsSync(icoPath) ? icoPath : pngPath)
    : (fs.existsSync(pngPath) ? pngPath : icoPath);

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    title: 'Simulador de Electromagnetismo UPC - Laboratorio Virtual',
    backgroundColor: '#0B0F17', // Native dark background to avoid white flashes
    icon: fs.existsSync(iconFile) ? iconFile : undefined,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'win32' ? 'hidden' : 'default',
    titleBarOverlay: process.platform === 'win32'
      ? {
          color: '#111827',
          symbolColor: '#10B981',
          height: 48
        }
      : false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
      devTools: isDev
    },
    show: false
  });

  const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  const distIndexPath = path.join(__dirname, '../dist/index.html');

  if (isDev) {
    win.loadURL(devUrl).catch(() => {
      setTimeout(() => win.loadURL(devUrl), 1000);
    });
  } else if (fs.existsSync(distIndexPath)) {
    win.loadFile(distIndexPath);
  } else {
    win.loadURL(devUrl).catch(() => {
      setTimeout(() => win.loadURL(devUrl), 1000);
    });
  }

  // Maximize by default on laboratory monitors and show smoothly
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });

  // Block opening external links inside the application window
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Prevent navigation away from the simulator
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file:') && !url.includes('localhost:5173')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Prevent browser shortcuts (accidental reload, Ctrl+zoom) in native desktop mode
  win.webContents.on('before-input-event', (event, input) => {
    // In production, prevent F5 and Ctrl+R reload
    if (!isDev) {
      if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
        event.preventDefault();
      }
    }
    // Prevent Ctrl+Plus, Ctrl+Minus, Ctrl+0 page zoom
    if (input.control && (input.key === '+' || input.key === '-' || input.key === '=' || input.key === '0')) {
      event.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

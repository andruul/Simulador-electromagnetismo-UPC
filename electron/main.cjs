const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === '1';

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    title: 'Simulador de Electromagnetismo (2D / 3D)',
    backgroundColor: '#090d16',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    autoHideMenuBar: false,
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

  win.once('ready-to-show', () => {
    win.show();
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

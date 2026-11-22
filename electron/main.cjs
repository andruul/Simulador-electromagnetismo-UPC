const { app, BrowserWindow, Menu, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { fileURLToPath } = require('url');

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === '1';

// Development server URL. ELECTRON_START_URL is honoured ONLY in development: a packaged
// build must never load an arbitrary URL taken from the environment.
const devUrl = (isDev && process.env.ELECTRON_START_URL) || 'http://localhost:5173';
const distDir = path.join(__dirname, '../dist');
const distIndexPath = path.join(distDir, 'index.html');

// Hardware acceleration and GPU optimizations for 60 FPS Canvas and Three.js 3D viewer
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Eliminate default Chromium application menu bar (File, Edit, View, Window, Help)
Menu.setApplicationMenu(null);

/**
 * True when `url` is part of the application itself: the dev server origin while
 * developing, or a file inside the packaged `dist` folder in production.
 */
function isInternalUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (isDev && parsed.origin === new URL(devUrl).origin) {
    return true;
  }

  if (parsed.protocol === 'file:') {
    try {
      const target = path.resolve(fileURLToPath(parsed));
      const root = path.resolve(distDir) + path.sep;
      const normalize = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
      return normalize(target).startsWith(normalize(root));
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Opens a link in the user's browser. Only plain web links are allowed: other schemes
 * (file:, smb:, javascript:, custom protocol handlers...) are never handed to the OS.
 */
function openExternalSafely(url) {
  try {
    const { protocol } = new URL(url);
    if (protocol === 'http:' || protocol === 'https:') {
      shell.openExternal(url);
    }
  } catch {
    // Malformed URL: ignore
  }
}

// Deny every permission request (camera, microphone, geolocation, notifications...):
// the simulator is a fully offline application and needs none of them.
function lockDownPermissions() {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  session.defaultSession.setPermissionCheckHandler(() => false);
}

// Navigation guards applied to EVERY web contents the app ever creates
app.on('web-contents-created', (_event, contents) => {
  // The simulator never embeds <webview> tags
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

  // Block opening new windows; send plain web links to the system browser instead
  contents.setWindowOpenHandler(({ url }) => {
    openExternalSafely(url);
    return { action: 'deny' };
  });

  // Prevent navigation away from the simulator (including redirects)
  const guardNavigation = (event, url) => {
    if (!isInternalUrl(url)) {
      event.preventDefault();
      openExternalSafely(url);
    }
  };
  contents.on('will-navigate', guardNavigation);
  contents.on('will-redirect', guardNavigation);
});

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
      // The renderer has no preload script and no IPC channel: it is a pure web page
      // with no access to Node.js or to the operating system (least privilege).
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      spellcheck: false,
      devTools: isDev
    },
    show: false
  });

  if (isDev) {
    win.loadURL(devUrl).catch(() => {
      setTimeout(() => win.loadURL(devUrl), 1000);
    });
  } else if (fs.existsSync(distIndexPath)) {
    win.loadFile(distIndexPath);
  } else {
    // Packaged builds always contain dist/. If it is missing, show a clear message
    // instead of loading anything from the network.
    win.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(
          '<meta charset="utf-8"><body style="background:#0B0F17;color:#e2e8f0;font-family:sans-serif;padding:3rem">' +
            '<h2>No se encontró la aplicación compilada</h2>' +
            '<p>Ejecute <code>npm run build</code> antes de iniciar el simulador.</p></body>'
        )
    );
  }

  // Maximize by default on laboratory monitors and show smoothly
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
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
  lockDownPermissions();
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

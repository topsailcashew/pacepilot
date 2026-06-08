const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference so the window isn't GC'd
let mainWindow = null;

// ── Security: refuse all permission requests except notifications ──────────────
app.on('web-contents-created', (_, contents) => {
  contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['notifications', 'media'];
    callback(allowed.includes(permission));
  });

  // Open external links in the system browser, not a new Electron window
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',   // macOS: traffic lights inset into content
    vibrancy: 'sidebar',            // macOS frosted glass sidebar
    backgroundColor: '#0B0C1E',
    icon: path.join(__dirname, '../public/icon-512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    // Dev: load the Vite dev server — OAuth success URL is http://localhost:5173/#/
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // ── OAuth redirect interception ───────────────────────────────────────────
  // In production the app runs on file://, which Appwrite won't accept as a
  // redirect URI. So we pass http://localhost:42424/auth/callback as the
  // success URL. Appwrite redirects there; we intercept it before the webview
  // actually tries to navigate, prevent the load, and tell the renderer to
  // restore its session (the Appwrite cookie is already set at this point).
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http://localhost:42424/auth/')) {
      event.preventDefault();
      const isFailure = url.includes('/auth/failure');
      mainWindow.webContents.send('oauth-callback', isFailure ? 'failure' : 'success');
    }
  });

  // Also catch did-navigate in case will-navigate fires too late
  mainWindow.webContents.on('did-navigate', (event, url) => {
    if (url.startsWith('http://localhost:42424/auth/')) {
      const isFailure = url.includes('/auth/failure');
      mainWindow.webContents.send('oauth-callback', isFailure ? 'failure' : 'success');
      // Navigate back to the app
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
  return mainWindow;
}

// Ensure only one instance runs (important for OAuth callback handling)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // macOS: re-create window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // macOS: keep app running in dock even with no windows
  if (process.platform !== 'darwin') app.quit();
});

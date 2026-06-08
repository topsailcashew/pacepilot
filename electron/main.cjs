const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// ── Custom protocol for OAuth deep-link callbacks ─────────────────────────────
// Appwrite redirects to pacepilot://auth/callback after Google OAuth.
// This must be set before app.whenReady().
if (process.defaultApp) {
  // Running via `electron .` — register for the current executable
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('pacepilot', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('pacepilot');
}

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
    // Dev: load the Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
  return mainWindow;
}

// ── Handle deep-link on macOS (app already running) ───────────────────────────
// macOS fires 'open-url' when the app is already open and a pacepilot:// link
// is clicked (e.g., Appwrite redirects back after Google OAuth).
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// ── Handle deep-link on Windows/Linux (new instance) ─────────────────────────
// On Windows, the deep-link is passed as a command-line argument to a new instance.
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    // The deep-link URL is the last argument
    const url = commandLine.find((arg) => arg.startsWith('pacepilot://'));
    if (url) handleDeepLink(url);
    // Focus the existing window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

/**
 * Forward the OAuth callback URL to the renderer so it can extract the
 * Appwrite session cookie and finish the login flow.
 */
function handleDeepLink(url) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('oauth-callback', url);
  }
}

app.whenReady().then(() => {
  createWindow();

  // macOS: handle deep-link if app was launched by clicking a pacepilot:// URL
  const launchUrl = process.argv.find((arg) => arg.startsWith('pacepilot://'));
  if (launchUrl) handleDeepLink(launchUrl);

  app.on('activate', () => {
    // macOS: re-create window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // macOS: keep app running in dock even with no windows
  if (process.platform !== 'darwin') app.quit();
});

const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

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
  const win = new BrowserWindow({
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
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: load the built index.html
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return win;
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

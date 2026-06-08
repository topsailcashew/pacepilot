/**
 * Preload script — runs in a privileged context before the renderer.
 * Exposes only safe, explicitly whitelisted APIs to the renderer via
 * contextBridge. Never expose ipcRenderer directly.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,

  // Called by the renderer to register a one-time listener for the OAuth
  // deep-link callback. Main process sends 'oauth-callback' with the full URL.
  onOAuthCallback: (callback) => {
    ipcRenderer.once('oauth-callback', (_event, url) => callback(url));
  },
});

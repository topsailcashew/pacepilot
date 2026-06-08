/**
 * Preload script — runs in a privileged context before the renderer.
 * Exposes only safe, explicitly whitelisted APIs to the renderer via
 * contextBridge. Never expose ipcRenderer directly.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  // Add any safe IPC calls here as the app grows
});

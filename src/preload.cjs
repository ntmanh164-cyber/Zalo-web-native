const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  invoke: (action, payload) => ipcRenderer.invoke('desktop', action, payload),
  onState: callback => { ipcRenderer.on('state', (_event, data) => callback(data)); }
});

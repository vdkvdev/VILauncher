const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    startMinecraft: (perfil) => ipcRenderer.invoke('start-minecraft', perfil),
    closeApp: () => ipcRenderer.invoke('close-app'),
    onMinecraftStatus: (callback) => ipcRenderer.on('minecraft-status', callback)
});
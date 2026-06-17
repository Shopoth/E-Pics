const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  register: (password, vaultPath) => ipcRenderer.invoke('auth:register', password, vaultPath),
  login: (password, vaultPath) => ipcRenderer.invoke('auth:login', password, vaultPath),
  hasPassword: () => ipcRenderer.invoke('auth:hasPassword'),
  getVaults: () => ipcRenderer.invoke('vaults:getList'),

  // Files
  importFiles: (filePaths) => ipcRenderer.invoke('files:import', filePaths),
  getAll: () => ipcRenderer.invoke('files:getAll'),
  getThumbnail: (storedName) => ipcRenderer.invoke('files:getThumbnail', storedName),
  getFile: (storedName) => ipcRenderer.invoke('files:getFile', storedName),
  deleteFile: (storedName) => ipcRenderer.invoke('files:delete', storedName),
  exportFile: (storedName) => ipcRenderer.invoke('files:export', storedName),
  search: (query) => ipcRenderer.invoke('files:search', query),
  toggleFavorite: (fileId) => ipcRenderer.invoke('files:toggleFavorite', fileId),
  addTag: (fileId, tag) => ipcRenderer.invoke('files:addTag', fileId, tag),
  removeTag: (fileId, tag) => ipcRenderer.invoke('files:removeTag', fileId, tag),

  // Password
  changePassword: (oldPassword, newPassword) => 
    ipcRenderer.invoke('password:change', oldPassword, newPassword),

  // Settings
  getStoragePath: () => ipcRenderer.invoke('settings:getStoragePath'),

  // File dialogs
  pickDirectory: () => ipcRenderer.invoke('files:pickDirectory'),
  pickFiles: () => ipcRenderer.invoke('files:pickFiles'),

  // Window
  navigate: (page) => ipcRenderer.invoke('window:navigate', page)
});

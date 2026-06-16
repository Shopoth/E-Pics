const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const MetadataManager = require('./utils/metadataManager');
const FileHandler = require('./utils/fileHandler');
const PasswordManager = require('./utils/passwordManager');

const VAULT_ROOT = path.join(os.homedir(), '.photohider');
let mainWindow;
let metadataManager;
let fileHandler;
let passwordManager;
let isAuthenticated = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../src/ui/login.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Development tools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.on('ready', async () => {
  // Initialize vault and managers
  metadataManager = new MetadataManager(VAULT_ROOT);
  fileHandler = new FileHandler(VAULT_ROOT, metadataManager);
  passwordManager = new PasswordManager(metadataManager);

  // Ensure vault directory exists
  await fileHandler.ensureVaultExists();

  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function createMenu() {
  Menu.setApplicationMenu(null);
}

// IPC Handlers
ipcMain.handle('auth:register', async (event, password) => {
  try {
    await passwordManager.setPassword(password);
    isAuthenticated = true;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:login', async (event, password) => {
  try {
    const isValid = await passwordManager.verifyPassword(password);
    if (isValid) {
      isAuthenticated = true;
      return { success: true };
    } else {
      return { success: false, error: 'Invalid password' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:hasPassword', async () => {
  return await passwordManager.hasPassword();
});

ipcMain.handle('files:import', async (event, filePaths) => {
  try {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    const results = await fileHandler.importFiles(filePaths);
    await metadataManager.saveMetadata();
    return { success: true, files: results };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('files:getAll', async (event) => {
  try {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    const metadata = await metadataManager.loadMetadata();
    return { success: true, files: metadata.files };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('files:getThumbnail', async (event, storedName) => {
  try {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    const buffer = await fileHandler.getFileThumbnail(storedName);
    return { success: true, data: buffer.toString('base64') };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('files:getFile', async (event, storedName) => {
  try {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    const metadata = await metadataManager.loadMetadata();
    const fileEntry = metadata.files.find(f => f.storedName === storedName);
    if (!fileEntry) {
      throw new Error('File not found');
    }
    const buffer = await fileHandler.getFile(storedName);
    return { success: true, data: buffer.toString('base64'), mimeType: fileHandler.getMimeType(fileEntry) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('files:delete', async (event, storedName) => {
  try {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    await fileHandler.deleteFile(storedName);
    await metadataManager.removeFile(storedName);
    await metadataManager.saveMetadata();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('files:export', async (event, storedName) => {
  try {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    const metadata = await metadataManager.loadMetadata();
    const fileEntry = metadata.files.find(f => f.storedName === storedName);
    if (!fileEntry) {
      throw new Error('File not found');
    }

    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: fileEntry.originalName,
      filters: [{ name: 'All Files', extensions: ['*'] }]
    });

    if (!result.canceled) {
      await fileHandler.exportFile(storedName, result.filePath);
      return { success: true, path: result.filePath };
    } else {
      return { success: false, error: 'Export canceled' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('files:search', async (event, query) => {
  try {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    const metadata = await metadataManager.loadMetadata();
    const results = metadata.files.filter(f =>
      f.originalName.toLowerCase().includes(query.toLowerCase())
    );
    return { success: true, files: results };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('files:toggleFavorite', async (event, fileId) => {
  try {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    await metadataManager.toggleFavorite(fileId);
    await metadataManager.saveMetadata();
    const metadata = await metadataManager.loadMetadata();
    return { success: true, files: metadata.files };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('files:addTag', async (event, fileId, tag) => {
  try {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    await metadataManager.addTag(fileId, tag);
    await metadataManager.saveMetadata();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('files:removeTag', async (event, fileId, tag) => {
  try {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    await metadataManager.removeTag(fileId, tag);
    await metadataManager.saveMetadata();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('password:change', async (event, oldPassword, newPassword) => {
  try {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    const isValid = await passwordManager.verifyPassword(oldPassword);
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' };
    }
    await passwordManager.setPassword(newPassword);
    await metadataManager.saveMetadata();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('settings:getStoragePath', async () => {
  return { success: true, path: VAULT_ROOT };
});

ipcMain.handle('files:pickDirectory', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (!result.canceled) {
    return { success: true, path: result.filePaths[0] };
  }
  return { success: false, error: 'No directory selected' };
});

ipcMain.handle('files:pickFiles', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Images & Videos',
        extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'mp4', 'mkv', 'avi', 'mov', 'webm']
      },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (!result.canceled) {
    return { success: true, files: result.filePaths };
  }
  return { success: false, error: 'No files selected' };
});

ipcMain.handle('window:navigate', async (event, page) => {
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, `../src/ui/${page}.html`));
  }
});

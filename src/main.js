const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const MetadataManager = require('./utils/metadataManager');
const FileHandler = require('./utils/fileHandler');
const PasswordManager = require('./utils/passwordManager');

const VAULT_ROOT = path.join(os.homedir(), '.photohider');
let VAULTS_CONFIG_PATH;
let knownVaults = [];
let currentVaultRoot = VAULT_ROOT;
let mainWindow;
let metadataManager;
let fileHandler;
let passwordManager;
let isAuthenticated = false;

async function loadVaultConfig() {
  try {
    const data = await fs.readFile(VAULTS_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(data);
    knownVaults = Array.isArray(parsed)
      ? parsed.filter(v => v && v.path).map(v => ({ path: path.resolve(v.path) }))
      : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      knownVaults = [];
    } else {
      console.error('Failed to load vault config:', error);
      knownVaults = [];
    }
  }

  if (knownVaults.length === 0) {
    try {
      await fs.access(path.join(VAULT_ROOT, 'metadata.json'));
      await addVaultPath(VAULT_ROOT);
    } catch (error) {
      // default vault not present; ignore
    }
  }
}

async function saveVaultConfig() {
  await fs.mkdir(path.dirname(VAULTS_CONFIG_PATH), { recursive: true });
  await fs.writeFile(VAULTS_CONFIG_PATH, JSON.stringify(knownVaults, null, 2), 'utf8');
}

async function addVaultPath(vaultPath) {
  const resolvedPath = path.resolve(vaultPath);
  if (!knownVaults.some(v => v.path === resolvedPath)) {
    knownVaults.push({ path: resolvedPath });
    await saveVaultConfig();
  }
}

async function initializeVaultManagers(vaultPath) {
  currentVaultRoot = path.resolve(vaultPath);
  metadataManager = new MetadataManager(currentVaultRoot);
  fileHandler = new FileHandler(currentVaultRoot, metadataManager);
  passwordManager = new PasswordManager(metadataManager);
}

async function ensureVaultDirectory(vaultPath) {
  try {
    await fs.mkdir(vaultPath, { recursive: true });
  } catch (error) {
    throw new Error('Unable to create vault directory: ' + error.message);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../assets/icons.ico'),
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
  VAULTS_CONFIG_PATH = path.join(app.getPath('userData'), 'vaults.json');
  await loadVaultConfig();

  await initializeVaultManagers(VAULT_ROOT);
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
ipcMain.handle('auth:register', async (event, password, vaultPath) => {
  try {
    const pathToUse = path.resolve(vaultPath || VAULT_ROOT);
    await ensureVaultDirectory(pathToUse);
    await initializeVaultManagers(pathToUse);
    await metadataManager.loadMetadata();

    if (metadataManager.getPasswordHash()) {
      return { success: false, error: 'Vault already exists at this location. Please login instead.' };
    }

    await passwordManager.setPassword(password);
    await addVaultPath(pathToUse);
    isAuthenticated = true;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:login', async (event, password, vaultPath) => {
  try {
    const pathToUse = path.resolve(vaultPath || (knownVaults.length > 0 ? knownVaults[0].path : VAULT_ROOT));
    await initializeVaultManagers(pathToUse);
    await metadataManager.loadMetadata();

    if (!metadataManager.getPasswordHash()) {
      return { success: false, error: 'Selected vault does not have a password set.' };
    }

    const isValid = await passwordManager.verifyPassword(password);
    if (isValid) {
      await addVaultPath(pathToUse);
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
  return knownVaults.length > 0;
});

ipcMain.handle('vaults:getList', async () => {
  return knownVaults;
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
  return { success: true, path: currentVaultRoot || VAULT_ROOT };
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

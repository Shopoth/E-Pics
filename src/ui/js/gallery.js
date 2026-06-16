let allFiles = [];
let currentFilter = 'all';
let contextMenuTarget = null;

document.addEventListener('DOMContentLoaded', async () => {
  const navItems = document.querySelectorAll('.nav-item[data-view]');
  const settingsBtn = document.getElementById('settingsBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const importBtn = document.getElementById('importBtn');
  const emptyImportBtn = document.getElementById('emptyImportBtn');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const galleryGrid = document.getElementById('galleryGrid');
  const emptyState = document.getElementById('emptyState');
  const contextMenu = document.getElementById('contextMenu');
  const importModal = document.getElementById('importModal');
  const closeImportModal = document.getElementById('closeImportModal');

  // Load files on startup
  await loadFiles();

  // Navigation
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      currentFilter = item.dataset.view;
      displayGallery();
    });
  });

  // Settings navigation
  settingsBtn.addEventListener('click', () => {
    window.electronAPI.navigate('settings');
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    window.electronAPI.navigate('login');
  });

  // Import files
  importBtn.addEventListener('click', openFilePicker);
  emptyImportBtn.addEventListener('click', openFilePicker);

  // Search
  searchInput.addEventListener('input', performSearch);

  // Sort
  sortSelect.addEventListener('change', displayGallery);

  // Right-click context menu
  galleryGrid.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const item = e.target.closest('.gallery-item');
    if (item) {
      contextMenuTarget = item.dataset.stored;
      showContextMenu(e.clientX, e.clientY);
    }
  });

  // Context menu items
  document.querySelectorAll('.context-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      handleContextAction(action, contextMenuTarget);
      contextMenu.classList.add('hidden');
    });
  });

  // Close context menu on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu')) {
      contextMenu.classList.add('hidden');
    }
  });

  // Close import modal
  closeImportModal.addEventListener('click', () => {
    importModal.classList.add('hidden');
  });
});

async function loadFiles() {
  try {
    const result = await window.electronAPI.getAll();
    if (result.success) {
      allFiles = result.files;
      displayGallery();
    } else {
      console.error('Failed to load files:', result.error);
    }
  } catch (error) {
    console.error('Error loading files:', error);
  }
}

function displayGallery() {
  const galleryGrid = document.getElementById('galleryGrid');
  const emptyState = document.getElementById('emptyState');
  const sortSelect = document.getElementById('sortSelect');

  // Filter files
  let filteredFiles = allFiles;
  if (currentFilter === 'favorites') {
    filteredFiles = allFiles.filter(f => f.isFavorite);
  } else if (currentFilter === 'images') {
    filteredFiles = allFiles.filter(f => f.type === 'image');
  } else if (currentFilter === 'videos') {
    filteredFiles = allFiles.filter(f => f.type === 'video');
  }

  // Sort files
  const sortValue = sortSelect.value;
  filteredFiles = [...filteredFiles].sort((a, b) => {
    switch (sortValue) {
      case 'recent':
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      case 'oldest':
        return new Date(a.dateAdded) - new Date(b.dateAdded);
      case 'name':
        return a.originalName.localeCompare(b.originalName);
      case 'name-desc':
        return b.originalName.localeCompare(a.originalName);
      default:
        return 0;
    }
  });

  // Clear grid
  galleryGrid.innerHTML = '';

  if (filteredFiles.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  // Add items
  filteredFiles.forEach(file => {
    const item = createGalleryItem(file);
    galleryGrid.appendChild(item);
  });
}

function createGalleryItem(file) {
  const item = document.createElement('div');
  item.className = 'gallery-item';
  item.dataset.stored = file.storedName;
  item.dataset.id = file.id;

  const icon = file.type === 'image' ? '🖼️' : '🎬';
  const favoriteIcon = file.isFavorite ? '⭐' : '';

  item.innerHTML = `
    ${favoriteIcon ? `<div class="gallery-item-favorite">${favoriteIcon}</div>` : ''}
    <div class="gallery-item-badge">${icon}</div>
    <img class="gallery-item-thumbnail" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23374151' width='150' height='150'/%3E%3C/svg%3E" alt="${file.originalName}">
    <div class="gallery-item-overlay">
      <span style="font-size: 24px;">👁️</span>
    </div>
  `;

  item.addEventListener('click', () => {
    viewFile(file.storedName);
  });

  // Load thumbnail
  loadThumbnail(file.storedName, item.querySelector('.gallery-item-thumbnail'));

  return item;
}

async function loadThumbnail(storedName, imgElement) {
  try {
    const result = await window.electronAPI.getThumbnail(storedName);
    if (result.success) {
      const file = allFiles.find(f => f.storedName === storedName);
      const mimeType = getMimeType(file);
      imgElement.src = `data:${mimeType};base64,${result.data}`;
    }
  } catch (error) {
    console.error('Error loading thumbnail:', error);
  }
}

function getMimeType(file) {
  const ext = file.originalExtension.toLowerCase().replace('.', '');
  const mimeTypes = {
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
    'gif': 'image/gif', 'webp': 'image/webp', 'bmp': 'image/bmp',
    'mp4': 'video/mp4', 'mkv': 'video/x-matroska', 'avi': 'video/x-msvideo',
    'mov': 'video/quicktime', 'webm': 'video/webm'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function openFilePicker() {
  try {
    const result = await window.electronAPI.pickFiles();
    if (result.success) {
      await importFiles(result.files);
    }
  } catch (error) {
    console.error('Error picking files:', error);
  }
}

async function importFiles(filePaths) {
  const importModal = document.getElementById('importModal');
  const importProgress = document.getElementById('importProgress');
  const closeImportModal = document.getElementById('closeImportModal');

  importProgress.innerHTML = '';
  importModal.classList.remove('hidden');

  try {
    const result = await window.electronAPI.importFiles(filePaths);
    if (result.success) {
      result.files.forEach(file => {
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        const status = file.status === 'success' ? '✓' : '✕';
        const statusClass = file.status === 'success' ? 'success' : 'error';
        progressItem.innerHTML = `
          <div class="progress-status ${statusClass}">${status}</div>
          <div>
            <div>${file.name}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">
              ${file.status === 'success' ? 'Imported' : file.error}
            </div>
          </div>
        `;
        importProgress.appendChild(progressItem);
      });

      // Reload files
      await loadFiles();
      closeImportModal.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error importing files:', error);
  }
}

async function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const query = searchInput.value.trim();

  if (!query) {
    displayGallery();
    return;
  }

  try {
    const result = await window.electronAPI.search(query);
    if (result.success) {
      allFiles = result.files;
      displayGallery();
    }
  } catch (error) {
    console.error('Error searching:', error);
  }
}

function showContextMenu(x, y) {
  const contextMenu = document.getElementById('contextMenu');
  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
  contextMenu.classList.remove('hidden');
}

async function handleContextAction(action, storedName) {
  switch (action) {
    case 'view':
      viewFile(storedName);
      break;
    case 'favorite':
      await toggleFavorite(storedName);
      break;
    case 'export':
      await exportFile(storedName);
      break;
    case 'delete':
      await deleteFile(storedName);
      break;
  }
}

function viewFile(storedName) {
  sessionStorage.setItem('viewerStoredName', storedName);
  window.electronAPI.navigate('viewer');
}

async function toggleFavorite(storedName) {
  try {
    const file = allFiles.find(f => f.storedName === storedName);
    if (file) {
      const result = await window.electronAPI.toggleFavorite(file.id);
      if (result.success) {
        allFiles = result.files;
        displayGallery();
      }
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
}

async function exportFile(storedName) {
  try {
    const result = await window.electronAPI.exportFile(storedName);
    if (result.success) {
      alert(`File exported to:\n${result.path}`);
    } else {
      alert(`Export failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error exporting file:', error);
  }
}

async function deleteFile(storedName) {
  if (!confirm('Are you sure you want to delete this file? This cannot be undone.')) {
    return;
  }

  try {
    const result = await window.electronAPI.deleteFile(storedName);
    if (result.success) {
      await loadFiles();
    } else {
      alert(`Delete failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

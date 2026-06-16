let currentFile = null;
let allFiles = [];
let viewerOrder = [];

document.addEventListener('DOMContentLoaded', async () => {
  const backBtn = document.getElementById('backBtn');
  const favoriteBtn = document.getElementById('favoriteBtn');
  const exportBtn = document.getElementById('exportBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const addTagBtn = document.getElementById('addTagBtn');
  const tagInput = document.getElementById('tagInput');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  backBtn.addEventListener('click', () => {
    window.electronAPI.navigate('gallery');
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      navigateViewer(-1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      navigateViewer(1);
    });
  }

  favoriteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (currentFile) {
      await toggleFavorite(currentFile.id);
      const msg = currentFile.isFavorite ? 'Added to Favorites' : 'Removed from Favorites';
      if (typeof showToast === 'function') showToast(msg, 'heart-filled');
    }
  });

  exportBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (currentFile) {
      await exportFile(currentFile.storedName);
    }
  });

  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (currentFile && confirm('Delete this file? This cannot be undone.')) {
      await deleteFile(currentFile.storedName);
    }
  });

  addTagBtn.addEventListener('click', async () => {
    if (currentFile) {
      const tag = tagInput.value.trim();
      if (tag) {
        await addTag(currentFile.id, tag);
        tagInput.value = '';
      }
    }
  });

  tagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTagBtn.click();
  });

  // Load file and viewer order
  const storedName = sessionStorage.getItem('viewerStoredName');
  const storedOrder = sessionStorage.getItem('viewerOrder');
  console.log('Initial load - storedName:', storedName, 'storedOrder:', storedOrder);
  
  viewerOrder = storedOrder ? JSON.parse(storedOrder) : [];

  if (storedName) {
    await loadFile(storedName);
  } else {
    console.warn('No storedName in sessionStorage');
  }
});

async function loadFile(storedName) {
  try {
    console.log('loadFile called with:', storedName);
    const allResult = await window.electronAPI.getAll();
    console.log('getAll result:', allResult.success, 'files count:', allResult.files ? allResult.files.length : 0);
    
    if (allResult.success) {
      allFiles = allResult.files;
      currentFile = allFiles.find(f => f.storedName === storedName);
      
      console.log('currentFile found:', !!currentFile, currentFile?.originalName);

      if (!currentFile) {
        console.error('File not found for storedName:', storedName);
        return;
      }

      displayFile();
    } else {
      console.error('getAll failed:', allResult.error);
    }
  } catch (error) {
    console.error('Error loading file:', error);
  }
}

function getViewerIndex() {
  return viewerOrder.findIndex(name => name === currentFile?.storedName);
}

function getFileAtOffset(offset) {
  const idx = getViewerIndex();
  if (idx === -1) return null;
  const targetName = viewerOrder[idx + offset];
  if (!targetName) return null;
  return allFiles.find(f => f.storedName === targetName) || null;
}

function updateNavButtons() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (!prevBtn || !nextBtn) return;

  prevBtn.disabled = !getFileAtOffset(-1);
  nextBtn.disabled = !getFileAtOffset(1);
}

function navigateViewer(offset) {
  const targetFile = getFileAtOffset(offset);
  if (!targetFile) return;

  sessionStorage.setItem('viewerStoredName', targetFile.storedName);
  loadFile(targetFile.storedName);
}

async function displayFile() {
  if (!currentFile) return;

  console.log('Displaying file:', currentFile.originalName, currentFile.type);

  // Update file info
  document.getElementById('fileName').textContent = currentFile.originalName;
  document.getElementById('fileType').textContent = currentFile.type.toUpperCase();
  document.getElementById('fileDate').textContent = new Date(currentFile.dateAdded).toLocaleDateString();

  // Update favorite icon
  updateFavoriteIcon();

  // Display tags
  displayTags();

  // Load and display media
  try {
    const result = await window.electronAPI.getFile(currentFile.storedName);
    console.log('getFile result:', result.success, result.mimeType ? result.mimeType.substring(0, 50) : 'no mime');
    
    if (result.success) {
      const imageContainer = document.getElementById('imageContainer');
      const videoContainer = document.getElementById('videoContainer');

      if (currentFile.type === 'image') {
        const img = document.getElementById('imageViewer');
        img.src = `data:${result.mimeType};base64,${result.data}`;
        console.log('Image set, src length:', img.src.length);
        imageContainer.classList.remove('hidden');
        videoContainer.classList.add('hidden');
      } else if (currentFile.type === 'video') {
        const video = document.getElementById('videoViewer');
        const source = video.querySelector('source');
        source.src = `data:${result.mimeType};base64,${result.data}`;
        source.type = result.mimeType;
        video.load();
        videoContainer.classList.remove('hidden');
        imageContainer.classList.add('hidden');
      }

      updateNavButtons();
    } else {
      console.error('getFile failed:', result.error);
    }
  } catch (error) {
    console.error('Error displaying file:', error);
  }
}

function displayTags() {
  const tagsList = document.getElementById('tagsList');
  tagsList.innerHTML = '';

  if (currentFile.tags && currentFile.tags.length > 0) {
    currentFile.tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'text-[11px] text-violet-400 font-medium cursor-pointer hover:text-violet-300';
      tagEl.dataset.tag = tag;
      tagEl.innerText = '#' + tag;
      tagsList.appendChild(tagEl);

      tagEl.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Remove tag "${tag}"?`)) {
          await removeTag(currentFile.id, tag);
        }
      });
    });
  }
}

async function toggleFavorite(fileId) {
  try {
    const result = await window.electronAPI.toggleFavorite(fileId);
    if (result.success) {
      allFiles = result.files;
      currentFile = allFiles.find(f => f.id === fileId);
      updateFavoriteIcon();
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
}

function updateFavoriteIcon() {
  const favoriteBtn = document.getElementById('favoriteBtn');
  const svg = favoriteBtn.querySelector('svg use');
  if (currentFile.isFavorite) {
    svg.setAttribute('href', 'icons/icons.svg#heart-filled');
    favoriteBtn.classList.add('text-amber-300');
  } else {
    svg.setAttribute('href', 'icons/icons.svg#heart-outline');
    favoriteBtn.classList.remove('text-amber-300');
  }
}

async function addTag(fileId, tag) {
  try {
    const result = await window.electronAPI.addTag(fileId, tag);
    if (result.success) {
      const allResult = await window.electronAPI.getAll();
      if (allResult.success) {
        allFiles = allResult.files;
        currentFile = allFiles.find(f => f.id === fileId);
        displayTags();
      }
    }
  } catch (error) {
    console.error('Error adding tag:', error);
  }
}

async function removeTag(fileId, tag) {
  try {
    const result = await window.electronAPI.removeTag(fileId, tag);
    if (result.success) {
      const allResult = await window.electronAPI.getAll();
      if (allResult.success) {
        allFiles = allResult.files;
        currentFile = allFiles.find(f => f.id === fileId);
        displayTags();
      }
    }
  } catch (error) {
    console.error('Error removing tag:', error);
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
  try {
    const result = await window.electronAPI.deleteFile(storedName);
    if (result.success) {
      window.electronAPI.navigate('gallery');
    } else {
      alert(`Delete failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

let currentFile = null;
let allFiles = [];

document.addEventListener('DOMContentLoaded', async () => {
  const backBtn = document.getElementById('backBtn');
  const favoriteBtn = document.getElementById('favoriteBtn');
  const exportBtn = document.getElementById('exportBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const addTagBtn = document.getElementById('addTagBtn');
  const tagInput = document.getElementById('tagInput');

  backBtn.addEventListener('click', () => {
    window.electronAPI.navigate('gallery');
  });

  favoriteBtn.addEventListener('click', async () => {
    if (currentFile) {
      await toggleFavorite(currentFile.id);
    }
  });

  exportBtn.addEventListener('click', async () => {
    if (currentFile) {
      await exportFile(currentFile.storedName);
    }
  });

  deleteBtn.addEventListener('click', async () => {
    if (currentFile && confirm('Are you sure? This cannot be undone.')) {
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

  // Load file
  const storedName = sessionStorage.getItem('viewerStoredName');
  if (storedName) {
    await loadFile(storedName);
  }
});

async function loadFile(storedName) {
  try {
    const allResult = await window.electronAPI.getAll();
    if (allResult.success) {
      allFiles = allResult.files;
      currentFile = allFiles.find(f => f.storedName === storedName);

      if (!currentFile) {
        console.error('File not found');
        return;
      }

      displayFile();
    }
  } catch (error) {
    console.error('Error loading file:', error);
  }
}

async function displayFile() {
  if (!currentFile) return;

  // Update file info
  document.getElementById('fileName').textContent = currentFile.originalName;
  document.getElementById('fileType').textContent = currentFile.type.toUpperCase();
  document.getElementById('fileDate').textContent = new Date(currentFile.dateAdded).toLocaleDateString();

  // Update favorite button
  const favoriteBtn = document.getElementById('favoriteBtn');
  favoriteBtn.textContent = currentFile.isFavorite ? '⭐' : '☆';

  // Display tags
  displayTags();

  // Load and display media
  try {
    const result = await window.electronAPI.getFile(currentFile.storedName);
    if (result.success) {
      const imageContainer = document.getElementById('imageContainer');
      const videoContainer = document.getElementById('videoContainer');

      if (currentFile.type === 'image') {
        const img = document.getElementById('imageViewer');
        img.src = `data:${result.mimeType};base64,${result.data}`;
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
      const tagEl = document.createElement('div');
      tagEl.className = 'tag';
      tagEl.innerHTML = `
        ${tag}
        <span class="tag-remove" data-tag="${tag}">✕</span>
      `;
      tagsList.appendChild(tagEl);

      tagEl.querySelector('.tag-remove').addEventListener('click', async () => {
        await removeTag(currentFile.id, tag);
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
      displayFile();
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
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

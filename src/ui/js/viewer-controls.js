let currentFile = null;
let allFiles = [];

function getViewerIndex() {
  return allFiles.findIndex(f => f.storedName === currentFile?.storedName);
}

function getFileAtOffset(offset) {
  const idx = getViewerIndex();
  if (idx === -1) return null;
  const nextIdx = idx + offset;
  return allFiles[nextIdx] || null;
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
  if (targetFile) {
    sessionStorage.setItem('viewerStoredName', targetFile.storedName);
    loadFile(targetFile.storedName);
  }
}

function viewFileFromGallery(storedName) {
  sessionStorage.setItem('viewerStoredName', storedName);
  window.electronAPI.navigate('viewer');
}

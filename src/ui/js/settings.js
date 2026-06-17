document.addEventListener('DOMContentLoaded', async () => {
  const backToGallery = document.getElementById('backToGallery');
  const backToGallerySide = document.getElementById('backToGallerySide');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
  const savePasswordBtn = document.getElementById('savePasswordBtn');
  const passwordModal = document.getElementById('passwordModal');
  const passwordError = document.getElementById('passwordError');
  const currentPasswordInput = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
  const storagePathEl = document.getElementById('storagePath');
  const vaultNameValue = document.getElementById('vaultNameValue');
  const openRenameVaultBtn = document.getElementById('openRenameVaultBtn');
  const renameVaultModal = document.getElementById('renameVaultModal');
  const renameVaultName = document.getElementById('renameVaultName');
  const renameVaultPassword = document.getElementById('renameVaultPassword');
  const saveVaultNameBtn = document.getElementById('saveVaultNameBtn');
  const cancelRenameVaultBtn = document.getElementById('cancelRenameVaultBtn');
  const renameVaultError = document.getElementById('renameVaultError');
  const deleteVaultBtn = document.getElementById('deleteVaultBtn');
  const deleteVaultModal = document.getElementById('deleteVaultModal');
  const deleteConfirmText = document.getElementById('deleteConfirmText');
  const deleteVaultPasswordInput = document.getElementById('deleteVaultPasswordInput');
  const confirmDeleteVaultBtn = document.getElementById('confirmDeleteVaultBtn');
  const cancelDeleteVaultBtn = document.getElementById('cancelDeleteVaultBtn');
  const deleteVaultError = document.getElementById('deleteVaultError');
  const thumbnailToggle = document.getElementById('thumbnailToggle');
  const themeSelect = document.getElementById('themeSelect');
  let lastFocusedElement = null;

  function closeModal() {
    if (passwordModal) {
      passwordModal.classList.add('hidden');
      setTimeout(() => { try { lastFocusedElement?.focus(); } catch (e) {} }, 0);
    }
  }

  function openModal() {
    if (passwordModal) {
      lastFocusedElement = document.activeElement;
      passwordModal.classList.remove('hidden');
    }
  }

  function resetPasswordFields() {
    if (currentPasswordInput) currentPasswordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
    if (passwordError) passwordError.textContent = '';
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  function closeDeleteModal() {
    if (deleteVaultModal) {
      deleteVaultModal.classList.add('hidden');
      setTimeout(() => { try { lastFocusedElement?.focus(); } catch (e) {} }, 0);
    }
  }

  function openDeleteModal() {
    if (deleteVaultModal) {
      deleteVaultModal.classList.remove('hidden');
      deleteConfirmText?.focus();
      lastFocusedElement = document.activeElement;
    }
  }

  function resetDeleteFields() {
    if (deleteConfirmText) deleteConfirmText.value = '';
    if (deleteVaultPasswordInput) deleteVaultPasswordInput.value = '';
    if (deleteVaultError) deleteVaultError.textContent = '';
  }

  function closeRenameModal() {
    if (renameVaultModal) {
      renameVaultModal.classList.add('hidden');
      setTimeout(() => { try { lastFocusedElement?.focus(); } catch (e) {} }, 0);
    }
  }

  function openRenameModal() {
    if (renameVaultModal) {
      lastFocusedElement = document.activeElement;
      renameVaultModal.classList.remove('hidden');
      renameVaultName?.focus();
    }
  }

  function resetRenameFields() {
    if (renameVaultName) renameVaultName.value = '';
    if (renameVaultPassword) renameVaultPassword.value = '';
    if (renameVaultError) renameVaultError.textContent = '';
  }

  async function loadSettings() {
    if (storagePathEl) {
      try {
        const result = await window.electronAPI.getStoragePath();
        storagePathEl.textContent = result?.success ? result.path : 'Unavailable';
      } catch (error) {
        storagePathEl.textContent = 'Unavailable';
      }
    }
    if (vaultNameValue) {
      try {
        const vaultInfo = await window.electronAPI.getCurrentVaultInfo();
        vaultNameValue.textContent = vaultInfo?.success
          ? vaultInfo.name || 'Unnamed vault'
          : 'Unavailable';
      } catch (error) {
        vaultNameValue.textContent = 'Unavailable';
      }
    }

    const storedTheme = localStorage.getItem('epics-theme') || 'dark';
    if (themeSelect) {
      themeSelect.value = storedTheme;
    }
    applyTheme(storedTheme);

    const storedThumbnails = localStorage.getItem('epics-thumbnails');
    if (thumbnailToggle) {
      thumbnailToggle.checked = storedThumbnails !== 'false';
    }
  }

  if (backToGallery) {
    backToGallery.addEventListener('click', () => {
      window.electronAPI.navigate('gallery');
    });
  }

  if (backToGallerySide) {
    backToGallerySide.addEventListener('click', () => {
      window.electronAPI.navigate('gallery');
    });
  }

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      resetPasswordFields();
      openModal();
      currentPasswordInput?.focus();
    });
  }

  if (cancelPasswordBtn) {
    cancelPasswordBtn.addEventListener('click', () => {
      closeModal();
    });
  }

  if (savePasswordBtn) {
    savePasswordBtn.addEventListener('click', async () => {
      if (!currentPasswordInput || !newPasswordInput || !confirmNewPasswordInput || !passwordError) {
        return;
      }

      const currentPassword = currentPasswordInput.value.trim();
      const newPassword = newPasswordInput.value.trim();
      const confirmPassword = confirmNewPasswordInput.value.trim();

      if (!currentPassword || !newPassword || !confirmPassword) {
        passwordError.textContent = 'Please fill in all password fields.';
        return;
      }

      if (newPassword.length < 4) {
        passwordError.textContent = 'New password must be at least 4 characters.';
        return;
      }

      if (newPassword !== confirmPassword) {
        passwordError.textContent = 'New passwords do not match.';
        return;
      }

      try {
        const result = await window.electronAPI.changePassword(currentPassword, newPassword);
        if (result?.success) {
          closeModal();
          resetPasswordFields();
          alert('Password changed successfully.');
        } else {
          passwordError.textContent = result?.error || 'Unable to change password.';
        }
      } catch (error) {
        passwordError.textContent = error?.message || 'Unable to change password.';
      }
    });
  }

  if (openRenameVaultBtn) {
    openRenameVaultBtn.addEventListener('click', () => {
      resetRenameFields();
      openRenameModal();
    });
  }

  if (saveVaultNameBtn) {
    saveVaultNameBtn.addEventListener('click', async () => {
      if (!renameVaultName || !renameVaultPassword || !renameVaultError) return;

      const newName = renameVaultName.value.trim();
      const currentPassword = renameVaultPassword.value.trim();

      if (!newName) {
        renameVaultError.textContent = 'Please enter a vault name.';
        return;
      }

      if (!currentPassword) {
        renameVaultError.textContent = 'Please enter your current password.';
        return;
      }

      try {
        const result = await window.electronAPI.renameVault(currentPassword, newName);
        if (result?.success) {
          renameVaultError.textContent = '';
          closeRenameModal();
          resetRenameFields();
          vaultNameValue.textContent = newName;
          alert('Vault name updated successfully.');
        } else {
          renameVaultError.textContent = result?.error || 'Unable to update vault name.';
        }
      } catch (error) {
        renameVaultError.textContent = error?.message || 'Unable to update vault name.';
      }
    });
  }

  if (cancelRenameVaultBtn) {
    cancelRenameVaultBtn.addEventListener('click', () => {
      closeRenameModal();
    });
  }

  if (deleteVaultBtn) {
    deleteVaultBtn.addEventListener('click', () => {
      resetDeleteFields();
      openDeleteModal();
    });
  }

  if (cancelDeleteVaultBtn) {
    cancelDeleteVaultBtn.addEventListener('click', () => {
      closeDeleteModal();
    });
  }

  if (confirmDeleteVaultBtn) {
    confirmDeleteVaultBtn.addEventListener('click', async () => {
      if (!deleteConfirmText || !deleteVaultPasswordInput || !deleteVaultError) return;

      const confirmation = deleteConfirmText.value.trim();
      const currentPassword = deleteVaultPasswordInput.value.trim();
      if (confirmation !== 'DELETE') {
        deleteVaultError.textContent = 'Type DELETE to confirm.';
        return;
      }

      if (!currentPassword) {
        deleteVaultError.textContent = 'Please enter your current password.';
        return;
      }

      if (!confirm('This will permanently delete the current vault and all stored files. Proceed?')) {
        return;
      }

      try {
        const result = await window.electronAPI.deleteVault(currentPassword);
        if (result?.success) {
          closeDeleteModal();
          alert('Vault deleted successfully. Returning to login.');
          window.electronAPI.navigate('login');
        } else {
          deleteVaultError.textContent = result?.error || 'Unable to delete vault.';
        }
      } catch (error) {
        deleteVaultError.textContent = error?.message || 'Unable to delete vault.';
      }
    });
  }

  // Ensure modal overlay inputs are available after hiding/reopening
  if (renameVaultModal) {
    renameVaultModal.addEventListener('transitionend', () => {
      if (!renameVaultModal.classList.contains('hidden')) {
        renameVaultName?.focus();
      }
    });
  }

  if (deleteVaultModal) {
    deleteVaultModal.addEventListener('transitionend', () => {
      if (!deleteVaultModal.classList.contains('hidden')) {
        deleteConfirmText?.focus();
      }
    });
  }

  // Close modals when clicking on backdrop and restore focus
  if (passwordModal) {
    passwordModal.addEventListener('click', (e) => {
      if (e.target === passwordModal) {
        closeModal();
        resetPasswordFields();
      }
    });
  }

  if (renameVaultModal) {
    renameVaultModal.addEventListener('click', (e) => {
      if (e.target === renameVaultModal) {
        closeRenameModal();
        resetRenameFields();
      }
    });
  }

  if (deleteVaultModal) {
    deleteVaultModal.addEventListener('click', (e) => {
      if (e.target === deleteVaultModal) {
        closeDeleteModal();
        resetDeleteFields();
      }
    });
  }

  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      localStorage.setItem('epics-theme', themeSelect.value);
      applyTheme(themeSelect.value);
    });
  }

  if (thumbnailToggle) {
    thumbnailToggle.addEventListener('change', () => {
      localStorage.setItem('epics-thumbnails', thumbnailToggle.checked ? 'true' : 'false');
    });
  }

  await loadSettings();
});
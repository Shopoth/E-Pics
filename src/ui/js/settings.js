document.addEventListener('DOMContentLoaded', async () => {
  const backToGallery = document.getElementById('backToGallery');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
  const savePasswordBtn = document.getElementById('savePasswordBtn');
  const passwordModal = document.getElementById('passwordModal');
  const passwordError = document.getElementById('passwordError');
  const currentPasswordInput = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
  const storagePathEl = document.getElementById('storagePath');
  const thumbnailToggle = document.getElementById('thumbnailToggle');
  const themeSelect = document.getElementById('themeSelect');

  function closeModal() {
    if (passwordModal) {
      passwordModal.classList.add('hidden');
    }
  }

  function openModal() {
    if (passwordModal) {
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

  async function loadSettings() {
    if (storagePathEl) {
      try {
        const result = await window.electronAPI.getStoragePath();
        storagePathEl.textContent = result?.success ? result.path : 'Unavailable';
      } catch (error) {
        storagePathEl.textContent = 'Unavailable';
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

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      resetPasswordFields();
      openModal();
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
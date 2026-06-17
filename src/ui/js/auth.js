document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loadingMessage = document.getElementById('loadingMessage');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');
  const loginPassword = document.getElementById('loginPassword');
  const vaultSelection = document.getElementById('vaultSelection');
  const vaultSelect = document.getElementById('vaultSelect');
  const registerVaultPath = document.getElementById('registerVaultPath');
  const chooseVaultPathBtn = document.getElementById('chooseVaultPathBtn');
  const registerPassword = document.getElementById('registerPassword');
  const registerConfirm = document.getElementById('registerConfirm');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');

  // Check vaults and load vault list
  loadingMessage.classList.remove('hidden');
  try {
    const vaults = await window.electronAPI.getVaults();
    loadVaultOptions(vaults);
    if (vaults.length > 0) {
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      vaultSelection.classList.remove('hidden');
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      vaultSelection.classList.add('hidden');
    }
  } catch (error) {
    loginError.textContent = 'Unable to initialize vault. Please restart the app.';
    registerError.textContent = '';
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } finally {
    loadingMessage.classList.add('hidden');
  }

  // Form switching
  switchToRegister.addEventListener('click', async () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginError.textContent = '';
  });

  switchToLogin.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    registerError.textContent = '';
  });

  // Login handler
  loginBtn.addEventListener('click', async () => {
    const password = loginPassword.value.trim();
    const selectedVault = vaultSelect.value;
    if (!password) {
      loginError.textContent = 'Please enter your password';
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    try {
      const result = await window.electronAPI.login(password, selectedVault || null);
      if (result.success) {
        loginPassword.value = '';
        loginError.textContent = '';
        // Navigate to gallery
        await window.electronAPI.navigate('gallery');
      } else {
        loginError.textContent = result.error || 'Login failed';
      }
    } catch (error) {
      loginError.textContent = 'An error occurred: ' + error.message;
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    }
  });

  // Register handler
  chooseVaultPathBtn.addEventListener('click', async () => {
    try {
      const result = await window.electronAPI.pickDirectory();
      if (result.success) {
        registerVaultPath.value = result.path;
      }
    } catch (error) {
      console.error('Error selecting vault folder:', error);
    }
  });

  registerBtn.addEventListener('click', async () => {
    const password = registerPassword.value.trim();
    const confirm = registerConfirm.value.trim();
    const vaultPath = registerVaultPath.value.trim();

    if (!password) {
      registerError.textContent = 'Please enter a password';
      return;
    }

    if (password.length < 4) {
      registerError.textContent = 'Password must be at least 4 characters';
      return;
    }

    if (password !== confirm) {
      registerError.textContent = 'Passwords do not match';
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating Vault...';

    try {
      const result = await window.electronAPI.register(password, vaultPath || null);
      if (result.success) {
        registerPassword.value = '';
        registerConfirm.value = '';
        registerVaultPath.value = '';
        registerError.textContent = '';
        // Navigate to gallery
        await window.electronAPI.navigate('gallery');
      } else {
        registerError.textContent = result.error || 'Registration failed';
      }
    } catch (error) {
      registerError.textContent = 'An error occurred: ' + error.message;
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = 'Create Vault';
    }
  });

  // Enter key support
  loginPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  registerConfirm.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') registerBtn.click();
  });

  vaultSelect.addEventListener('change', () => {
    loginError.textContent = '';
  });
});

function loadVaultOptions(vaults) {
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Default Vault';
  vaultSelect.appendChild(defaultOption);

  vaults.forEach(vault => {
    const option = document.createElement('option');
    option.value = vault.path;
    option.textContent = vault.path;
    vaultSelect.appendChild(option);
  });
}

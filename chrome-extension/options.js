const API_BASE_URL = 'http://localhost:3001/api';

class ChromePassOptions {
  constructor() {
    this.token = null;
    this.credentials = [];
    this.apiUrl = API_BASE_URL;
    this.init();
  }

  async init() {
    // Load saved configuration
    const result = await chrome.storage.local.get(['token', 'apiUrl']);
    this.token = result.token;
    this.apiUrl = result.apiUrl || API_BASE_URL;

    // Update API URL input
    document.getElementById('apiUrl').value = this.apiUrl;

    if (this.token) {
      await this.loadUserInfo();
      await this.loadCredentials();
      this.showUserSection();
    } else {
      this.showLoginSection();
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
      this.handleLogout();
    });

    // Save configuration
    document.getElementById('saveConfigBtn').addEventListener('click', () => {
      this.saveConfiguration();
    });
  }

  async handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const statusMessage = document.getElementById('statusMessage');

    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    this.hideStatus();

    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        await chrome.storage.local.set({ token: this.token });
        await this.loadUserInfo();
        await this.loadCredentials();
        this.showUserSection();
        this.showStatus('Login successful!', 'success');
      } else {
        this.showStatus(data.message || 'Login failed', 'error');
      }
    } catch (error) {
      this.showStatus('Network error. Please check your API configuration.', 'error');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
    }
  }

  async handleLogout() {
    this.token = null;
    this.credentials = [];
    await chrome.storage.local.remove(['token']);
    this.showLoginSection();
    this.showStatus('Logged out successfully', 'info');
  }

  async loadUserInfo() {
    try {
      const response = await fetch(`${this.apiUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        document.getElementById('userEmail').textContent = data.user.email;
      } else if (response.status === 401) {
        await this.handleLogout();
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  }

  async loadCredentials() {
    const loadingEl = document.getElementById('credentialsLoading');
    const listEl = document.getElementById('credentialsList');
    const emptyEl = document.getElementById('credentialsEmpty');

    loadingEl.style.display = 'block';
    listEl.style.display = 'none';
    emptyEl.style.display = 'none';

    try {
      const response = await fetch(`${this.apiUrl}/credentials`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.credentials = data.credentials || [];
        this.renderCredentials();
      } else if (response.status === 401) {
        await this.handleLogout();
        return;
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
      this.credentials = [];
    } finally {
      loadingEl.style.display = 'none';
    }
  }

  renderCredentials() {
    const listEl = document.getElementById('credentialsList');
    const emptyEl = document.getElementById('credentialsEmpty');

    if (this.credentials.length === 0) {
      emptyEl.style.display = 'block';
      listEl.style.display = 'none';
      return;
    }

    listEl.innerHTML = '';
    this.credentials.forEach((credential) => {
      const credentialEl = this.createCredentialElement(credential);
      listEl.appendChild(credentialEl);
    });

    listEl.style.display = 'block';
    emptyEl.style.display = 'none';
  }

  createCredentialElement(credential) {
    const div = document.createElement('div');
    div.className = 'credential-item';
    div.innerHTML = `
      <div class="credential-info">
        <div class="credential-label">${credential.label}</div>
        <div class="credential-url">${credential.url}</div>
      </div>
      <div class="credential-actions">
        <button class="btn btn-small" onclick="window.open('${credential.url}', '_blank')">
          Open
        </button>
        <button class="btn btn-small btn-secondary" onclick="navigator.clipboard.writeText('${credential.username}')">
          Copy Username
        </button>
        <button class="btn btn-small btn-secondary" onclick="navigator.clipboard.writeText('${credential.password}')">
          Copy Password
        </button>
      </div>
    `;
    return div;
  }

  showLoginSection() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('userSection').style.display = 'none';
  }

  showUserSection() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userSection').style.display = 'block';
  }

  showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideStatus();
    }, 5000);
  }

  hideStatus() {
    document.getElementById('statusMessage').style.display = 'none';
  }

  async saveConfiguration() {
    const apiUrl = document.getElementById('apiUrl').value;
    this.apiUrl = apiUrl;
    await chrome.storage.local.set({ apiUrl });
    this.showStatus('Configuration saved successfully', 'success');
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChromePassOptions();
});

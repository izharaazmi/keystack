const API_BASE_URL = 'http://localhost:3001/api';

class ChromePassPopup {
	constructor() {
		this.token = null;
		this.credentials = [];
		this.init();
	}

	async init() {
		// Check if user is logged in
		const result = await chrome.storage.local.get(['token']);
		this.token = result.token;

		if (this.token) {
			await this.loadCredentials();
			this.showCredentialsList();
		} else {
			this.showLoginForm();
		}

		this.setupEventListeners();
	}

	setupEventListeners() {
		// Login form
		document.getElementById('login').addEventListener('submit', (e) => {
			e.preventDefault();
			this.handleLogin();
		});

		// Logout button
		document.getElementById('logoutBtn').addEventListener('click', () => {
			this.handleLogout();
		});

		// Settings link
		document.getElementById('settingsLink').addEventListener('click', (e) => {
			e.preventDefault();
			chrome.tabs.create({url: chrome.runtime.getURL('options.html')});
		});
	}

	async handleLogin() {
		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;
		const loginBtn = document.getElementById('loginBtn');
		const errorMessage = document.getElementById('errorMessage');

		loginBtn.disabled = true;
		loginBtn.textContent = 'Signing in...';
		errorMessage.style.display = 'none';

		try {
			const response = await fetch(`${API_BASE_URL}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({email, password}),
			});

			const data = await response.json();

			if (response.ok) {
				this.token = data.token;
				await chrome.storage.local.set({token: this.token});
				await this.loadCredentials();
				this.showCredentialsList();
			} else {
				errorMessage.textContent = data.message || 'Login failed';
				errorMessage.style.display = 'block';
			}
		} catch (error) {
			errorMessage.textContent = 'Network error. Please try again.';
			errorMessage.style.display = 'block';
		} finally {
			loginBtn.disabled = false;
			loginBtn.textContent = 'Sign In';
		}
	}

	async handleLogout() {
		this.token = null;
		this.credentials = [];
		await chrome.storage.local.remove(['token']);
		this.showLoginForm();
	}

	async loadCredentials() {
		try {
			const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
			const currentUrl = tab.url;

			const response = await fetch(`${API_BASE_URL}/credentials/for-url?url=${encodeURIComponent(currentUrl)}`, {
				headers: {
					'Authorization': `Bearer ${this.token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				this.credentials = data.credentials || [];
			} else if (response.status === 401) {
				// Token expired
				await this.handleLogout();
				return;
			}
		} catch (error) {
			console.error('Failed to load credentials:', error);
		}
	}

	showLoginForm() {
		document.getElementById('loginForm').style.display = 'block';
		document.getElementById('credentialsList').style.display = 'none';
		document.getElementById('loadingState').style.display = 'none';
		document.getElementById('noCredentials').style.display = 'none';
	}

	showCredentialsList() {
		document.getElementById('loginForm').style.display = 'none';
		document.getElementById('loadingState').style.display = 'none';
		document.getElementById('noCredentials').style.display = 'none';

		const credentialsList = document.getElementById('credentialsList');
		const credentialsContainer = document.getElementById('credentialsContainer');

		credentialsList.style.display = 'block';
		credentialsContainer.innerHTML = '';

		if (this.credentials.length === 0) {
			document.getElementById('noCredentials').style.display = 'block';
			return;
		}

		this.credentials.forEach((credential) => {
			const credentialElement = this.createCredentialElement(credential);
			credentialsContainer.appendChild(credentialElement);
		});
	}

	createCredentialElement(credential) {
		const div = document.createElement('div');
		div.className = 'credential-item';
		div.innerHTML = `
      <div class="credential-label">${credential.label}</div>
      <div class="credential-url">${credential.url}</div>
      <div class="credential-username">${credential.username}</div>
    `;

		div.addEventListener('click', () => {
			this.fillCredentials(credential);
		});

		return div;
	}

	async fillCredentials(credential) {
		try {
			const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

			// Send message to content script to fill credentials
			await chrome.tabs.sendMessage(tab.id, {
				action: 'fillCredentials',
				credential: {
					username: credential.username,
					password: credential.password
				}
			});

			// Record usage
			await fetch(`${API_BASE_URL}/credentials/${credential.id}/use`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.token}`,
				},
			});

			// Close popup
			window.close();
		} catch (error) {
			console.error('Failed to fill credentials:', error);
		}
	}
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	new ChromePassPopup();
});

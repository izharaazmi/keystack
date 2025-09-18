// Content script for Chrome Pass extension
// Handles autofill functionality on web pages

class ChromePassContent {
  constructor() {
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'fillCredentials') {
        this.fillCredentials(request.credential);
        sendResponse({ success: true });
      }
    });
  }

  fillCredentials(credential) {
    const { username, password } = credential;

    // Find username/email input fields
    const usernameSelectors = [
      'input[type="email"]',
      'input[name*="email"]',
      'input[name*="username"]',
      'input[name*="user"]',
      'input[id*="email"]',
      'input[id*="username"]',
      'input[id*="user"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="username" i]',
      'input[placeholder*="user" i]'
    ];

    // Find password input fields
    const passwordSelectors = [
      'input[type="password"]',
      'input[name*="password"]',
      'input[id*="password"]',
      'input[placeholder*="password" i]'
    ];

    // Fill username field
    const usernameField = this.findField(usernameSelectors);
    if (usernameField) {
      this.fillField(usernameField, username);
    }

    // Fill password field
    const passwordField = this.findField(passwordSelectors);
    if (passwordField) {
      this.fillField(passwordField, password);
    }

    // Show visual feedback
    this.showFeedback();
  }

  findField(selectors) {
    for (const selector of selectors) {
      const field = document.querySelector(selector);
      if (field && field.offsetParent !== null) { // Check if visible
        return field;
      }
    }
    return null;
  }

  fillField(field, value) {
    // Focus the field
    field.focus();

    // Clear existing value
    field.value = '';

    // Set the new value
    field.value = value;

    // Trigger input events to ensure form libraries detect the change
    const events = ['input', 'change', 'keyup', 'blur'];
    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true });
      field.dispatchEvent(event);
    });

    // Highlight the field briefly
    this.highlightField(field);
  }

  highlightField(field) {
    const originalBorder = field.style.border;
    const originalBoxShadow = field.style.boxShadow;
    
    field.style.border = '2px solid #3b82f6';
    field.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
    
    setTimeout(() => {
      field.style.border = originalBorder;
      field.style.boxShadow = originalBoxShadow;
    }, 1000);
  }

  showFeedback() {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = 'Chrome Pass: Credentials filled!';
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize content script
new ChromePassContent();

// Background script for Chrome Pass extension
// Handles extension lifecycle and communication

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup automatically due to manifest configuration
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCredentials') {
    // Handle credential requests if needed
    sendResponse({ success: true });
  }
});

// Monitor tab updates to refresh credentials
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Notify content script that page has loaded
    chrome.tabs.sendMessage(tabId, { action: 'pageLoaded' }).catch(() => {
      // Ignore errors if content script is not ready
    });
  }
});

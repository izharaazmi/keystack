# Chrome Pass Extension

Chrome browser extension for secure password sharing and auto-fill functionality.

## 🚀 Quick Start

1. **Load Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this folder

2. **Login**:
   - Click the extension icon in the toolbar
   - Enter your credentials (same as admin dashboard)

3. **Auto-fill**:
   - Visit any website with stored credentials
   - The extension will automatically detect and fill forms

## 📋 Prerequisites

- **Chrome Browser**: Version 88 or higher
- **Backend API**: Must be running on port 3001
- **User Account**: Valid account in the Chrome Pass system

## 🔧 Installation

### Development Installation

1. **Navigate to extension directory**:
   ```bash
   cd chrome-extension
   ```

2. **Load in Chrome**:
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

3. **Pin Extension** (optional):
   - Click the puzzle piece icon in Chrome toolbar
   - Pin "Chrome Pass" for easy access

### Production Installation

1. **Build Extension** (if needed):
   ```bash
   # No build step required - uses vanilla JavaScript
   ```

2. **Package for Chrome Web Store**:
   - Zip the extension folder
   - Upload to Chrome Web Store Developer Dashboard

## 📁 File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js            # Content script for web pages
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── options.html          # Extension options page
├── options.js            # Options page functionality
├── icons/                # Extension icons
│   ├── icon16.png        # 16x16 icon
│   ├── icon32.png        # 32x32 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
└── README.md             # This file
```

## 🔌 Extension Components

### Manifest (manifest.json)
- **Version**: Manifest V3
- **Permissions**: activeTab, storage, tabs, scripting
- **Host Permissions**: localhost:3001, all HTTPS sites
- **Background**: Service worker for background tasks
- **Content Scripts**: Injected into all web pages
- **Action**: Popup interface and toolbar icon

### Background Script (background.js)
- **Service Worker**: Handles extension lifecycle
- **API Communication**: Communicates with backend API
- **Storage Management**: Manages local credential cache
- **Tab Management**: Monitors active tabs for auto-fill

### Content Script (content.js)
- **Form Detection**: Identifies login forms on web pages
- **Auto-fill Logic**: Automatically fills detected forms
- **User Interaction**: Handles manual credential selection
- **Security**: Secure credential handling

### Popup Interface (popup.html/js)
- **Login Form**: User authentication
- **Credential List**: Display available credentials
- **Manual Fill**: Manual credential selection
- **Settings**: Extension configuration

### Options Page (options.html/js)
- **API Configuration**: Backend API settings
- **User Preferences**: Extension behavior settings
- **About Information**: Version and help

## 🎯 Features

### Auto-fill Functionality
- **Form Detection**: Automatically detects login forms
- **URL Matching**: Matches stored credentials to current URL
- **Pattern Matching**: Uses URL patterns for flexible matching
- **One-click Fill**: Single click to fill credentials

### Manual Access
- **Credential Browser**: Browse all available credentials
- **Search/Filter**: Find specific credentials quickly
- **Copy to Clipboard**: Copy passwords for manual entry
- **Recent Credentials**: Quick access to recently used

### Security Features
- **Secure Storage**: Credentials stored securely
- **Session Management**: Automatic logout on browser close
- **HTTPS Only**: Only works on secure connections
- **Permission Control**: Minimal required permissions

## 🔐 Authentication

### Login Process
1. **Click Extension Icon**: Opens popup interface
2. **Enter Credentials**: Same as admin dashboard
3. **Token Storage**: JWT stored securely in extension storage
4. **Auto-login**: Remembers login for session

### Default Credentials
- **Email**: `admin@chromepass.com`
- **Password**: `admin123`

## 🛠️ Configuration

### API Settings
The extension connects to the backend API:
- **Default URL**: `http://localhost:3001`
- **Configurable**: Can be changed in options page
- **HTTPS Required**: Production requires HTTPS

### URL Patterns
Credentials use URL patterns for matching:
- **Exact Match**: `https://example.com`
- **Pattern Match**: `example.com/*`
- **Wildcard**: `*.example.com`

## 🎨 User Interface

### Popup Interface
- **Clean Design**: Simple, intuitive interface
- **Responsive**: Works on different screen sizes
- **Dark/Light Mode**: Follows system theme
- **Quick Actions**: One-click credential filling

### Options Page
- **Settings Panel**: Configure extension behavior
- **API Configuration**: Set backend API URL
- **About Section**: Version and help information
- **Reset Options**: Clear stored data

## 🔒 Security Considerations

### Data Protection
- **Encrypted Storage**: Credentials stored securely
- **Session Timeout**: Automatic logout for security
- **HTTPS Only**: Secure communication only
- **Minimal Permissions**: Only required permissions

### Privacy
- **No Data Collection**: No user data collected
- **Local Storage**: Data stays on user's device
- **Secure Communication**: Encrypted API communication
- **No Tracking**: No user behavior tracking

## 🚀 Development

### Local Development
1. **Load Extension**: Use "Load unpacked" in Chrome
2. **Make Changes**: Edit files as needed
3. **Reload Extension**: Click reload button in extensions page
4. **Test Changes**: Test functionality in browser

### Debugging
- **Console Logs**: Check browser console for errors
- **Extension Console**: Use Chrome DevTools for extension debugging
- **Network Tab**: Monitor API requests
- **Storage Tab**: Check stored data

### Testing
- **Manual Testing**: Test on various websites
- **Form Detection**: Test form detection logic
- **Auto-fill**: Test automatic filling
- **Manual Access**: Test popup functionality

## 📱 Browser Compatibility

### Supported Browsers
- **Chrome**: Version 88+
- **Chromium**: Latest version
- **Edge**: Version 88+ (Chromium-based)

### Requirements
- **Manifest V3**: Modern extension format
- **Service Workers**: Background script support
- **Content Scripts**: Web page injection support
- **Storage API**: Local data storage

## 🐛 Troubleshooting

### Common Issues

1. **Extension Not Loading**:
   - Check manifest.json syntax
   - Verify all files are present
   - Check Chrome console for errors

2. **Auto-fill Not Working**:
   - Check if credentials are assigned to user
   - Verify URL patterns match current site
   - Check if forms are detected properly

3. **Login Issues**:
   - Verify backend API is running
   - Check API URL configuration
   - Clear extension storage and try again

4. **Permission Errors**:
   - Check manifest permissions
   - Verify host permissions
   - Reload extension after changes

### Debug Steps
1. **Check Console**: Look for JavaScript errors
2. **Verify API**: Test API connection
3. **Check Storage**: Verify stored data
4. **Test Manually**: Try manual credential access

## 🔄 Updates

### Extension Updates
- **Automatic**: Updates from Chrome Web Store
- **Manual**: Reload extension in development
- **Version Check**: Check manifest version

### API Updates
- **Backward Compatibility**: Maintains compatibility
- **New Features**: Supports new API features
- **Error Handling**: Graceful error handling

## 📞 Support

For extension-specific issues:
1. Check this README
2. Verify backend API is running
3. Check Chrome console for errors
4. Test on different websites
5. Clear extension storage and re-login

## 🚀 Production Deployment

### Chrome Web Store
1. **Package Extension**: Zip the extension folder
2. **Developer Account**: Create Chrome Web Store developer account
3. **Upload Package**: Upload zipped extension
4. **Review Process**: Wait for Google review
5. **Publish**: Make extension available to users

### Enterprise Deployment
1. **Private Distribution**: Use Chrome Enterprise policies
2. **Internal Store**: Deploy through internal systems
3. **Group Policy**: Configure via Windows Group Policy
4. **Manual Installation**: Distribute extension files

## 📄 License

This extension is part of the Chrome Pass project and follows the same license terms.

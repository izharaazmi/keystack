// Simple script to generate PNG icons for Chrome extension
// This creates basic PNG files using Node.js built-in modules

const fs = require('fs');
const path = require('path');

// Create a simple PNG generator for basic icons
function createPNGIcon(size, filename) {
	// For now, we'll create a simple colored square as a placeholder
	// In a real implementation, you'd use a library like 'canvas' or 'sharp'

	const colors = {
		16: '#3b82f6',
		32: '#3b82f6',
		48: '#3b82f6',
		128: '#3b82f6'
	};

	// Create a simple HTML file that can be used to generate the icons
	const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; }
    .icon {
      width: ${size}px;
      height: ${size}px;
      background: ${colors[size]};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: Arial, sans-serif;
      font-weight: bold;
      font-size: ${size * 0.3}px;
      border: ${size * 0.05}px solid #1E40AF;
    }
    .key {
      width: ${size * 0.6}px;
      height: ${size * 0.6}px;
      position: relative;
    }
    .key-head {
      width: ${size * 0.3}px;
      height: ${size * 0.3}px;
      background: white;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .key-shaft {
      width: ${size * 0.2}px;
      height: ${size * 0.1}px;
      background: white;
      position: absolute;
      top: 50%;
      left: 70%;
      transform: translateY(-50%);
    }
  </style>
</head>
<body>
  <div class="icon">
    <div class="key">
      <div class="key-head"></div>
      <div class="key-shaft"></div>
    </div>
  </div>
</body>
</html>`;

	fs.writeFileSync(path.join(__dirname, `${filename}.html`), html);
	console.log(`Created ${filename}.html - you can open this in a browser and take a screenshot to create the PNG`);
}

// Generate HTML files for each icon size
createPNGIcon(16, 'icon16');
createPNGIcon(32, 'icon32');
createPNGIcon(48, 'icon48');
createPNGIcon(128, 'icon128');

console.log('Icon HTML files generated!');
console.log('To create PNG files:');
console.log('1. Open each .html file in a browser');
console.log('2. Take a screenshot or use browser dev tools to save as PNG');
console.log('3. Save as icon16.png, icon32.png, icon48.png, icon128.png');

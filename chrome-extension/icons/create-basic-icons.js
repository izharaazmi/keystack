// Create basic PNG icons for Chrome extension
const fs = require('fs');

// Create a very simple PNG file
function createBasicPNG(size, filename) {
	// This creates a minimal PNG with a blue circle
	// PNG signature
	const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

	// For simplicity, let's create a basic 1x1 pixel PNG and scale it
	// This is a minimal valid PNG
	const minimalPNG = Buffer.from([
		0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
		0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
		0x49, 0x48, 0x44, 0x52, // IHDR
		0x00, 0x00, 0x00, 0x01, // width = 1
		0x00, 0x00, 0x00, 0x01, // height = 1
		0x08, // bit depth
		0x02, // color type (RGB)
		0x00, // compression
		0x00, // filter
		0x00, // interlace
		0x90, 0x77, 0x53, 0xDE, // IHDR CRC
		0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
		0x49, 0x44, 0x41, 0x54, // IDAT
		0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
		0xE2, 0x21, 0xBC, 0x33, // IDAT CRC
		0x00, 0x00, 0x00, 0x00, // IEND chunk length
		0x49, 0x45, 0x4E, 0x44, // IEND
		0xAE, 0x42, 0x60, 0x82  // IEND CRC
	]);

	// For now, let's create a simple approach using base64 encoded PNG data
	const createColoredPNG = (width, height, color) => {
		// This is a simplified approach - in reality you'd use a proper PNG library
		// For now, let's create a basic file that browsers can interpret
		return minimalPNG;
	};

	// Create a simple blue square PNG
	const pngData = createColoredPNG(size, size, '#3b82f6');
	fs.writeFileSync(filename, pngData);
	console.log(`Created ${filename} (${size}x${size})`);
}

// Since creating proper PNG files programmatically is complex,
// let's create a different approach - generate HTML files that can be converted
function createIconHTML(size, filename) {
	const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      width: ${size}px; 
      height: ${size}px; 
      overflow: hidden;
    }
    .icon {
      width: ${size}px;
      height: ${size}px;
      background: linear-gradient(135deg, #3B82F6, #1E40AF);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
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
      box-shadow: inset 0 0 0 2px #1E40AF;
    }
    .key-center {
      width: ${size * 0.15}px;
      height: ${size * 0.15}px;
      background: #1E40AF;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .key-shaft {
      width: ${size * 0.25}px;
      height: ${size * 0.08}px;
      background: white;
      position: absolute;
      top: 50%;
      left: 70%;
      transform: translateY(-50%);
      border-radius: 2px;
    }
    .key-teeth {
      width: ${size * 0.08}px;
      height: ${size * 0.15}px;
      background: white;
      position: absolute;
      top: 50%;
      left: 55%;
      transform: translateY(-50%);
      border-radius: 1px;
    }
    .key-teeth::before {
      content: '';
      position: absolute;
      width: ${size * 0.08}px;
      height: ${size * 0.1}px;
      background: white;
      top: -${size * 0.05}px;
      left: 0;
      border-radius: 1px;
    }
  </style>
</head>
<body>
  <div class="icon">
    <div class="key">
      <div class="key-head">
        <div class="key-center"></div>
      </div>
      <div class="key-shaft"></div>
      <div class="key-teeth"></div>
    </div>
  </div>
</body>
</html>`;

	fs.writeFileSync(filename, html);
	console.log(`Created ${filename} - open in browser and save as PNG`);
}

// Generate HTML files for each size
createIconHTML(16, 'icon16.html');
createIconHTML(32, 'icon32.html');
createIconHTML(48, 'icon48.html');
createIconHTML(128, 'icon128.html');

console.log('\nIcon generation complete!');
console.log('To create PNG files:');
console.log('1. Open each .html file in a browser');
console.log('2. Right-click on the icon and "Save image as..."');
console.log('3. Save as icon16.png, icon32.png, icon48.png, icon128.png');
console.log('4. Or use browser dev tools to capture the element as PNG');

// Convert HTML icons to PNG using a simple approach
const fs = require('fs');
const { exec } = require('child_process');

// Check if we can use a headless browser to convert HTML to PNG
function checkForPuppeteer() {
  try {
    require('puppeteer');
    return true;
  } catch (e) {
    return false;
  }
}

// Create a simple PNG using a basic approach
function createSimplePNG(size) {
  // Create a minimal PNG file with a blue circle
  // This is a very basic approach - in production you'd use a proper PNG library
  
  const width = size;
  const height = size;
  
  // Create a simple data URL that represents a blue circle
  const canvas = `
    <canvas width="${width}" height="${height}" id="canvas"></canvas>
    <script>
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      
      // Draw blue circle
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.arc(${width/2}, ${height/2}, ${width/2 - 2}, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw white key icon
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(${width/2}, ${height/2}, ${width/4}, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw key shaft
      ctx.fillRect(${width/2 + width/8}, ${height/2 - width/16}, ${width/4}, ${width/8});
      
      // Draw key teeth
      ctx.fillRect(${width/2 + width/16}, ${height/2 - width/8}, ${width/16}, ${width/4});
      ctx.fillRect(${width/2 + width/12}, ${height/2 - width/6}, ${width/16}, ${width/3});
      
      // Convert to data URL
      const dataURL = canvas.toDataURL('image/png');
      console.log(dataURL);
    </script>
  `;
  
  return canvas;
}

// Create HTML files that can be opened in browser
function createConvertibleHTML() {
  const sizes = [16, 32, 48, 128];
  
  sizes.forEach(size => {
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
      background: transparent;
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
      box-shadow: inset 0 0 0 1px #1E40AF;
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
    
    fs.writeFileSync(`icon${size}.html`, html);
  });
  
  console.log('HTML files created for conversion to PNG');
  console.log('To convert to PNG:');
  console.log('1. Open each HTML file in Chrome');
  console.log('2. Right-click on the icon and "Save image as..."');
  console.log('3. Or use Chrome DevTools:');
  console.log('   - Right-click on the icon');
  console.log('   - Inspect Element');
  console.log('   - Right-click on the .icon element in DevTools');
  console.log('   - "Capture node screenshot"');
  console.log('4. Save as icon16.png, icon32.png, icon48.png, icon128.png');
}

// Create a simple script that can be run to generate PNGs
function createPNGGenerator() {
  const script = `#!/bin/bash
# Simple script to convert HTML to PNG using Chrome headless
# Make sure Chrome is installed and accessible

echo "Converting HTML icons to PNG..."

for size in 16 32 48 128; do
  echo "Converting icon\${size}.html to icon\${size}.png"
  
  # Try to use Chrome headless mode
  if command -v google-chrome &> /dev/null; then
    google-chrome --headless --disable-gpu --window-size=\${size},\${size} --screenshot=icon\${size}.png icon\${size}.html
  elif command -v chromium-browser &> /dev/null; then
    chromium-browser --headless --disable-gpu --window-size=\${size},\${size} --screenshot=icon\${size}.png icon\${size}.html
  else
    echo "Chrome/Chromium not found. Please open icon\${size}.html manually and save as PNG."
  fi
done

echo "Conversion complete!"
`;
  
  fs.writeFileSync('convert-to-png.sh', script);
  fs.chmodSync('convert-to-png.sh', '755');
  console.log('Created convert-to-png.sh script');
}

// Generate everything
createConvertibleHTML();
createPNGGenerator();

console.log('\nIcon generation complete!');
console.log('Files created:');
console.log('- icon16.html, icon32.html, icon48.html, icon128.html');
console.log('- convert-to-png.sh (run with: ./convert-to-png.sh)');
console.log('\nManual conversion:');
console.log('1. Open each HTML file in a browser');
console.log('2. Right-click on the icon and save as PNG');
console.log('3. Or use browser dev tools to capture the element');

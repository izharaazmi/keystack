// Simple icon generator using basic PNG creation
const fs = require('fs');

// Create a simple PNG file with basic header
function createSimplePNG(size, filename) {
  // PNG signature
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const width = size;
  const height = size;
  const bitDepth = 8;
  const colorType = 2; // RGB
  const compression = 0;
  const filter = 0;
  const interlace = 0;
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(bitDepth, 8);
  ihdrData.writeUInt8(colorType, 9);
  ihdrData.writeUInt8(compression, 10);
  ihdrData.writeUInt8(filter, 11);
  ihdrData.writeUInt8(interlace, 12);
  
  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // Length
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.from([
      (ihdrCrc >> 24) & 0xFF,
      (ihdrCrc >> 16) & 0xFF,
      (ihdrCrc >> 8) & 0xFF,
      ihdrCrc & 0xFF
    ])
  ]);
  
  // Create image data (simple blue circle)
  const bytesPerPixel = 3;
  const rowBytes = width * bytesPerPixel + 1; // +1 for filter byte
  const imageData = Buffer.alloc(height * rowBytes);
  
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    imageData[rowStart] = 0; // Filter type (none)
    
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * bytesPerPixel;
      
      // Calculate distance from center
      const centerX = width / 2;
      const centerY = height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      if (distance <= width / 2) {
        // Inside circle - blue gradient
        const intensity = Math.max(0, 1 - distance / (width / 2));
        imageData[pixelStart] = Math.floor(59 * intensity);     // R
        imageData[pixelStart + 1] = Math.floor(130 * intensity); // G
        imageData[pixelStart + 2] = Math.floor(246 * intensity); // B
      } else {
        // Outside circle - transparent (black for now)
        imageData[pixelStart] = 0;     // R
        imageData[pixelStart + 1] = 0; // G
        imageData[pixelStart + 2] = 0; // B
      }
    }
  }
  
  // Compress image data (simple approach - just store as-is for now)
  const compressedData = imageData;
  
  // IDAT chunk
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), compressedData]));
  const idatChunk = Buffer.concat([
    Buffer.from([
      (compressedData.length >> 24) & 0xFF,
      (compressedData.length >> 16) & 0xFF,
      (compressedData.length >> 8) & 0xFF,
      compressedData.length & 0xFF
    ]),
    Buffer.from('IDAT'),
    compressedData,
    Buffer.from([
      (idatCrc >> 24) & 0xFF,
      (idatCrc >> 16) & 0xFF,
      (idatCrc >> 8) & 0xFF,
      idatCrc & 0xFF
    ])
  ]);
  
  // IEND chunk
  const iendCrc = crc32(Buffer.from('IEND'));
  const iendChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 0]), // Length
    Buffer.from('IEND'),
    Buffer.from([
      (iendCrc >> 24) & 0xFF,
      (iendCrc >> 16) & 0xFF,
      (iendCrc >> 8) & 0xFF,
      iendCrc & 0xFF
    ])
  ]);
  
  // Combine all chunks
  const pngData = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
  
  fs.writeFileSync(filename, pngData);
  console.log(`Created ${filename} (${size}x${size})`);
}

// Simple CRC32 implementation
function crc32(data) {
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return crc ^ 0xFFFFFFFF;
}

// Generate icons
createSimplePNG(16, 'icon16.png');
createSimplePNG(32, 'icon32.png');
createSimplePNG(48, 'icon48.png');
createSimplePNG(128, 'icon128.png');

console.log('All icons generated successfully!');

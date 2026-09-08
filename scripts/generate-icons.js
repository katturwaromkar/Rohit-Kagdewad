// Node.js script to generate valid PNG icon files for PWA (192x192, 512x512, apple-touch-icon)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createSolidPNG(width, height, r, g, b, a = 255) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // deflate compression
  ihdrData.writeUInt8(0, 11); // standard filter
  ihdrData.writeUInt8(0, 12); // no interlace
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // Raw scanlines with RGBA pixels
  const rawBytesPerRow = width * 4;
  const scanlines = Buffer.alloc(height * (1 + rawBytesPerRow));
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + rawBytesPerRow);
    scanlines[rowOffset] = 0; // Filter type 0 (None)
    
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + (x * 4);
      
      // Draw a sleek dark navy background (#0f172a) with emerald accent (#10b981) center emblem
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      const radius = width * 0.38;
      
      if (dist < radius) {
        // Emerald center
        scanlines[pxOffset] = 16;     // R
        scanlines[pxOffset + 1] = 185; // G
        scanlines[pxOffset + 2] = 129; // B
        scanlines[pxOffset + 3] = 255; // A
      } else {
        // Deep Slate background (#0f172a)
        scanlines[pxOffset] = 15;
        scanlines[pxOffset + 1] = 23;
        scanlines[pxOffset + 2] = 42;
        scanlines[pxOffset + 3] = 255;
      }
    }
  }
  
  const compressed = zlib.deflateSync(scanlines);
  const idatChunk = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const length = data.length;
  const header = Buffer.alloc(8);
  header.writeUInt32BE(length, 0);
  header.write(type, 4, 4, 'ascii');
  
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  
  const footer = Buffer.alloc(4);
  footer.writeUInt32BE(crc, 0);
  
  return Buffer.concat([header, data, footer]);
}

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createSolidPNG(192, 192, 15, 23, 42));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createSolidPNG(512, 512, 15, 23, 42));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createSolidPNG(180, 180, 15, 23, 42));
console.log('✓ PWA icons generated successfully in public/');

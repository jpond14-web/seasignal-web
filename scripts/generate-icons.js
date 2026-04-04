const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

async function generatePNG(inputSvg, outputPng, size) {
  const svgBuffer = fs.readFileSync(inputSvg);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPng);
  console.log(`Generated ${outputPng} (${size}x${size})`);
}

async function main() {
  // Regular icons
  await generatePNG(
    path.join(iconsDir, 'icon-192.svg'),
    path.join(iconsDir, 'icon-192.png'),
    192
  );
  await generatePNG(
    path.join(iconsDir, 'icon-512.svg'),
    path.join(iconsDir, 'icon-512.png'),
    512
  );

  // Maskable icons
  await generatePNG(
    path.join(iconsDir, 'icon-maskable-192.svg'),
    path.join(iconsDir, 'icon-maskable-192.png'),
    192
  );
  await generatePNG(
    path.join(iconsDir, 'icon-maskable-512.svg'),
    path.join(iconsDir, 'icon-maskable-512.png'),
    512
  );

  // Apple touch icon (180x180 is the standard)
  await generatePNG(
    path.join(iconsDir, 'icon-512.svg'),
    path.join(iconsDir, 'apple-touch-icon.png'),
    180
  );

  console.log('All PNG icons generated successfully.');
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

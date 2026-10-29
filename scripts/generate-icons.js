import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Standalone SVG App Icon with Indian Knight & Crown
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#0f172a" />
      <stop offset="50%" stopColor="#020617" />
      <stop offset="100%" stopColor="#090d16" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#ffea88" />
      <stop offset="40%" stopColor="#f5b821" />
      <stop offset="80%" stopColor="#d98207" />
      <stop offset="100%" stopColor="#9e5602" />
    </linearGradient>
    <linearGradient id="sheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bg)" />
  <rect x="8" y="8" width="496" height="496" rx="104" stroke="url(#gold)" stroke-width="4" stroke-opacity="0.3" />

  <!-- Subtle Board Grid watermark in background -->
  <g opacity="0.08" stroke="#ffffff" stroke-width="2">
    <line x1="128" y1="64" x2="128" y2="448" />
    <line x1="256" y1="64" x2="256" y2="448" />
    <line x1="384" y1="64" x2="384" y2="448" />
    <line x1="64" y1="128" x2="448" y2="128" />
    <line x1="64" y1="256" x2="448" y2="256" />
    <line x1="64" y1="384" x2="448" y2="384" />
  </g>

  <!-- Golden Knight / Royal Piece Crest -->
  <g transform="translate(106, 80) scale(3)" filter="url(#shadow)">
    <!-- Pedestal Base -->
    <ellipse cx="50" cy="84" rx="25" ry="5.5" fill="url(#gold)" stroke="#381c03" stroke-width="2.5" />
    <path d="M27 83 C27 77 34 76 38 74 L62 74 C66 76 73 77 73 83 Z" fill="url(#gold)" stroke="#381c03" stroke-width="2.5" />

    <!-- Horse Body -->
    <path d="M38 74 C36 68 33 60 30 54 C28 50 24 49 22 47 C19 44 20 38 25 36 C30 34 35 37 38 35 C42 32 46 22 51 18 C56 14 62 16 64 21 C65 24 66 28 66 32 C68 40 70 56 62 74 Z" fill="url(#gold)" stroke="#381c03" stroke-width="2.5" stroke-linejoin="round" />

    <!-- Neck Sheen -->
    <path d="M34 70 C31 62 29 55 27 50 C26 47 24 45 23 44 C24 41 27 40 31 39 C34 40 37 41 40 38 C43 35 48 24 53 20 C54 23 54 27 54 32 C54 44 52 58 48 68 Z" fill="url(#sheen)" />

    <!-- War Horn / Conch Crest -->
    <path d="M51 18 C47 22 45 28 47 34 C49 39 55 42 61 40 C66 38 68 32 66 26 C64 20 57 16 51 18 Z" fill="url(#gold)" stroke="#381c03" stroke-width="2.5" />
    <ellipse cx="56" cy="30" rx="5" ry="4" fill="#2b1104" stroke="#381c03" stroke-width="1.2" />

    <!-- Circular Harness Medallion -->
    <circle cx="39" cy="45" r="8" fill="url(#gold)" stroke="#381c03" stroke-width="2.5" />
    <circle cx="39" cy="45" r="4.5" fill="#f5b821" stroke="#381c03" stroke-width="1.2" />
    <circle cx="39" cy="45" r="1.8" fill="#2b1104" />

    <!-- Eye and Mane Details -->
    <circle cx="24" cy="42" r="1.6" fill="#1a0b02" />
    <path d="M62 24 C67 27 70 34 69 41 M67 44 C72 49 73 57 70 64" stroke="#381c03" stroke-width="2.5" stroke-linecap="round" />
  </g>
</svg>
`;

// Maskable version with safe padding
const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#020617" />
  <g transform="translate(51, 51) scale(0.8)">
    ${svgIcon.replace(/<\/?svg[^>]*>/g, '')}
  </g>
</svg>
`;

async function main() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. icon-512.png
  await sharp(Buffer.from(svgIcon))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  // 2. icon-192.png
  await sharp(Buffer.from(svgIcon))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  // 3. maskable-icon-512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512.png'));
  console.log('Created maskable-icon-512.png');

  // 4. apple-touch-icon.png
  await sharp(Buffer.from(svgIcon))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 5. favicon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);
  console.log('Created icon.svg');
}

main().catch(console.error);

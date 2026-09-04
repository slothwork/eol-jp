import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const ogSource = path.join(root, 'src', 'assets', 'og-default.svg');
const faviconSource = path.join(publicDir, 'favicon.svg');

await fs.mkdir(publicDir, { recursive: true });

await sharp(ogSource, { density: 144 })
  .resize(1200, 630)
  .png({ palette: true, quality: 92 })
  .toFile(path.join(publicDir, 'og-default.png'));

await sharp(faviconSource, { density: 288 })
  .resize(180, 180)
  .png({ palette: true, quality: 92 })
  .toFile(path.join(publicDir, 'apple-touch-icon.png'));

console.log('Generated OGP and Apple Touch Icon assets.');

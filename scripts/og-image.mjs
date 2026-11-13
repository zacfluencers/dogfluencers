import sharp from 'sharp';
// Builds public/og.jpg: the logo centred on the brand orange, 1200x630.
// node scripts/og-image.mjs public/logo.png public/og.jpg
const [,, logoPath, out] = process.argv;
const W = 1200, H = 630, logoW = 760;
const logo = await sharp(logoPath).trim().resize({ width: logoW }).toBuffer();
const { height: lh } = await sharp(logo).metadata();
await sharp({ create: { width: W, height: H, channels: 3, background: '#f53d0c' } })
  .composite([{ input: logo, left: Math.round((W - logoW) / 2), top: Math.round((H - lh) / 2) }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(out);
console.log('logo', logoW, 'x', lh);

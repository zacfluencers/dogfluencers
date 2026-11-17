// Builds the round footer icons for the emails (public/email/icon-*.png):
// cream circles with night line icons, drawn at 3x for sharp retina display
// (shown at 32px). PNGs, not SVG, because Gmail blocks SVG images.
//   node scripts/email-icons.mjs
import sharp from 'sharp';
const cream = '#f9ead0', night = '#1a1412';
const s = 'fill="none" stroke="' + night + '" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const glyphs = {
  instagram: `<rect x="6.5" y="6.5" width="11" height="11" rx="3.2" ${s}/><circle cx="12" cy="12" r="2.7" ${s}/><circle cx="15.3" cy="8.7" r="0.6" fill="${night}"/>`,
  web: `<circle cx="12" cy="12" r="5.8" ${s}/><path d="M6.4 12h11.2M12 6.2c1.7 1.6 2.5 3.6 2.5 5.8s-.8 4.2-2.5 5.8M12 6.2c-1.7 1.6-2.5 3.6-2.5 5.8s.8 4.2 2.5 5.8" ${s}/>`,
  email: `<rect x="6" y="7.8" width="12" height="8.6" rx="1.6" ${s}/><path d="M6.6 8.6l5.4 4.2 5.4-4.2" ${s}/>`,
};
for (const [name, g] of Object.entries(glyphs)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96"><circle cx="12" cy="12" r="12" fill="${cream}"/>${g}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`public/email/icon-${name}.png`);
  console.log('wrote', `public/email/icon-${name}.png`);
}

/**
 * Measures where a logo's ink actually sits inside its file, at build time.
 *
 * Logo files arrive with wildly different padding baked in, so sizing the
 * files evenly never sizes the marks evenly. This finds the bounding box of
 * every pixel that isn't transparent, as fractions of the file, so LogoCloud
 * can crop the padding away and size each mark by its real shape.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

export interface LogoBox {
  /** Natural width / height of the file. */
  aspect: number;
  /** The ink's bounding box, as fractions of the file (0 to 1). */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Alpha below this counts as empty: anti-aliasing haze, not ink. */
const ALPHA_THRESHOLD = 24;

const cache = new Map<string, Promise<LogoBox | undefined>>();

export function measureLogo(src: string): Promise<LogoBox | undefined> {
  if (!cache.has(src)) cache.set(src, measure(src).catch(() => undefined));
  return cache.get(src)!;
}

async function load(src: string): Promise<Buffer> {
  if (/^https?:\/\//.test(src)) {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`${response.status} fetching ${src}`);
    return Buffer.from(await response.arrayBuffer());
  }
  return readFile(join(process.cwd(), 'public', src));
}

async function measure(src: string): Promise<LogoBox | undefined> {
  const { data, info } = await sharp(await load(src))
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  let top = height, bottom = -1, left = width, right = -1;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (data[row * width + col] < ALPHA_THRESHOLD) continue;
      if (row < top) top = row;
      if (row > bottom) bottom = row;
      if (col < left) left = col;
      if (col > right) right = col;
    }
  }
  if (bottom < 0) return undefined;

  return {
    aspect: width / height,
    x: left / width,
    y: top / height,
    w: (right - left + 1) / width,
    h: (bottom - top + 1) / height,
  };
}

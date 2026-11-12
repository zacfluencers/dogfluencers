/**
 * Homepage hero reel: portrait (9:16) dog content.
 *
 * The first three are 3 to 4 second loops cut from creator videos supplied
 * in November 2026 (raw files kept outside the repo, in ~/ShipStudio/dog-raw);
 * the rest are stills.
 * TODO(confirm): usage rights for each frame. To add a clip: put the MP4 (and a poster still) in
 * `public/video/hero/`, set `src` and `poster`, describe it in `alt`, and
 * mark it `approved`. Six fill three columns of two; four or five also work.
 * TODO(asset): 9:16 clips with usage rights cleared.
 */
import type { ReelClip } from '../../system/types/content';

export const heroReel: ReelClip[] = [
  { id: 'reel-golden-beach', video: { src: '/video/golden-beach.mp4', poster: '/video/golden-beach.jpg', alt: 'A wet golden retriever sitting on a sunny beach, mouth open in a grin.' }, status: 'approved' },
  { id: 'reel-spaniel', video: { src: '/video/spaniel-look.mp4', poster: '/video/spaniel-look.jpg', alt: 'A chocolate spaniel on a lawn looking up into the camera.' }, status: 'approved' },
  { id: 'reel-lurcher', video: { src: '/video/lurcher-pup.mp4', poster: '/video/lurcher-pup.jpg', alt: 'A black and white lurcher puppy lying on a carpet, looking up.' }, status: 'approved' },
  { id: 'reel-lab', video: { poster: '/images/dogs/lab-patio.jpg', alt: 'A yellow labrador sitting on a patio looking up at the camera.' }, status: 'approved' },
  { id: 'reel-beagle', video: { poster: '/images/dogs/beagle-portrait.jpg', alt: 'A tricolour beagle standing indoors, looking to one side.' }, status: 'approved' },
  { id: 'reel-golden-cows', video: { poster: '/images/dogs/golden-cows.jpg', alt: 'A golden retriever sitting in long grass with cows behind a fence.' }, status: 'approved' },
];

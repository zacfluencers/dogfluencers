/**
 * The work: content dog creators have made for clients.
 *
 * Approved by the business on 12 November 2026 (Poppy's Picnic and Zesty Paws).
 * Videos are the creators' full edits, supplied in November 2026.
 * TODO(asset): the 9:16 clips these frames come from.
 */
import type { WorkItem } from '../../system/types/content';

// `start`: where the muted preview opens (a media fragment), so a card
// leads with the dog rather than the video's first frame. Sound restarts
// the piece from the beginning.
const post = (id: string, brand: string, caption: string, file: string, alt: string, clip = false, start = 0): WorkItem => ({
  id,
  brand,
  caption,
  // Full-length videos with their sound: the work section plays the whole
  // piece, muted until a viewer turns sound on.
  video: clip ? { src: `/video/full/${file}.mp4${start ? `#t=${start}` : ''}`, poster: `/video/${file}.jpg`, alt } : { poster: `/images/dogs/${file}.jpg`, alt },
  status: 'approved',
});

export const work: WorkItem[] = [
  post('work-zesty-cocker', 'Zesty Paws', 'Probiotic paste, shown at home.', 'cocker-paste', 'A red and white cocker spaniel on a dog bed, offered a probiotic paste syringe.', true, 16),
  post('work-poppys-meatball', "Poppy's Picnic", 'A meatball topper, and a very patient collie.', 'collie-meatball', 'A hand holding a raw meatball in front of a border collie waiting on its bed.', true, 36.5),
  post('work-zesty-owner', 'Zesty Paws', 'Owner and collie, a taste test in the park.', 'owner-collie', 'A smiling woman in a sunny park holding out a paste syringe to her black and white collie.', true, 0.5),
  post('work-poppys-poms', "Poppy's Picnic", 'Unboxing, with four inspectors.', 'poms-box', 'Three Pomeranians and a chihuahua peering out of a delivery box surrounded by packs of dog food.', true),
  post('work-zesty-goldens', 'Zesty Paws', 'Two goldens, one syringe.', 'goldens-pair', 'Two golden retrievers watching a hand hold out a paste syringe in a garden.'),
  post('work-poppys-beagle', "Poppy's Picnic", 'The range, on the kitchen floor.', 'beagle-packs', 'A beagle sitting in a kitchen behind four packs of meatballs.'),
];

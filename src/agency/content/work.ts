/**
 * The work: content dog creators have made for clients.
 *
 * Approved by the business on 12 November 2026 (Poppy's Picnic and Zesty Paws);
 * Omni and Adaptil added 13 November 2026 with their case studies.
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

/**
 * Four rows of four, one brand per slot wherever there's enough, so every row
 * mixes clients. Each page shows its own row (`workRow`), so the section
 * changes as people move around the site. Omni, a major client, takes the
 * spare slots. Adaptil's posted videos have captions burnt in, so only its two
 * strongest are here; the rest are on its case study.
 */
export const work: WorkItem[] = [
  // Row 0: Home, service pages.
  post('work-omni-fern', 'Omni', 'A Staffy, a garden and a new food.', 'omni-fern', 'A woman kneeling on a sunny lawn, greeting her brindle Staffy beside a bag of Omni.', true, 44),
  post('work-adaptil-cuddle', 'Adaptil', 'Firework season, handled together.', 'adaptil-2', 'A woman cuddling her cocker spaniel, cheek to cheek.', true, 6.9),
  post('work-zesty-owner', 'Zesty Paws', 'Owner and collie, a taste test in the park.', 'owner-collie', 'A smiling woman in a sunny park holding out a paste syringe to her black and white collie.', true, 0.5),
  post('work-poppys-poms', "Poppy's Picnic", 'Unboxing, with four inspectors.', 'poms-box', 'Three Pomeranians and a chihuahua peering out of a delivery box surrounded by packs of dog food.', true),
  // Row 1: For Brands, Campaigns.
  post('work-omni-barkley', 'Omni', 'Wet food, served to Barkley.', 'omni-4', 'Two owners opening tins of Omni wet food for their bull terrier, Barkley.', true, 3.9),
  post('work-adaptil-staffy', 'Adaptil', 'A calm night in on the sofa.', 'adaptil-1', 'A woman on a sofa with her Staffy settled on a blanket beside her.', true, 25),
  post('work-zesty-travel', 'Zesty Paws', 'On the road with a golden.', 'zesty-travel', 'A woman in a hotel room giving her golden retriever a paste syringe.', true, 4),
  post('work-poppys-unbox', "Poppy's Picnic", 'A delivery worth waiting for.', 'poppys-unbox', "A woman unboxing a Poppy's Picnic delivery at her kitchen counter.", true, 8),
  // Row 2: About, Services.
  post('work-omni-georgia', 'Omni', 'A golden and her daily routine.', 'omni-georgia', 'A smiling woman hugging her golden retriever at home.', true, 2.5),
  post('work-zesty-cocker', 'Zesty Paws', 'Probiotic paste, shown at home.', 'cocker-paste', 'A red and white cocker spaniel on a dog bed, offered a probiotic paste syringe.', true, 16),
  post('work-poppys-tasters', "Poppy's Picnic", 'The taste test, three ways.', 'poppys-tasters', 'A yellow labrador looking up hopefully on a garden path.', true, 24),
  post('work-omni-calm', 'Omni', 'Calm food, first impressions.', 'omni-1', 'A smiling owner holding up a bag of Omni Calm food, her red cockapoo in front of her.', true, 9.7),
  // Row 3: Creators, For Creators.
  post('work-omni-sofa', 'Omni', 'Two spaniels, one new food.', 'omni-2', 'A woman on her sofa with two spaniels, trying Omni Calm dry food.', true, 7.5),
  post('work-zesty-goldens', 'Zesty Paws', 'Three goldens, one syringe.', 'zesty-goldens', 'Three golden retrievers in a field, watching a paste syringe.', true, 11),
  post('work-poppys-meatball', "Poppy's Picnic", 'A meatball topper, and a very patient collie.', 'collie-meatball', 'A hand holding a raw meatball in front of a border collie waiting on its bed.', true, 36.5),
  post('work-omni-treat', 'Omni', 'A treat, earned in the kitchen.', 'omni-3', 'An owner crouching in her kitchen to give her black cockapoo an Omni treat.', true, 13),
];

/** One page's row of the work: four pieces, a mix of brands. */
export const workRow = <T>(items: T[], row: 0 | 1 | 2 | 3): T[] => {
  const picked = items.slice(row * 4, row * 4 + 4);
  return picked.length === 4 ? picked : items.slice(0, 4);
};

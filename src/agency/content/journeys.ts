import type { ProcessStep } from '../../system/types/content';

/** How a brand campaign runs. The current site's "How Dogfluencers works". */
export const brandJourney: ProcessStep[] = [
  {
    number: '01',
    title: 'Tell us what you are launching',
    description: 'The product, the dogs it is for, the date it has to land, and what success looks like.',
  },
  {
    number: '02',
    title: 'Choose your creators',
    description: 'Pick from a shortlist of dogs and owners matched to your product. Nobody is approached until you approve.',
  },
  {
    number: '03',
    title: 'Set your brief',
    description: 'Goals, messaging, formats and must-haves, agreed in writing before anything ships.',
  },
  {
    number: '04',
    title: 'Content within 7 days',
    description: 'Product reaches the dogs, owners film, and finished content comes back to you within a week.',
  },
  {
    number: '05',
    title: 'Approve, or ask for edits',
    description: 'Edits are unlimited, so content goes out only when it matches what you asked for.',
  },
  {
    number: '06',
    title: 'Get seen',
    description: 'Posts go live to the owners’ audiences, and the content is yours to run wherever you want.',
  },
];

/** How a creator moves through the network. */
export const creatorJourney: ProcessStep[] = [
  {
    number: '01',
    title: 'Join for free',
    description: 'Tell us about you and your dog. Joining costs nothing, and you can leave at any time.',
  },
  {
    number: '02',
    title: 'Set your rate',
    description: 'You choose what you charge. Paid offers we send are within 20% of the rate you set.',
  },
  {
    number: '03',
    title: 'Get an offer',
    description: 'When a brand picks your dog, we send the offer to you on Instagram to accept or decline.',
  },
  {
    number: '04',
    title: 'Product arrives',
    description: 'Gifted drops come with a simple ask, usually a story. Paid work comes with a brief.',
  },
  {
    number: '05',
    title: 'Create and submit',
    description: 'Film to the brief and send it for approval, then post it or hand the video to the brand.',
  },
  {
    number: '06',
    title: 'Get paid',
    description: 'Paid by PayPal once the collab is complete, usually within 48 hours. We never take a cut of your fee.',
  },
];

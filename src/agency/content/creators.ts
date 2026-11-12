import type { CreatorCategory } from '../../system/types/content';

/**
 * The kinds of dog creators in the network, not named individuals. No
 * creator's personal information appears on the site.
 */
export const creatorCategories: CreatorCategory[] = [
  {
    name: 'Everyday dogs',
    image: { src: '/images/dogs/lab-patio.jpg', alt: 'A yellow labrador sitting on a patio looking up at the camera.' },
    slug: 'everyday',
    description:
      'Family dogs with owners who love to share them. Honest, unpolished and exactly what other owners trust. The heart of every gifting drop.',
    order: 1,
    featured: true,
    status: 'approved',
  },
  {
    name: 'Breed specialists',
    image: { src: '/images/dogs/spaniels-pair.jpg', alt: 'Two chocolate working cocker spaniels looking up from a lawn.' },
    slug: 'breed',
    description:
      'Accounts built around one breed, with an audience of owners of that breed. The fastest route to a niche that buys.',
    order: 2,
    featured: true,
    status: 'approved',
  },
  {
    name: 'Puppies',
    image: { src: '/images/dogs/lurcher-pup.jpg', alt: 'A black and white lurcher puppy lying on a carpet, looking up.' },
    slug: 'puppies',
    description:
      'New owners documenting the first year: food changes, training, chews, kit. Peak buying moment, peak engagement.',
    order: 3,
    featured: true,
    status: 'approved',
  },
  {
    name: 'Active and outdoor',
    image: { src: '/images/dogs/golden-field.jpg', alt: 'A golden retriever standing in a field of young wheat on a sunny day.' },
    slug: 'outdoor',
    description:
      'Walks, hikes, swims and sport. Where harnesses, coats, joint care and anything built to get muddy get tested properly.',
    order: 4,
    status: 'approved',
  },
  {
    name: 'Rescue and senior dogs',
    image: { src: '/images/dogs/beagle-portrait.jpg', alt: 'An older tricolour beagle with a greying muzzle, standing indoors.' },
    slug: 'rescue',
    description:
      'Rescue stories and older dogs, with some of the most loyal audiences on the platform. Strong for health, comfort and food.',
    order: 5,
    status: 'approved',
  },
  {
    name: 'Dog models',
    image: { src: '/images/dogs/golden-beach.jpg', alt: 'A wet golden retriever sitting on a sunny beach, mouth open in a grin.' },
    slug: 'models',
    description:
      'Camera-ready dogs who can hold a pose, take direction and sell a product in one frame. Built for UGC and ad content.',
    order: 6,
    status: 'approved',
  },
];

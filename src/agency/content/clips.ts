/**
 * Short silent loops cut from creator videos supplied in November 2026
 * (raw files kept outside the repo, in ~/ShipStudio/dog-raw). Pages pick
 * from here so each masthead and media tile moves, without one page
 * repeating a clip. The homepage hero uses the reel (reel.ts).
 * TODO(confirm): usage rights for each source video.
 */
import type { VideoRef } from '../../system/types/content';

const loop = (file: string, alt: string): VideoRef => ({ src: `/video/${file}.mp4`, poster: `/video/${file}.jpg`, alt });

export const clips = {
  pomsBowls: loop('poms-bowls', 'Four Pomeranians and a chihuahua eating from a row of bowls.'),
  cockerLickmat: loop('cocker-lickmat', 'A red and white cocker spaniel eating from a lick mat.'),
  labPatio: loop('lab-patio', 'A yellow labrador on a patio, looking up at the camera.'),
  goldenLick: loop('golden-lick', 'A golden retriever licking a paste syringe held up to its nose.'),
  colliePark: loop('collie-park', 'A black and white collie licking a paste syringe in a park.'),
  colliePacks: loop('collie-packs', 'A border collie peering over two packs of meatballs on a wooden floor.'),
  goldensPair: loop('goldens-pair', 'Two golden retrievers watching a hand hold out a paste syringe in a garden.'),
  spanielsLick: loop('spaniels-lick', 'A springer and a cocker spaniel taking turns at a paste syringe.'),
  goldenCar: loop('golden-car', 'A happy golden retriever leaning over the back seat of a car.'),
  goldenBed: loop('golden-bed', 'A golden retriever resting on a hotel bed with a terracotta throw.'),
  beagle: loop('beagle', 'An older tricolour beagle standing on a tiled kitchen floor.'),
  ownerUnbox: loop('owner-unbox', 'A dog owner carrying a delivery box of dog food into her kitchen.'),
  goldenToy: loop('golden-toy', 'A golden retriever grinning as an owner strokes its head.'),
  // Owner and dog together, cut from Omni creator videos supplied 13 November 2026.
  fernGarden: loop('fern-garden', 'A woman kneeling on a sunny lawn, greeting her brindle Staffy beside a bag of dog food.'),
  fernWall: loop('fern-wall', 'A woman in sunglasses sitting on a garden wall, her brindle Staffy panting happily at her feet.'),
  eviePark: loop('evie-park', 'A woman crouching in a park with her arm around her black and white collie.'),
  evieTreat: loop('evie-treat', 'A woman holding out a tub of supplements to her black and white collie.'),
  evieCuddle: loop('evie-cuddle', 'A smiling woman sitting with her black and white collie, who leans in for a kiss.'),
  georgiaHug: loop('georgia-hug', 'A smiling woman hugging her golden retriever at home.'),
  georgiaKneel: loop('georgia-kneel', 'A woman kneeling in her garden, offering her golden retriever a treat.'),
  georgiaFloor: loop('georgia-floor', 'A woman sitting on the floor beside her golden retriever, holding a tub of supplements.'),
  georgiaKitchen: loop('georgia-kitchen', 'A golden retriever with its paws up on the kitchen counter, nose to nose with its owner.'),
  natashaKiss: loop('natasha-kiss', 'A woman in the car kissing her dappled dachshund on the head.'),
  natashaGarden: loop('natasha-garden', 'A woman in a garden holding her dappled dachshund close.'),
  natashaSofa: loop('natasha-sofa', 'A woman on a cream sofa cuddling her dappled dachshund.'),
  hannahSofa: loop('hannah-sofa', 'A woman on her sofa holding up a bag of dog food beside her two dogs.'),
  fernOut: loop('fern-out', 'A woman at her car in a pet shop car park, her brindle Staffy on the lead beside her.'),
  ownerCollie: { src: '/video/full/owner-collie.mp4#t=0.5', poster: '/video/owner-collie.jpg', alt: 'A smiling woman in a sunny park holding out a paste syringe to her black and white collie.' } as VideoRef,
} satisfies Record<string, VideoRef>;

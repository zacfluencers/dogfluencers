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
  ownerCollie: { src: '/video/full/owner-collie.mp4#t=0.5', poster: '/video/owner-collie.jpg', alt: 'A smiling woman in a sunny park holding out a paste syringe to her black and white collie.' } as VideoRef,
} satisfies Record<string, VideoRef>;

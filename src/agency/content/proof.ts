import type { Brand, Campaign, Statistic, Testimonial } from '../../system/types/content';

/**
 * PROOF CONTENT.
 *
 * Brands: the six the current WordPress site shows as partners ("Some of our
 * Pawesome partners", "Brands we've worked with"). The business already
 * publishes these, so they are `approved`. TODO(confirm) that each is still
 * happy to be listed before launch. Logos are the site's own files,
 * converted to one colour on transparent.
 *
 * Testimonials are still `placeholder`: it renders in review mode and is stripped
 * from production builds. Metrics read "TBC" rather than plausible figures,
 * and testimonial quotes describe what belongs there instead of
 * impersonating a client.
 */

/**
 * A creator's full video for a case study, with its sound. `start` is where
 * the muted preview opens (a media fragment, matching its poster), so a card
 * leads with owner and dog; sound plays the piece from the beginning.
 */
const film = (file: string, alt: string, start = 0) => ({ src: `/video/full/${file}.mp4${start ? `#t=${start}` : ''}`, poster: `/video/${file}.jpg`, alt });

const logo = (slug: string, name: string, width: number, height: number) => ({
  src: `/agency/brands/${slug}.png`,
  alt: name,
  width,
  height,
});

export const brands: Brand[] = [
  // New Omni artwork supplied 13 November 2026; Omni leads the strip.
  // A new file name, not a replaced omni.png, so no browser can pair a cached
  // old image with the new shape.
  { name: 'Omni', slug: 'omni', logo: logo('omni-2026', 'Omni', 1549, 333), status: 'approved' },
  { name: 'Harringtons', slug: 'harringtons', logo: logo('harringtons', 'Harringtons', 715, 239), logoScale: 1.2, status: 'approved' },
  { name: 'Buddy & Lola', slug: 'buddy-and-lola', logo: logo('buddy-and-lola', 'Buddy & Lola', 650, 326), logoScale: 1.35, status: 'approved' },
  { name: 'Bunty', slug: 'bunty', logo: logo('bunty', 'Bunty', 601, 275), status: 'approved' },
  { name: 'Total Pet', slug: 'total-pet', logo: logo('total-pet', 'Total Pet', 599, 121), status: 'approved' },
  { name: 'Puptons', slug: 'puptons', logo: logo('puptons', 'Puptons', 650, 152), status: 'approved' },
];

export const statistics: Statistic[] = [
  // From the creator CRM on 12 November 2026: 1,824 dogs across 1,337 owners.
  { label: 'Dogs in the network', value: '1,800+', context: 'With more than 1,300 owners.', status: 'approved' },
  // Supplied by the team on 13 November 2026.
  { label: 'Campaigns run', value: '200+', status: 'approved' },
  { label: 'Creators gifted', value: '10,000+', status: 'approved' },
  { label: 'Pieces of content made', value: '10,000+', status: 'approved' },
];

export const testimonials: Testimonial[] = [
  {
    quote: 'A real client quote goes here, approved for publication, with name, role and company.',
    person: 'Client name',
    role: 'Role',
    company: 'Company',
    featured: true,
    status: 'placeholder',
  },
  {
    quote: 'A second approved quote. Shorter quotes work better in the grid than in the pull quote.',
    person: 'Client name',
    role: 'Role',
    company: 'Company',
    status: 'placeholder',
  },
];

/**
 * Case studies. Figures are the ones the team supplied on 13 November 2026;
 * the copy around them describes only what the campaign content shows.
 * TODO(confirm): wording with the client, and each brand's OK to be named.
 */
export const campaigns: Campaign[] = [
  {
    title: 'A calmer firework season',
    slug: 'adaptil-firework-season',
    brand: 'Adaptil',
    campaignType: 'Mass Gifting',
    summary: 'We gifted Adaptil to 100 dog owners ahead of firework season, and they showed their followers how they help their dogs through it.',
    objective: 'Put Adaptil in front of dog owners at the moment they need it most: the weeks before fireworks start, when owners are planning how to keep a nervous dog calm at home.',
    solution: 'We chose 100 owners from the network whose dogs fit the brief and sent each one Adaptil to use in their own routine. Owners filmed what they do for firework season, from their checklists and essentials to unboxings, in their own words.',
    results: 'The 100 owners mentioned Adaptil 104 times, to a combined following of more than 746,000, and we collected 20 pieces of creator content for the brand to use.',
    metrics: [
      { label: 'Owners gifted', value: '100' },
      { label: 'Brand mentions', value: '104' },
      { label: 'Combined reach', value: '746,000+', context: 'Followers across the gifted accounts.' },
      { label: 'Pieces of content', value: '20', context: 'Collected for the brand to use.' },
    ],
    heroImage: { src: '/images/campaigns/adaptil-cover.jpg', alt: 'A woman cuddling her cocker spaniel, cheek to cheek.' },
    // Full creator videos from the campaign, as posted. TODO(confirm): usage rights.
    videos: [
      film('adaptil-1', 'A woman on a sofa with her Staffy settled on a blanket beside her, getting ready for fireworks.', 25),
      film('adaptil-2', 'A woman closing the curtains, then cuddling her cocker spaniel on the sofa.', 6.9),
      film('adaptil-3', 'A woman relaxing on a sofa with her two spaniels as fireworks season starts.', 24.4),
      film('adaptil-4', 'A dachshund owner setting up a firework night checklist, with Adaptil chews and a cosy bed.', 18.5),
    ],
    featured: true,
    status: 'approved',
  },
  {
    title: 'Omni in 100 homes',
    slug: 'omni-gifting',
    brand: 'Omni',
    campaignType: 'Mass Gifting',
    summary: 'We gifted Omni to 100 dog owners across its range, from dental sticks and treats to wet and dry food, and owners showed their dogs trying it.',
    objective: 'Get Omni\'s range into real homes and in front of the people who choose their dog\'s food, with honest first reactions from owners and their dogs.',
    solution: 'We matched 100 owners from the network to the product that suited their dog: dental sticks, treats, wet food, or dry food for calm, joints or skin. Each owner shared their dog trying it, from unboxings to taste tests.',
    results: 'The 100 owners mentioned Omni 91 times, to a combined following of more than 575,000, and we collected 20 pieces of creator content for the brand to use.',
    metrics: [
      { label: 'Owners gifted', value: '100' },
      { label: 'Brand mentions', value: '91' },
      { label: 'Combined reach', value: '575,000+', context: 'Followers across the gifted accounts.' },
      { label: 'Pieces of content', value: '20', context: 'Collected for the brand to use.' },
    ],
    heroImage: { src: '/video/omni-2.jpg', alt: 'A woman on a cream sofa with her black spaniel in her arms and a red spaniel at her side.' },
    // Full creator videos from the campaign, as posted. TODO(confirm): usage rights.
    videos: [
      film('omni-1', 'A smiling owner holding up a bag of Omni Calm food, her red cockapoo waiting in front of her.', 9.7),
      film('omni-2', 'A woman on her sofa with two spaniels, trying Omni Calm dry food.', 7.5),
      film('omni-3', 'An owner crouching in her kitchen to give her black cockapoo an Omni treat.', 13),
      film('omni-4', 'Two owners opening tins of Omni wet food for their bull terrier, Barkley.', 3.9),
    ],
    featured: true,
    status: 'approved',
  },
];

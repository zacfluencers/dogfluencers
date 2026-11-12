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
 * Everything else is `placeholder`: it renders in review mode and is stripped
 * from production builds. Metrics read "TBC" rather than plausible figures,
 * and testimonial quotes describe what belongs there instead of
 * impersonating a client.
 */

const logo = (slug: string, name: string, width: number, height: number) => ({
  src: `/agency/brands/${slug}.png`,
  alt: name,
  width,
  height,
});

export const brands: Brand[] = [
  { name: 'Harringtons', slug: 'harringtons', logo: logo('harringtons', 'Harringtons', 715, 239), logoScale: 1.2, status: 'approved' },
  { name: 'Omni', slug: 'omni', logo: logo('omni', 'Omni', 544, 187), status: 'approved' },
  { name: 'Buddy & Lola', slug: 'buddy-and-lola', logo: logo('buddy-and-lola', 'Buddy & Lola', 650, 326), logoScale: 1.35, status: 'approved' },
  { name: 'Bunty', slug: 'bunty', logo: logo('bunty', 'Bunty', 601, 275), status: 'approved' },
  { name: 'Total Pet', slug: 'total-pet', logo: logo('total-pet', 'Total Pet', 599, 121), status: 'approved' },
  { name: 'Puptons', slug: 'puptons', logo: logo('puptons', 'Puptons', 650, 152), status: 'approved' },
];

export const statistics: Statistic[] = [
  // From the creator CRM on 12 November 2026: 1,824 dogs across 1,337 owners.
  { label: 'Dogs in the network', value: '1,800+', context: 'With more than 1,300 owners.', status: 'approved' },
  // TODO(confirm): verified totals. Shown as TBC while the live site is in review mode.
  { label: 'Products gifted', value: 'TBC', status: 'placeholder' },
  { label: 'Pieces of content made', value: 'TBC', status: 'placeholder' },
  { label: 'Brands worked with', value: 'TBC', status: 'placeholder' },
];

export const testimonials: Testimonial[] = [
  {
    quote: 'A real client quote goes here, approved for publication, with name, role and company.',
    person: 'Client name',
    role: 'Role',
    company: 'Company',
    campaign: 'case-study-one',
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

export const campaigns: Campaign[] = [
  {
    title: 'Case study title',
    slug: 'case-study-one',
    brand: 'Brand 01',
    campaignType: 'Mass Gifting',
    summary: 'One or two sentences on what the gifting drop set out to do. Replace with a real case study.',
    objective: 'What the brand needed. Replace with the real brief.',
    solution: 'How the drop was built and run. Replace with the real approach.',
    results: 'What happened, in terms that can be evidenced. Replace with real, verified outcomes.',
    metrics: [
      { label: 'Dogs', value: 'TBC', context: 'Verified figure required' },
      { label: 'Stories and posts', value: 'TBC', context: 'Verified figure required' },
      { label: 'Products gifted', value: 'TBC', context: 'Verified figure required' },
    ],
    featured: true,
    status: 'placeholder',
  },
  {
    title: 'Case study title',
    slug: 'case-study-two',
    brand: 'Brand 02',
    campaignType: 'UGC and Ad Content',
    summary: 'One or two sentences on the brief and the content produced. Replace with a real case study.',
    objective: 'What the brand needed. Replace with the real brief.',
    solution: 'How the content was briefed and filmed. Replace with the real approach.',
    results: 'Assets delivered and how they performed. Replace with real, verified outcomes.',
    metrics: [
      { label: 'Assets delivered', value: 'TBC', context: 'Verified figure required' },
      { label: 'Creators', value: 'TBC', context: 'Verified figure required' },
    ],
    status: 'placeholder',
  },
  {
    title: 'Case study title',
    slug: 'case-study-three',
    brand: 'Brand 03',
    campaignType: 'Creator Campaigns',
    summary: 'One or two sentences on the campaign and the dogs involved. Replace with a real case study.',
    objective: 'What the brand needed. Replace with the real brief.',
    solution: 'How the dogs were selected and briefed. Replace with the real approach.',
    results: 'Campaign delivery and performance. Replace with real, verified outcomes.',
    metrics: [
      { label: 'Creators', value: 'TBC', context: 'Verified figure required' },
      { label: 'Posts published', value: 'TBC', context: 'Verified figure required' },
    ],
    status: 'placeholder',
  },
];

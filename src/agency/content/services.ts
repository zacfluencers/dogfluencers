import type { Service } from '../../system/types/content';
import { clips } from './clips';

/**
 * Service copy describes how the agency works. The operational promises
 * (unlimited edits, content ownership, 12 month quality assurance) are the
 * ones the business already publishes on its WordPress site, so the services
 * are `approved`. Gifting drops of up to 1,000 dogs and 12 day UGC delivery
 * follow the published packages (November 2026). They still want a
 * read-through before launch.
 *
 * The stills are cropped from the April 2026 statics until the business
 * supplies 9:16 clips.
 */
export const services: Service[] = [
  {
    title: 'Influencer Gifting',
    slug: 'influencer-gifting',
    shortDescription:
      'Your product sent to up to 1,000 hand-picked dogs at once, and the stories, unboxings and taste tests that follow.',
    description:
      'Gifting works when the product lands with dogs whose owners would plausibly have bought it anyway. We ' +
      'build the list against your product, breed and size fit, and audience, confirm every owner wants it ' +
      'before anything ships, coordinate dispatch, then track the stories and posts that come back and report ' +
      'on them. One drop can put a launch in front of up to a thousand dog-loving audiences.',
    features: [
      { title: 'Dog matching', description: 'Breed, size, age, diet and lifestyle matched to what you make.' },
      { title: 'Up to 1,000 dogs', description: 'Drops sized to the launch, from 150 dogs to 1,000 in one go.' },
      { title: 'Opt-in first', description: 'Every owner confirms interest and address before product ships.' },
      { title: 'Dispatch coordination', description: 'From your warehouse or ours, batched and tracked.' },
      { title: 'Story tracking', description: 'Tags, links and codes monitored, so nothing gets missed.' },
      { title: 'Reporting', description: 'What shipped, what was posted, and how it performed.' },
    ],
    process: [
      { number: '01', title: 'Define the dog', description: 'Breed, size, age, diet, lifestyle and any exclusions.' },
      { number: '02', title: 'Approve the list', description: 'You see the dogs before we approach a single owner.' },
      { number: '03', title: 'Opt-in', description: 'Owners confirm interest and addresses, so nothing ships blind.' },
      { number: '04', title: 'Product goes out', description: 'Dispatched in batches, tracked against the approved list.' },
      { number: '05', title: 'Content lands', description: 'Unboxings, reviews and taste tests on their own channels.' },
      { number: '06', title: 'Report', description: 'Delivery, posts and performance in one summary.' },
    ],
    packagesHeading: 'Choose your campaign',
    packagesIntro: 'Whether you are testing a new launch or aiming for nationwide visibility, every package is fully managed.',
    packages: [
      {
        name: 'Creator Discovery',
        summary: 'Perfect for testing new products',
        price: '£2,850',
        priceNote: '+ VAT',
        inclusions: ['150 dogs gifted', '100 Story posts', '20 curated UGC videos', '21 day campaign'],
      },
      {
        name: 'Creator Impact',
        summary: 'Ideal for causing serious impact',
        price: '£5,250',
        priceNote: '+ VAT',
        inclusions: ['400 dogs gifted', '250 Story posts', '35 curated UGC videos', '30 day campaign'],
      },
      {
        name: 'Creator Saturation',
        summary: 'Optimised for instant mass scale',
        price: '£6,500',
        priceNote: '+ VAT',
        inclusions: ['500 dogs gifted', '350 Story posts', '50 curated UGC videos', '30 day campaign'],
      },
      {
        name: 'Category Domination',
        summary: 'Our largest campaign for launches, activations and awareness',
        price: '£8,500',
        priceNote: '+ VAT',
        inclusions: ['1,000 dogs gifted', '600 Story posts', '75 curated UGC videos', '45 day campaign'],
      },
    ],
    packagesNote:
      'Every package includes dog matching, campaign management, reporting and a curated UGC library with usage ' +
      'rights for your organic and paid channels. Your team supplies the products; we handle everything else. ' +
      'Prices exclude VAT.',
    video: clips.pomsBowls,
    featured: true,
    status: 'approved',
  },
  {
    title: 'UGC and Ad Content',
    slug: 'ugc',
    shortDescription:
      'Dog-and-owner content made to your brief, for your channels and paid social, delivered in 12 days with unlimited edits.',
    description:
      'UGC is content you own and can spend against. We brief owners who film this kind of work well, get ' +
      'product to them fast, and deliver finished video and stills within 12 days of their dog receiving it. ' +
      'Edits are unlimited until it is right, and lifetime ownership of the content is included, so it can run ' +
      'as ads for as long as it keeps working.',
    features: [
      { title: 'Creative briefing', description: 'Hooks, formats and messaging agreed before anyone films.' },
      { title: 'Creator selection', description: 'Owners chosen for how they film, and dogs for how they fit.' },
      { title: '12 day delivery', description: 'Finished content within 12 days of the product arriving.' },
      { title: 'Unlimited edits', description: 'Revisions until it matches the brief.' },
      { title: 'Lifetime ownership', description: 'The content is yours, for organic and paid, with no renewal.' },
      // TODO(confirm): what the 12 month quality assurance covers.
      { title: '12 months quality assurance', description: 'Delivered content stays covered for a year.' },
    ],
    process: [
      { number: '01', title: 'Brief', description: 'What the content is for, where it runs, and what it needs to say.' },
      { number: '02', title: 'Choose your creators', description: 'Pick from a shortlist of owners and dogs matched to the brief.' },
      { number: '03', title: 'Product ships', description: 'Hooks and scripts agreed while the product is on its way.' },
      { number: '04', title: 'Filming', description: 'Content shot to spec, with the dog doing what dogs do.' },
      { number: '05', title: 'Edits', description: 'Unlimited rounds until it is right.' },
      { number: '06', title: 'Delivery', description: 'Finished files, every ratio you asked for, within 12 days.' },
    ],
    packagesHeading: 'Pricing made simple',
    packagesIntro: 'Every package is built for scale, testing and performance across TikTok and Meta.',
    packages: [
      { name: '10 videos', summary: '£144 per video', price: '£1,440', priceNote: '+ VAT', inclusions: ['10 edited videos', '12 day delivery', 'Full usage rights'] },
      { name: '25 videos', summary: '£108 per video', price: '£2,700', priceNote: '+ VAT', inclusions: ['25 edited videos', '12 day delivery', 'Full usage rights'] },
      { name: '50 videos', summary: '£90 per video', price: '£4,500', priceNote: '+ VAT', inclusions: ['50 edited videos', '12 day delivery', 'Full usage rights'] },
      { name: '100 videos', summary: '£72 per video', price: '£7,200', priceNote: '+ VAT', inclusions: ['100 edited videos', '12 day delivery', 'Full usage rights'] },
    ],
    packagesNote:
      'Every video is fully managed and comes hook-first, edited and platform-ready, with a product demonstration, ' +
      'benefits-led messaging and a call to action. Your team supplies the product; we handle the rest. Prices exclude VAT.',
    video: clips.georgiaKitchen,
    featured: true,
    status: 'approved',
  },
  {
    title: 'Creator Campaigns',
    slug: 'creator-campaigns',
    shortDescription:
      'Paid posts from dog accounts with loyal followings, from selection and briefing to approval and reporting.',
    description:
      'When the goal is reach and trust with an account’s own audience, the work is in choosing the right dogs ' +
      'and briefing them well. We build the line-up, agree terms with each owner, run every post through your ' +
      'approval, and report on what the campaign actually did.',
    features: [
      { title: 'Creator strategy', description: 'Which accounts, which sizes of following, and why.' },
      { title: 'Shortlists you approve', description: 'With audience data where the platform gives it.' },
      { title: 'Clear briefs', description: 'Deliverables, dates and messaging, in writing.' },
      { title: 'Owner management', description: 'Terms, chasing and day-to-day contact, handled.' },
      { title: 'Approval before posting', description: 'Nothing goes live without your sign-off.' },
      { title: 'Reporting', description: 'Delivery against brief and performance on agreed measures.' },
    ],
    process: [
      { number: '01', title: 'Objective', description: 'Launch, awareness, conversion or content.' },
      { number: '02', title: 'Line-up', description: 'Accounts and numbers built around the objective.' },
      { number: '03', title: 'Terms', description: 'You approve the dogs; we agree the deals.' },
      { number: '04', title: 'Brief and film', description: 'Owners create against an agreed brief.' },
      { number: '05', title: 'Approve and post', description: 'Reviewed, then published to schedule.' },
      { number: '06', title: 'Report', description: 'What ran, and how it performed.' },
    ],
    video: clips.evieTreat,
    status: 'approved',
  },
  {
    title: 'Product Launches',
    slug: 'product-launches',
    shortDescription:
      'Gifting, UGC and paid creator posts running together around a launch date, so a new product feels everywhere at once.',
    description:
      'A launch needs volume and certainty in the same week. We combine a gifting drop that makes the product ' +
      'feel discovered, UGC you can put behind paid social on day one, and contracted posts that land on the ' +
      'date. If the shape of your campaign does not fit one service, this is the conversation.',
    features: [
      { title: 'One programme', description: 'Gifting, UGC and creator posts planned as one campaign.' },
      { title: 'Built around the date', description: 'Activity timed to the on-sale, retail or stock date.' },
      { title: 'Always-on options', description: 'Continuous creator activity after launch, not a one-off burst.' },
      { title: 'Custom reporting', description: 'Measures built around how your team already reports.' },
    ],
    video: clips.omniRange,
    status: 'approved',
  },
];

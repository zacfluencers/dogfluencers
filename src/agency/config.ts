/**
 * Dogfluencers: agency configuration.
 *
 * This file, `theme.css`, `crm.ts` and `content/` are the whole agency layer.
 * Built November 2026.
 *
 * Values marked TODO(confirm) are working assumptions awaiting sign-off from
 * the business. Service claims (12 day delivery, gifting drops of up to 1,000 dogs,
 * unlimited edits, content ownership) are carried over from the WordPress
 * site the business already publishes.
 */
import { assertAgencyConfig, type AgencyConfig } from '../system/types/agency';

const config: AgencyConfig = {
  name: 'Dogfluencers',
  slug: 'dogfluencers',
  shortName: 'Dogfluencers',
  niche: 'pet',

  // Supplied artwork (FG Brand Pack, DOGFLUENCERS-LOGO), recoloured to night
  // and cream. TODO(asset): request an SVG.
  logo: {
    src: '/logo.png',
    srcDark: '/logo-white.png',
    alt: 'Dogfluencers',
    width: 1200,
    height: 188,
    wordmark: { primary: 'Dogfluencers' },
  },

  site: {
    url: 'https://dogfluencers.agency',
    excludeFromSitemap: ['/404/', '/contact/thanks/'],
    locale: 'en-GB',
    country: 'GB',
  },

  contact: {
    // The address the current site publishes.
    email: 'support@dogfluencers.agency',
    enquiries: {
      // TODO(confirm): the inbox enquiries should go to.
      to: 'jonathan@fluencersgroup.com',
      // TODO(setup): verify send.dogfluencers.agency in Resend before launch.
      from: 'Dogfluencers <enquiries@send.dogfluencers.agency>',
    },
  },

  terminology: {
    creatorNoun: 'dog creators',
    creatorNounSingular: 'dog creator',
    brandNoun: 'pet brands',
    contentNoun: 'content',
  },

  positioning: {
    oneLine: 'A specialist creator marketing agency for pet brands.',
    long:
      'Dogfluencers connects pet brands with the dogs, and the owners behind them, who shape what ' +
      'other owners buy. We run mass gifting, UGC and ad content, and creator campaigns, across food, ' +
      'treats, health, accessories and everything else that ends up in a dog’s life.',
    heroHeadline: 'The fastest way to get your pet product *seen.*',
    heroDescription:
      'We get your product to real dogs with engaged followings, up to a thousand at a time if you want, and ' +
      'turn what their owners make into content you own. Briefed, filmed and delivered in 12 days.',
  },

  ctas: {
    primary: { label: 'Start a campaign', href: '/contact/', event: 'campaign_cta_click' },
    secondary: {
      label: 'Join as a creator',
      href: '/for-creators/',
      event: 'creator_network_cta_click',
    },
  },

  enabledServices: ['mass-gifting', 'ugc', 'creator-campaigns', 'product-launches'],

  navigation: [
    {
      label: 'Services',
      href: '/services/',
      children: [
        { label: 'Mass Gifting', href: '/services/mass-gifting/' },
        { label: 'UGC and Ad Content', href: '/services/ugc/' },
        { label: 'Creator Campaigns', href: '/services/creator-campaigns/' },
        { label: 'Product Launches', href: '/services/product-launches/' },
      ],
    },
    { label: 'For Brands', href: '/for-brands/' },
    { label: 'For Creators', href: '/for-creators/' },
    { label: 'Campaigns', href: '/campaigns/' },
    { label: 'Insights', href: '/insights/' },
    { label: 'About', href: '/about/' },
  ],

  footerNavigation: [
    {
      heading: 'Services',
      links: [
        { label: 'Mass Gifting', href: '/services/mass-gifting/' },
        { label: 'UGC and Ad Content', href: '/services/ugc/' },
        { label: 'Creator Campaigns', href: '/services/creator-campaigns/' },
        { label: 'Product Launches', href: '/services/product-launches/' },
      ],
    },
    {
      heading: 'Agency',
      links: [
        { label: 'About', href: '/about/' },
        { label: 'Campaigns', href: '/campaigns/' },
        { label: 'Insights', href: '/insights/' },
        { label: 'Contact', href: '/contact/' },
      ],
    },
    {
      heading: 'Work with us',
      links: [
        { label: 'For Brands', href: '/for-brands/' },
        { label: 'For Creators', href: '/for-creators/' },
        { label: 'Creator categories', href: '/creators/' },
        { label: 'Gifting guidelines', href: '/for-creators/gifting-guidelines/' },
        { label: 'Join the network', href: '/join/' },
      ],
    },
    {
      heading: 'Log in',
      links: [
        { label: 'Creator login', href: '/creator/login/' },
        { label: 'Team login', href: '/admin/login/' },
      ],
    },
  ],

  sisterAgencies: [
    { name: 'Beautyfluencers', logo: { src: '/agency/group/beautyfluencers.png', alt: 'Beautyfluencers', width: 403, height: 69 }, href: 'https://beautyfluencers.agency' },
    { name: 'Gymfluencers', logo: { src: '/agency/group/gymfluencers.png', alt: 'Gymfluencers', width: 1100, height: 130 } },
    { name: 'ParentPR', logo: { src: '/agency/group/parentpr.png', alt: 'ParentPR', width: 443, height: 85 } },
    { name: 'Travelfluencers', logo: { src: '/agency/group/travelfluencers.png', alt: 'Travelfluencers', width: 499, height: 73 } },
    { name: 'Meowfluencers', logo: { src: '/agency/group/meowfluencers.png', alt: 'Meowfluencers', width: 770, height: 185 }, logoScale: 1.2 },
    { name: 'Foodiefluencers', logo: { src: '/agency/group/foodiefluencers.png', alt: 'Foodiefluencers', width: 252, height: 103 } },
  ],

  accountLinks: [{ label: 'Creator login', shortLabel: 'Log in', href: '/creator/login/' }],

  legalLinks: [
    { label: 'Privacy', href: '/privacy/' },
    { label: 'Cookies', href: '/cookies/' },
    { label: 'Terms', href: '/terms/' },
  ],

  socialLinks: [
    { label: 'Instagram', href: 'https://www.instagram.com/dogfluencers.agency/', external: true },
  ],

  homepageSections: ['hero', 'brands', 'services', 'process', 'work', 'campaigns', 'cta'],

  seo: {
    title: 'Dogfluencers | Dog influencer marketing agency',
    socialImage: {
      src: '/og.jpg',
      alt: 'Connecting brands with top dogs. Dogfluencers.',
      width: 1200,
      height: 630,
    },
    description:
      'Dog influencer marketing for pet brands: mass gifting to up to 1,000 dogs at a time, UGC and ad ' +
      'content delivered in 12 days, and creator campaigns with real dog owners.',
    primaryKeywords: [
      'dog influencer agency',
      'pet influencer marketing',
      'dog influencer marketing',
    ],
    secondaryKeywords: [
      'pet UGC agency',
      'dog product seeding',
      'pet brand creator campaigns',
    ],
  },

  creatorNetwork: {
    description:
      'A network of dog owners and their dogs, from UGC makers who film for brand channels to ' +
      'accounts with loyal followings of their own, across every breed, size and age.',
    joinUrl: '/join/',
    // Gifted-only drops exist alongside paid work. Copy must not promise
    // payment for every opportunity.
    allOpportunitiesPaid: false,
  },

  brandAudience: {
    description:
      'We work with pet brands at every stage, from a first product launch to established ranges ' +
      'running always-on creator activity.',
    categories: ['Food and treats', 'Health and supplements', 'Accessories', 'Grooming', 'Toys and enrichment'],
  },

  // No Sanity project yet: content builds from the fixtures in content/.
  // TODO(setup): create a Dogfluencers Sanity project, then add
  // cms: { sanity: { projectId: '…', dataset: 'production' } }.
};

export const agency = assertAgencyConfig(config);
export default agency;

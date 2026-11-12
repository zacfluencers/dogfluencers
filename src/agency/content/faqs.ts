import type { Faq } from '../../system/types/content';

/**
 * Brand answers describe how the service works. Creator answers come from the
 * current site's FAQ page, tidied. Neither quotes prices or network figures
 * that have not been confirmed.
 *
 * The creator answers do not promise payment on every opportunity:
 * `agency.creatorNetwork.allOpportunitiesPaid` is false.
 */
export const faqs: Faq[] = [
  {
    question: 'What is the difference between gifting and a creator campaign?',
    answer:
      'Gifting sends product to dogs without a contracted post: owners share it because their dog loves it, usually as a story. A creator campaign is paid: agreed deliverables, dates and messaging. Gifting is volume and authenticity, campaigns are certainty and control, and most launches use both.',
    category: 'Services',
    order: 1,
    status: 'approved',
  },
  {
    question: 'How quickly do we get content?',
    answer:
      'Within 12 days of the product reaching the dogs. Edits are unlimited, so the clock is on the first delivery, not on getting it right.',
    category: 'Content',
    order: 2,
    status: 'approved',
  },
  {
    question: 'Do we own the content?',
    answer:
      'On UGC and ad content, yes: lifetime ownership is included, for organic and paid use. On gifting and creator campaigns the owner keeps their post; if you want to run it as an ad, that is agreed in the brief rather than assumed afterwards.',
    category: 'Content',
    order: 3,
    status: 'approved',
  },
  {
    question: 'How do you choose which dogs to approach?',
    answer:
      'We build the list against your product: breed, size and age fit, diet, lifestyle, audience and any brands you do not want to sit beside. You see and approve every dog before we contact the owner.',
    category: 'Services',
    order: 4,
    status: 'approved',
  },
  {
    question: 'Who handles shipping?',
    answer:
      'Either side can. Some brands dispatch from their own warehouse against a list we supply; others send us stock and we batch and post it. We collect addresses and track delivery either way.',
    category: 'Logistics',
    order: 5,
    status: 'approved',
  },
  {
    question: 'What do you report on?',
    answer:
      'What shipped, what was posted, and performance on the measures agreed at the brief. We report what can be evidenced, such as platform figures and delivery against brief, rather than modelled estimates.',
    category: 'Reporting',
    order: 6,
    status: 'approved',
  },
  {
    question: 'How much does it cost to join?',
    answer: 'Nothing. Joining Dogfluencers is free, and so is the gifting network: just tick the box when you sign up.',
    category: 'Creators',
    order: 7,
    status: 'approved',
  },
  {
    question: 'What do I need to join?',
    answer:
      'An Instagram account for your dog with 1,000 or more followers, an engagement rate of 2.5% or higher, and a passion for working with brands you and your dog love.',
    category: 'Creators',
    order: 8,
    status: 'approved',
  },
  {
    question: 'Can I decline offers?',
    answer: 'Yes. Every offer is sent to you on Instagram to accept or decline, and we never send products that are not right for your dog.',
    category: 'Creators',
    order: 9,
    status: 'approved',
  },
  {
    question: 'Are all opportunities paid?',
    answer:
      'No. Gifted drops send you products to keep in return for a story. Paid collaborations come with a fee and a brief. Every offer says which it is before you accept.',
    category: 'Creators',
    order: 10,
    status: 'approved',
  },
  {
    question: 'How do I get paid?',
    answer:
      'By PayPal, once the collab is complete. We confirm your PayPal details each time, and payment usually arrives within 48 hours. We never take commission from your fee.',
    category: 'Creators',
    order: 11,
    status: 'approved',
  },
  {
    question: 'Am I guaranteed a collab?',
    answer:
      'No. We put your dog forward for as many campaigns as fit, but brands always make the final choice.',
    category: 'Creators',
    order: 12,
    status: 'approved',
  },
  {
    question: 'How do I update my details, or leave?',
    answer:
      'Log in to update your profile at any time. To leave, email support@dogfluencers.agency and we will remove you.',
    category: 'Creators',
    order: 13,
    status: 'approved',
  },
];

/** Service-page FAQs, keyed by service slug. */
export const serviceFaqs: Record<string, Faq[]> = {
  'mass-gifting': faqs.filter((faq) => ['Services', 'Logistics', 'Reporting'].includes(faq.category ?? '')),
  ugc: faqs.filter((faq) => ['Content', 'Services'].includes(faq.category ?? '')),
  'creator-campaigns': faqs.filter((faq) => ['Services', 'Content', 'Reporting'].includes(faq.category ?? '')),
  'product-launches': faqs.filter((faq) => ['Services', 'Content', 'Reporting'].includes(faq.category ?? '')),
};

export const creatorFaqs = faqs.filter((faq) => faq.category === 'Creators');
export const brandFaqs = faqs.filter((faq) => faq.category !== 'Creators');

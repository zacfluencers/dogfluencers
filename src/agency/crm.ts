/**
 * Dogfluencers creator questions and CRM settings.
 *
 * The join form, the creator's profile page, the CRM filters, the detail page
 * and the CSV export are all generated from this file. To ask a new question,
 * add a field here. Answers are stored by `key`, so never rename a key that
 * already holds answers: add a new one instead.
 *
 * The creator is the owner; most questions are about their dogs, so brands
 * can be matched on breed, size, age, diet and lifestyle. Dogs are a repeated
 * step: each dog has its own answers, and the CRM filters match any of them.
 * Ages come from each dog's date of birth, so they never go stale.
 */
import type { CrmConfig } from '../system/crm/types';
import { agency } from './config';

export const crm: CrmConfig = {
  steps: [
    {
      id: 'dogs',
      title: 'Your dogs',
      teamTitle: 'Their dogs',
      blurb: 'So brands can send things that suit each dog. Add every dog you post with.',
      repeat: { key: 'dogs', item: 'Dog', max: 6, add: 'Add another dog', summary: ['name', 'breed', 'birth_date'], tableLabel: 'Dogs' },
      fields: [
        { key: 'name', label: 'Name', teamLabel: 'Name', type: 'text', required: true, max: 80 },
        {
          key: 'breed',
          label: 'Breed',
          hint: 'Or the best guess, for a cross or a rescue.',
          type: 'text',
          required: true,
          max: 120,
          placeholder: 'Cockapoo',
        },
        {
          key: 'size',
          label: 'Size',
          filterLabel: 'Dog size',
          type: 'select',
          required: true,
          filter: true,
          options: [
            { value: 'toy', label: 'Toy (under 5kg)' },
            { value: 'small', label: 'Small (5 to 10kg)' },
            { value: 'medium', label: 'Medium (10 to 25kg)' },
            { value: 'large', label: 'Large (25 to 40kg)' },
            { value: 'giant', label: 'Giant (over 40kg)' },
          ],
        },
        {
          key: 'birth_date',
          label: 'Date of birth',
          hint: 'Your best guess is fine, for a rescue.',
          filterLabel: 'Dog age',
          type: 'date',
          required: true,
          filter: true,
          maxYears: 30,
          bands: [
            { value: 'puppy', label: 'Puppy (under 1)', min: 0, max: 0 },
            { value: 'young', label: 'Young (1 to 2)', min: 1, max: 2 },
            { value: 'adult', label: 'Adult (3 to 6)', min: 3, max: 6 },
            { value: 'senior', label: 'Senior (7 and over)', min: 7, max: 99 },
          ],
        },
        {
          key: 'diet',
          label: 'What do they eat?',
          teamLabel: 'Diet',
          filterLabel: 'Dog diet',
          hint: 'Tick any that apply.',
          type: 'multi',
          filter: true,
          options: [
            { value: 'dry', label: 'Dry food' },
            { value: 'wet', label: 'Wet food' },
            { value: 'raw', label: 'Raw' },
            { value: 'fresh', label: 'Fresh or cooked' },
            { value: 'grain_free', label: 'Grain free' },
            { value: 'vet_diet', label: 'Prescription or vet diet' },
          ],
        },
        {
          key: 'food_notes',
          label: 'Favourite flavours, or anything they can’t have',
          teamLabel: 'Food notes',
          hint: 'Optional. “Loves salmon, no chicken.”',
          type: 'text',
          max: 500,
        },
        {
          key: 'allergies',
          label: 'Allergies or sensitivities',
          teamLabel: 'Allergies',
          hint: 'Food, materials, anything. Leave blank if none.',
          type: 'textarea',
          max: 1000,
        },
      ],
    },
    {
      id: 'content',
      title: 'You and your content',
      teamTitle: 'Their content',
      blurb: 'Helps us match you to the right briefs.',
      fields: [
        {
          key: 'creator_type',
          label: 'Which best describes your account?',
          filterLabel: 'Account type',
          teamLabel: 'Account type',
          type: 'select',
          required: true,
          filter: true,
          options: [
            { value: 'dog_account', label: 'An account just for my dog' },
            { value: 'owner_lifestyle', label: 'My own account, my dog features a lot' },
            { value: 'ugc', label: 'I make UGC for brands' },
            { value: 'professional', label: 'Dog professional (trainer, groomer, walker)' },
          ],
        },
        {
          key: 'content_categories',
          label: 'What does your content cover?',
          filterLabel: 'Content',
          teamLabel: 'Content they make',
          hint: 'Tick any that apply.',
          type: 'multi',
          filter: true,
          options: [
            { value: 'food', label: 'Food and treats' },
            { value: 'health', label: 'Health and supplements' },
            { value: 'accessories', label: 'Collars, leads and harnesses' },
            { value: 'fashion', label: 'Coats and dog fashion' },
            { value: 'grooming', label: 'Grooming' },
            { value: 'toys', label: 'Toys and enrichment' },
            { value: 'training', label: 'Training' },
            { value: 'outdoor', label: 'Walks and outdoors' },
            { value: 'travel', label: 'Dog-friendly travel' },
            { value: 'home', label: 'Beds and home' },
          ],
        },
        {
          key: 'expertise',
          label: 'Do you work with dogs professionally?',
          teamLabel: 'Professional background',
          filterLabel: 'Professional',
          hint: 'Optional. Tick any that apply.',
          type: 'multi',
          filter: true,
          options: [
            { value: 'vet', label: 'Vet or vet nurse' },
            { value: 'behaviourist', label: 'Behaviourist' },
            { value: 'nutritionist', label: 'Nutritionist' },
            { value: 'trainer', label: 'Trainer' },
            { value: 'groomer', label: 'Groomer' },
            { value: 'walker', label: 'Walker or sitter' },
          ],
        },
        {
          key: 'dog_skills',
          label: 'Can your dog do anything on cue?',
          teamLabel: 'Tricks and skills',
          hint: 'Optional. Sit and stay for the camera counts.',
          type: 'text',
          max: 300,
        },
        { key: 'favourite_brands', label: 'Favourite pet brands', type: 'text', max: 300 },
        {
          key: 'brands_avoid',
          label: 'Brands you would not work with',
          teamLabel: 'Brands they won\'t work with',
          hint: 'Optional. A brand, or a kind of brand.',
          type: 'textarea',
          max: 1000,
        },
      ],
    },
  ],

  // Your own sizes, for the rare drop that includes something for the owner.
  clothingSizes: [
    { value: 'XS', label: 'XS (UK 4 to 6)' },
    { value: 'S', label: 'S (UK 8)' },
    { value: 'M', label: 'M (UK 10 to 12)' },
    { value: 'L', label: 'L (UK 14)' },
    { value: 'XL', label: 'XL (UK 16)' },
    { value: '2XL', label: '2XL (UK 18)' },
    { value: '3XL', label: '3XL (UK 20)' },
    { value: '4XL+', label: '4XL+ (UK 22 and up)' },
  ],

  countries: [
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'Ireland', label: 'Ireland' },
    { value: 'Other', label: 'Somewhere else' },
  ],

  currency: '£',
  minAge: 18,

  consent: {
    text: `I agree to ${agency.name} storing and using my details to review my application and contact me about campaigns, as set out in the`,
    privacyHref: '/privacy/',
    termsHref: '/terms/',
  },

  digest: {
    to: [agency.contact.enquiries?.to ?? agency.contact.email],
    from: agency.contact.enquiries?.from ?? `${agency.name} <onboarding@resend.dev>`,
  },

  emailTheme: {
    ground: '#fffaf3',
    card: '#ffffff',
    ink: '#1a1412',
    muted: '#6b5d55',
    accent: '#c4300a',
    button: '#1a1412',
    buttonInk: '#f9ead0',
    font: "'Open Sans', Arial, Helvetica, sans-serif",
    headingFont: "'Open Sans Condensed', 'Arial Narrow', Arial, sans-serif",
  },

  // TODO(confirm): wording to be agreed with the client before it's switched on.
  // Facts match the For Creators page: offers by Instagram, paid within 20% of
  // the creator's rate, PayPal within about 48 hours, no commission.
  welcome: {
    subject: `Welcome to ${agency.name}`,
    intro: `Welcome to ${agency.name}! You and your dog are now part of the creator network, and we can't wait to match you with brands you'll love.`,
    steps: [
      {
        title: 'Gifted drops',
        body: 'If you ticked gifting, products could start arriving soon. Before anything ships, we\'ll let you know what\'s coming and what we\'d love you to post, usually one Instagram story. If your dog loves it, a post goes the extra mile: brands notice standout content, and it\'s the best way to get picked for paid work.',
      },
      {
        title: 'Paid collaborations',
        body: 'When a brand picks your dog for a paid brief, we\'ll send you the offer on Instagram or by email to accept or decline. Offers are within 20% of the rate you set, and we never take a cut of your fee. Reply as soon as you can: paid spots fill quickly.',
      },
      {
        title: 'Keep your profile up to date',
        body: 'Log in now and then to check your address, follower numbers and each dog\'s details. If a new dog joins the family, add them: more dogs, more briefs that fit.',
      },
    ],
    tips: [
      'Add our email to your contacts and check your spam folder, so campaign emails don\'t go missing.',
      'Label your posts: #gifted for gifted products and #ad for paid work, with Instagram\'s paid partnership label where it applies, as UK advertising rules expect.',
      'Tag the brand and @dogfluencers.agency, so we can see your content and recommend you for more.',
      'Watch out for scams. We only contact you from our own email and Instagram account. If something looks off, message us to check.',
    ],
    help: 'Any questions? Just reply to this email.',
    close: 'Welcome to the pack. We can\'t wait to see what you and your dog create!',
    signoff: `The ${agency.name} team`,
    replyTo: [agency.contact.enquiries?.to ?? agency.contact.email],
  },
};

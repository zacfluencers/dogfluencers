/**
 * Legal copy, as supplied by the business (privacy policy and terms, 15 October
 * 2026) and written for the site (cookie policy, 16 October 2026). Change the
 * wording only with the business's sign-off, and update `updated` with it.
 */
import type { InlineSpan, RichTextBlock } from '../../system/types/content';

const EMAIL = 'jonathan@fluencersgroup.com';
const email: InlineSpan = { text: EMAIL, href: `mailto:${EMAIL}`, bold: true };

const h = (text: string, level: 2 | 3 = 3): RichTextBlock => ({ type: 'heading', level, text });
const p = (text: string): RichTextBlock => ({ type: 'paragraph', text });
const bold = (text: string): RichTextBlock => ({ type: 'paragraph', text, spans: [{ text, bold: true }] });
const rich = (...spans: InlineSpan[]): RichTextBlock => ({ type: 'paragraph', text: spans.map((s) => s.text).join(''), spans });
const ul = (...items: string[]): RichTextBlock => ({ type: 'list', items });
const ol = (...items: string[]): RichTextBlock => ({ type: 'list', ordered: true, items });
/** A bulleted item that opens with a bold term, as in the lawful bases. */
const termList = (...items: [string, string][]): RichTextBlock => ({
  type: 'list',
  items: items.map(([term, rest]) => term + rest),
  spans: items.map(([term, rest]) => [{ text: term, bold: true }, { text: rest }]),
});

export interface LegalDocument {
  updated: string;
  body: RichTextBlock[];
}

export const privacyPolicy: LegalDocument = {
  updated: '15 October 2026',
  body: [
    h('1. Who we are'),
    rich({ text: 'Dogfluencers is owned and operated by ' }, { text: 'Fluencers Group LTD', bold: true }, { text: ' (“we”, “us” or “our”).' }),
    p('Fluencers Group LTD is the controller of personal information collected through Dogfluencers, including our website, influencer registration forms and campaign services.'),
    rich({ text: 'For privacy enquiries or to exercise your rights, contact ' }, email, { text: '.' }),

    h('2. Information we collect'),
    p('Depending on how you interact with us, we may collect:'),
    ul(
      'Your name, email address, telephone number and delivery address.',
      'Your social media handles, profile links, content and publicly available engagement information.',
      'Audience statistics, interests, content categories and product preferences you provide.',
      'Information submitted through registration forms, campaign applications and correspondence.',
      'Gifting preferences, campaign participation, delivery records and agreed deliverables.',
      'Campaign content, links, performance information and feedback.',
      'Records of your permissions, consent choices and withdrawals.',
      'Technical information, including IP address, browser information and website activity, where collected through our website.',
    ),
    p('Please do not submit sensitive personal information, such as medical information, unless we specifically request it and explain how it will be used and protected.'),

    h('3. How we use your information'),
    p('We use personal information to:'),
    ul(
      'Register and manage influencers within the Dogfluencers network.',
      'Assess suitability for brands, gifting opportunities and campaigns.',
      'Match influencers with relevant products and participating brands.',
      'Arrange product dispatch, delivery and campaign communications.',
      'Manage agreed content, track campaign output and prepare reports.',
      'Respond to enquiries and provide support.',
      'Maintain security, prevent misuse and resolve disputes.',
      'Meet legal, accounting and regulatory obligations.',
      'Send marketing communications where permitted by law.',
    ),

    h('4. Gifting opt-in, automatic matching and data sharing'),
    bold('When you actively opt into our gifting service, you ask Dogfluencers to consider and automatically match you with suitable gifting opportunities within the scope explained at registration.'),
    bold('Where your opt-in and the applicable lawful basis cover a match, we may share the information needed to arrange and manage that gifting opportunity without asking you to approve each individual match, disclosure or product dispatch.'),
    p('Depending on the campaign, this may include:'),
    ul(
      'Your name and relevant social media handles.',
      'Your profile links, content category and relevant audience information.',
      'Your delivery address.',
      'Your email address and telephone number where needed for campaign administration or delivery.',
      'Relevant product preferences, participation records and campaign deliverables.',
    ),
    p('We share only information reasonably needed for the relevant purpose. We do not give brands unrestricted access to all information we hold about you.'),
    p('Recipients may include the participating brand, its authorised campaign team, fulfilment providers and delivery companies.'),
    p('Where we or a participating brand rely on your consent, the consent request will identify the organisations relying on it and explain the information, purposes and activities covered. We will obtain a further opt-in where a new recipient or purpose falls outside the existing consent and fresh consent is required.'),
    bold('Opting into gifting does not automatically subscribe you to participating brands’ newsletters or unrelated marketing.'),
    p('Gifting participation, content requirements and usage rights are governed by the applicable campaign or network terms. This privacy policy does not itself grant rights to use your content.'),

    h('5. Our lawful bases'),
    p('We identify an appropriate lawful basis before using or sharing personal information:'),
    termList(
      ['Consent:', ' for optional gifting matching and sharing where consent is the appropriate basis, and marketing or cookies where consent is required.'],
      ['Contract:', ' where processing is objectively necessary to provide a service you have agreed to receive or take steps you have requested before entering a contract.'],
      ['Legitimate interests:', ' for proportionate administration, security, fraud prevention, business enquiries and campaign reporting, after considering your rights and expectations.'],
      ['Legal obligation:', ' where we must retain or disclose information to comply with the law.'],
    ),
    p('We do not treat acceptance of this policy as blanket consent to every use of your information.'),

    h('6. Other organisations receiving information'),
    p('We may use service providers for hosting, registration forms, secure storage, communications, campaign management, analytics and professional advice.'),
    p('Providers acting on our behalf must process information under appropriate contractual instructions and security requirements.'),
    p('Participating brands may act as independent controllers when deciding how to process information for their own campaign and fulfilment activities. They are responsible for their own lawful basis, privacy information, security and retention arrangements.'),
    p('Brands may create a fulfilment or order record to dispatch a gift. This does not, by itself, give them permission to use your information for unrelated marketing.'),
    p('We may also disclose information where required by law or reasonably necessary to establish, exercise or defend legal claims.'),

    h('7. Withdrawing from gifting'),
    rich({ text: 'You can withdraw your gifting consent or ask to leave the gifting network at any time by emailing ' }, email, { text: '.' }),
    p('We will stop future matching and sharing that depend on your withdrawn consent. Withdrawal does not affect processing that was lawful before withdrawal.'),
    p('If a gift has already been dispatched or a campaign is underway, we will explain any information still needed to complete delivery, manage existing commitments or meet legal obligations, and the lawful basis for retaining it.'),
    p('Where appropriate, we will notify relevant recipients of withdrawal or valid deletion requests. A brand may retain limited records where it has a separate lawful reason, but cannot continue relying on withdrawn consent.'),

    h('8. Matching and profiling'),
    p('We may use profile information, interests, audience statistics and campaign history to assess suitability and recommend gifting opportunities.'),
    p('Matching may involve automated tools, human review or both. You can contact us to correct information, change your preferences or raise a concern about a match.'),
    p('If we introduce solely automated decisions producing legal or similarly significant effects, we will provide the required information and safeguards before doing so.'),

    h('9. How long we keep information'),
    p('We retain information only for as long as reasonably necessary for its purpose.'),
    p('Retention depends on whether your profile remains active, campaign commitments are outstanding, records are needed for legal or accounting purposes, or information is required to resolve a dispute.'),
    p('We periodically review records and delete or anonymise information no longer needed. We may retain a minimal suppression record to ensure we respect an opt-out.'),
    p('You can request further information about the retention period applicable to your records.'),

    h('10. International transfers and security'),
    p('If personal information is transferred outside the UK, we will use the safeguards required by UK data protection law, such as applicable adequacy regulations or approved contractual safeguards.'),
    p('We use appropriate technical and organisational measures to protect personal information and restrict access to those who need it. No online service can guarantee absolute security.'),

    h('11. Cookies and marketing'),
    rich(
      { text: 'Where our website uses cookies or similar technologies, we explain their purposes through the relevant cookie information and controls: see our ' },
      { text: 'cookie policy', href: '/cookies/' },
      { text: '.' },
    ),
    p('We obtain consent where required before using non-essential technologies. You can change your choices through the available cookie controls.'),
    p('You can unsubscribe from our marketing using the unsubscribe option or by contacting us. Essential service and active campaign communications may continue where appropriate.'),

    h('12. Your rights'),
    p('Depending on the circumstances, you may have the right to:'),
    ul(
      'Access your personal information.',
      'Correct inaccurate or incomplete information.',
      'Request deletion.',
      'Restrict processing.',
      'Object to processing, including direct marketing.',
      'Receive or transfer certain information in a portable format.',
      'Withdraw consent.',
      'Request safeguards concerning qualifying automated decisions.',
    ),
    rich({ text: 'Contact ' }, email, { text: ' to make a request. We normally respond within one month, subject to lawful extensions and any necessary identity checks.' }),
    rich(
      { text: 'You can also complain to the UK Information Commissioner’s Office at ' },
      { text: 'ico.org.uk/make-a-complaint', href: 'https://ico.org.uk/make-a-complaint/' },
      { text: '.' },
    ),

    h('13. Changes to this policy'),
    p('We may update this policy to reflect changes to our services or legal requirements. We will update the date above and provide further notice where appropriate.'),
    p('Where a change requires fresh consent, publishing an updated policy will not replace obtaining that consent.'),
  ],
};

export const terms: LegalDocument = {
  updated: '15 October 2026',
  body: [
    h('1. About us and these terms'),
    rich({ text: 'Dogfluencers is owned and operated by ' }, { text: 'Fluencers Group LTD', bold: true }, { text: ' (“Dogfluencers”, “we”, “us” or “our”).' }),
    rich({ text: 'Contact: ' }, email),
    p('These terms govern our website, influencer network, gifting campaigns, content creation and related marketing services.'),
    p('“Brand” means a business purchasing or participating in our services. “Influencer” means a creator or profile participating in our network or campaigns. “Campaign Order” means an accepted proposal, booking form, statement of work or written agreement setting out a campaign’s scope and commercial terms.'),
    p('Provisions applying specifically to Brands or Influencers are identified below. General provisions apply to both.'),

    h('2. Acceptance and contract formation'),
    p('Browsing our website does not, by itself, create a contract to purchase services or participate in campaigns.'),
    p('A Brand contract begins when a Campaign Order is accepted in writing or through an electronic acceptance process incorporating these terms.'),
    p('Influencers accept these terms through our registration or campaign acceptance process. Gifting permissions and data protection consent are collected separately where required.'),
    p('Anyone accepting on behalf of a business confirms they have authority to bind it.'),
    p('If documents conflict, the following order applies:'),
    ol('A separately signed agreement expressly varying these terms.', 'The accepted Campaign Order.', 'These terms.'),
    rich(
      { text: 'Our ' },
      { text: 'Privacy Policy', href: '/privacy/' },
      { text: ' explains personal information processing. These terms do not override privacy rights or replace valid consent.' },
    ),

    h('3. Eligibility'),
    p('Influencers must be at least 18 and able to enter a binding agreement unless we expressly agree an appropriate alternative arrangement.'),
    p('Brands engage us for business purposes. If an individual has mandatory consumer rights, nothing in these terms removes those rights.'),
    p('All users must provide accurate information and promptly notify us of relevant changes.'),

    h('Terms for Brands', 2),
    h('4. Scope of services'),
    p('We provide only the services and deliverables expressly included in the Campaign Order.'),
    p('Unless expressly included, fees do not cover:'),
    ul(
      'Products, packaging, postage, customs or fulfilment.',
      'Advertising spend or third-party platform charges.',
      'Paid influencer fees.',
      'Travel, locations, specialist production or reshoots.',
      'Raw footage, project files or additional edits.',
      'Paid advertising rights, creator account permissions or exclusivity.',
    ),
    p('Additional work requires written agreement and may incur additional charges.'),
    p('We may use suitable employees, contractors and creators to perform services. We remain responsible for our own contractual obligations.'),

    h('5. Output-based services and performance'),
    bold('Our services are output-based, unless the Campaign Order expressly states otherwise.'),
    p('We will perform services with reasonable care and skill. We do not guarantee:'),
    ul(
      'Sales, revenue, profit or return on investment.',
      'Reach, impressions, views, engagement or follower growth.',
      'Particular audience reactions or positive reviews.',
      'Acceptance by platforms, retailers or advertising systems.',
      'Continued availability of a creator, account or platform feature.',
    ),
    p('Projections, examples, case studies and previous results are illustrative and do not promise equivalent results.'),
    p('Follower totals describe potential audience size, not guaranteed reach or unique viewers. Audiences may overlap.'),

    h('6. Gifting campaigns and creator selection'),
    p('Unless the Campaign Order states otherwise:'),
    ul(
      'A gifting profile allocation means a profile selected and made available for the agreed campaign.',
      'Estimated stories, posts, reach and response rates are targets rather than guarantees.',
      'Sending a gift does not guarantee publication, a favourable review or any specific performance.',
      'Particular Influencers are not guaranteed.',
      'We may substitute a reasonably comparable eligible profile where necessary.',
    ),
    p('The Campaign Order must identify whether profile selection, recruitment, dispatch, posting or another milestone counts towards any numerical commitment.'),
    rich(
      { text: 'Any guaranteed UGC or other guaranteed deliverable must be expressly identified in the Campaign Order.', bold: true },
      { text: ' General statements that gifting output is not guaranteed do not remove an express deliverable commitment.' },
    ),
    p('If an agreed guaranteed deliverable is missing or materially fails the brief for reasons within our responsibility, we will first have a reasonable opportunity to correct, replace or complete it. If we cannot do so within a reasonable period, an appropriate fee reduction or refund for the affected element will be available.'),

    h('7. Brand responsibilities'),
    p('Brands must provide, in good time:'),
    ul(
      'Accurate briefs, product information and substantiated claims.',
      'Products in the agreed quantities and suitable condition.',
      'Required access, permissions, assets and approvals.',
      'Clear delivery, safety, ingredient and usage information.',
      'A contact authorised to make campaign decisions.',
    ),
    p('Brands are responsible for product legality, safety, labelling, regulatory compliance, recalls and fulfilment, including applicable cosmetics and advertising requirements.'),
    p('Brands must not ask us or Influencers to make misleading claims, conceal commercial relationships or provide dishonest testimonials.'),
    p('We may refuse, pause or remove material reasonably believed to be unlawful, unsafe, misleading or contrary to platform rules.'),

    h('8. Products, delivery and returns'),
    p('Unless expressly agreed otherwise, Brands bear product, packaging, dispatch, customs, replacement and return costs.'),
    p('Brands remain responsible for deliveries they arrange and for resolving lost, damaged, delayed or incorrectly addressed parcels, except to the extent caused by our breach.'),
    p('A gifted product is not automatically returnable because an Influencer gives honest criticism, withdraws before accepting campaign obligations or does not produce unguaranteed output.'),
    p('Any loan, return requirement or conditional gifting arrangement must be agreed before dispatch.'),
    p('Neither we nor an Influencer must use a product reasonably suspected to be unsafe, unsuitable, damaged or recalled.'),

    h('9. Timelines, approvals and revisions'),
    p('Timelines depend on receiving payment, products, information, access and approvals when required.'),
    p('Delays caused by a Brand or its suppliers may extend delivery dates and require rescheduling. Any additional charges must reflect reasonable additional work or unavoidable costs and be explained to the Brand.'),
    p('Unless otherwise agreed, the Brand must submit one consolidated set of feedback within five working days of receiving content.'),
    p('Revision allowances are as stated in the Campaign Order. Changes to an approved brief, new concepts and preference-based reshoots are additional work. We will correct our own material departures from the agreed brief without an additional charge.'),
    p('Silence does not authorise publication where express Brand approval is required. However, delayed approval does not postpone payment for work properly completed.'),

    h('10. Fees and payment'),
    p('Unless the Campaign Order states otherwise:'),
    ul(
      'Fees are quoted in pounds sterling, excluding VAT.',
      'Campaign fees and monthly retainers are payable upfront.',
      'Work may be scheduled to begin once cleared payment and required materials are received.',
      'Advertising spend and third-party costs are payable separately.',
    ),
    p('Commission applies only where agreed in writing. The Campaign Order must define the rate, calculation basis, reporting access and payment date.'),
    p('Brands must notify us promptly of invoice disputes and pay undisputed amounts on time.'),
    p('We may claim statutory interest, fixed compensation and recoverable debt recovery costs on qualifying overdue commercial debts.'),

    h('11. Late payment and suspension'),
    p('We may suspend services following written notice if an undisputed payment is overdue, or immediately where continued work would create a material security, safety or legal risk.'),
    p('Suspension does not cancel fees already due or obligations to pay for completed work and unavoidable commitments.'),
    p('For an ongoing retainer, fees may continue during a Brand-caused suspension to the extent they cover capacity reasonably reserved and unable to be redeployed. We will take reasonable steps to reduce avoidable losses.'),
    p('Restart dates depend on availability. We are not responsible for delay caused by a suspension properly exercised under this clause.'),

    h('12. Duration, cancellation and termination'),
    p('The Campaign Order determines the initial term and any renewal arrangements.'),
    p('Unless expressly agreed otherwise:'),
    ul(
      'A one-off campaign ends when its obligations are completed.',
      'A fixed-term campaign does not automatically renew.',
      'An expressly agreed rolling monthly service requires at least 30 days’ written notice.',
    ),
    p('A Brand cancelling early must pay for work performed, reasonable work in progress and non-cancellable commitments. Any further cancellation charge must be expressly agreed, proportionate and reflect legitimate losses after reasonable mitigation.'),
    p('Amounts paid for unperformed services beyond those sums will be refunded.'),
    p('Either party may terminate for a material breach not remedied within 14 days of written notice, where the breach can be remedied.'),
    p('We may terminate immediately for fraud, serious abuse, unlawful instructions or a material safety risk.'),
    p('If a Brand terminates because of our unremedied material breach, it will receive a refund for prepaid services we will not provide, without prejudice to other applicable rights.'),

    h('13. Brand use of influencer information'),
    p('Brands receiving Influencer information must:'),
    ul(
      'Use it only for the disclosed campaign and fulfilment purposes.',
      'Establish their own lawful basis where acting as an independent controller.',
      'Provide required privacy information.',
      'Keep information secure and restrict access.',
      'Retain it only as long as justified.',
      'Assist appropriately with rights requests and incidents.',
      'Prevent unauthorised onward disclosure or sale.',
    ),
    p('A fulfilment or customer record created to dispatch a gift does not automatically permit newsletters, promotional messages, audience uploads or unrelated marketing.'),
    p('Brands must not treat gifting participation as unlimited permission to contact or market to an Influencer.'),

    h('Terms for Influencers', 2),
    h('14. Registration and network participation'),
    p('Registration does not guarantee selection, products, paid work or earnings.'),
    p('Influencers must keep their profile, contact information, delivery details and relevant audience statistics accurate.'),
    p('Influencers must not knowingly misrepresent their audience, identity, engagement or campaign results, or use purchased or fraudulent engagement to secure opportunities.'),
    p('We may verify information and suspend or remove profiles for material inaccuracies, repeated unjustified non-delivery, unlawful conduct or serious breaches of these terms.'),

    h('15. Automatic gifting matching'),
    bold('If you separately opt into automatic gifting, Dogfluencers may match you with suitable opportunities and arrange relevant data sharing and product dispatch without asking for approval each time, within the scope of your valid opt-in and our Privacy Policy.'),
    p('This permission does not extend to recipients, purposes or activities outside that scope. Further consent will be obtained where legally required.'),
    rich({ text: 'You must keep gifting preferences and delivery details current. You can withdraw from future gifting by emailing ' }, email, { text: '.' }),
    p('Withdrawing privacy consent does not create a penalty. We will explain any existing campaign obligations and any lawful information retention separately.'),
    bold('Receiving an unsolicited product does not, by itself, create an obligation to publish content, pay for it or return it.'),

    h('16. Campaign commitments'),
    p('A content obligation arises only where you have accepted the relevant deliverables, whether through a specific campaign acceptance or clearly defined standing campaign terms accepted in advance.'),
    p('Where you accept a campaign, you must:'),
    ul(
      'Follow the agreed brief and reasonable lawful instructions.',
      'Meet agreed deadlines or promptly flag difficulties.',
      'Produce original content reflecting your actual experience.',
      'Include required advertising disclosures.',
      'Supply agreed links, files and genuine performance evidence.',
      'Keep content available for the agreed period, subject to safety, legal and platform requirements.',
    ),
    p('A Brand cannot require you to give a dishonest positive opinion or make claims you cannot substantiate.'),
    p('Notify us promptly if a product is unsuitable, causes a reaction or cannot safely be used. Stop using it where appropriate.'),
    p('If you cannot complete agreed deliverables, contact us promptly so we can consider an extension, alternative content or cancellation.'),

    h('17. Advertising disclosures and compliance'),
    p('Influencers must comply with applicable advertising, consumer protection, intellectual property and platform rules.'),
    rich(
      { text: 'Commercial relationships, including gifted products and affiliate arrangements, must be clearly disclosed as required. Where content is advertising, use a prominent, upfront ' },
      { text: '“Ad”', bold: true },
      { text: ' disclosure and any required platform tools.' },
    ),
    p('Do not assume that “gifted”, a Brand tag or a disclosure hidden after “more” is sufficient.'),
    p('Brands and Influencers must cooperate with reasonable requests to correct disclosures or remove unlawful or unsafe material.'),

    h('18. Influencer payments and expenses'),
    p('Gifting campaigns are unpaid unless payment is expressly agreed in writing.'),
    p('A product’s stated value is not a cash payment entitlement. We do not reimburse expenses unless authorised in advance.'),
    p('For paid work, the written agreement will identify the paying party, fee, deliverables and payment timetable. Dogfluencers is responsible for payment where it has contracted as the payer.'),
    p('Influencers are responsible for their own tax reporting and applicable business obligations. Employment status and statutory rights depend on the actual relationship and applicable law.'),

    h('19. Non-delivery and campaign breaches'),
    p('If an Influencer materially fails to deliver an accepted campaign without reasonable justification, we may request a reasonable opportunity to remedy, withhold the genuinely disputed portion of a related fee where lawful, or end future participation.'),
    p('Any repayment, product return or compensation request must have a contractual and lawful basis and be proportionate to actual loss.'),
    p('We will not impose an automatic product-value charge merely because a recipient does not publish an unsolicited or unconditionally gifted product.'),

    h('Content Rights and General Terms', 2),
    h('20. Ownership and content licences'),
    p('Each party retains ownership of its existing intellectual property.'),
    p('Influencers retain copyright in their original content unless a separate written assignment states otherwise.'),
    p('For accepted campaign deliverables, Influencers grant Dogfluencers the non-exclusive rights reasonably necessary to receive, review, store, administer and report on the campaign.'),
    p('Any Brand licence must be specified before the Influencer accepts the campaign and must identify:'),
    ul(
      'The permitted content and uses.',
      'Platforms and territory.',
      'Duration.',
      'Whether editing, paid advertising, sublicensing or creator account permissions are included.',
    ),
    bold('Gifting alone does not transfer copyright or create unlimited advertising rights.'),
    p('If no Brand licence has been agreed, the Brand must obtain permission before downloading, reposting, editing or advertising with Influencer content.'),
    p('Brands receive only the rights Dogfluencers owns or is authorised to license. Unless otherwise agreed, licences supplied by us take effect once the relevant fees are paid in full.'),
    p('Raw footage, project files, music rights, exclusivity, AI training, synthetic likenesses and voice cloning are excluded unless expressly agreed with the relevant rights holders.'),

    h('21. Materials and permissions'),
    p('Brands warrant that they have permission to supply and authorise use of their logos, claims, assets and briefs.'),
    p('Influencers warrant that their deliverables are original or appropriately licensed and that necessary permissions have been obtained for identifiable people and third-party material.'),
    p('Music available within one platform may not be licensed for reposting or paid advertising elsewhere. The party undertaking a new use must obtain any additional rights needed.'),
    p('Neither party may remove mandatory disclosures or edit content so that it becomes misleading.'),

    h('22. Platforms, accounts and third parties'),
    p('Social media platforms, couriers, payment providers and other external services operate independently.'),
    p('We do not guarantee uninterrupted access, account recovery, platform approval or protection from algorithm changes, restrictions, hacking or account suspension.'),
    rich(
      { text: 'We are not liable for account loss or platform action outside our reasonable control.', bold: true },
      { text: ' This does not exclude liability arising from our own actionable breach or negligence, subject to the lawful limits below.' },
    ),
    p('Brands and Influencers remain responsible for account ownership, recovery details, authorised access and security settings under their control.'),

    h('23. Confidentiality and publicity'),
    p('Each party must protect confidential campaign, commercial and personal information and use it only for the agreed purpose.'),
    p('This does not prevent lawful disclosures to advisers, regulators or courts, or protected disclosures.'),
    p('Public announcements, portfolio use, testimonials and case studies require appropriate permission. Public availability of content does not itself grant additional usage rights.'),

    h('24. Liability'),
    p('Nothing in these terms excludes or limits liability for:'),
    ul(
      'Death or personal injury caused by negligence.',
      'Fraud or fraudulent misrepresentation.',
      'Any liability that cannot lawfully be excluded or limited.',
      'Mandatory consumer or data protection rights.',
    ),
    p('Subject to those exceptions, in business-to-business dealings:'),
    ul(
      'We are not liable for indirect or consequential loss, or loss of profit, revenue, anticipated savings, business opportunity or goodwill.',
      'Our total aggregate liability arising from an affected Campaign Order is limited to the fees paid or payable to us under that order.',
      'For a rolling service lasting more than 12 months, that cap is the fees paid or payable for the service in the 12 months preceding the event giving rise to the claim.',
      'Product costs, advertising budgets and other pass-through expenditure are not agency fees for calculating that cap.',
    ),
    p('These limits apply only to the extent lawful and reasonable. They do not remove express deliverable commitments or the remedies stated in these terms.'),
    p('For Influencers who do not purchase services from us, any liability limit must be stated in the applicable campaign agreement; a zero-fee arrangement does not automatically reduce our liability to zero.'),

    h('25. Responsibility for third-party claims'),
    p('A Brand acting in business must compensate us for reasonable losses and costs arising from a third-party claim caused by its unlawful or unsafe products, infringing materials, unlawful instructions or misuse of Influencer data.'),
    p('An Influencer acting in business must compensate us for reasonable losses and costs arising from a third-party claim caused by knowingly infringing content, fraudulent representations or unlawful conduct.'),
    p('These obligations apply only to the extent caused by the relevant party’s breach. They do not cover our own fault or another party’s independent conduct.'),
    p('We must notify the responsible party promptly, take reasonable steps to reduce loss and not agree a settlement imposing liability on that party without its reasonable consent.'),

    h('26. Events outside reasonable control'),
    p('Neither party is liable for delay caused by an event outside its reasonable control that could not reasonably have been prevented or overcome.'),
    p('The affected party must notify the other and take reasonable steps to reduce disruption. Ordinary staffing shortages, lack of funds and avoidable supplier failures do not automatically qualify.'),
    p('If a material interruption continues for more than 30 days, either party may terminate the affected services. Charges and refunds will reflect work completed and reasonable unavoidable commitments.'),

    h('27. Complaints and disputes'),
    rich({ text: 'Send complaints to ' }, email, { text: ', identifying the campaign, issue and requested resolution.' }),
    p('The parties will first try to resolve disputes in good faith. This does not prevent urgent court action, regulatory complaints or exercise of statutory rights.'),

    h('28. Changes, notices and general provisions'),
    p('We may update website and future campaign terms. Existing Campaign Orders remain governed by the version accepted unless a change is agreed or required by law.'),
    p('Material changes to ongoing Influencer participation will be notified before taking effect. Updated terms do not expand privacy consent automatically.'),
    rich({ text: 'Contractual notices must be sent to the contact email in the Campaign Order or, for us, ' }, email, { text: '.' }),
    p('A failure to enforce a provision is not a waiver. If a provision is unenforceable, the remaining provisions continue where legally possible.'),
    p('Neither party may transfer contractual obligations without consent, except as part of a genuine business transfer that does not materially reduce the other party’s rights.'),
    p('No person other than a contracting party has a right to enforce these terms unless expressly stated.'),

    h('29. Governing law'),
    p('These terms and related business contracts are governed by the laws of England and Wales, with disputes subject to the courts of England and Wales.'),
    p('Where an individual has mandatory consumer protections or rights to bring proceedings elsewhere, those rights remain unaffected.'),
  ],
};

/**
 * Written to match what the site actually stores (October 2026): the
 * Supabase sign-in cookies for creator and team logins, and the light or dark
 * choice in local storage. No analytics or advertising. If either is ever
 * added, this policy and a consent prompt must come first.
 */
export const cookiePolicy: LegalDocument = {
  updated: '16 October 2026',
  body: [
    h('1. About this policy'),
    rich(
      { text: 'This policy explains how the Dogfluencers website, operated by Fluencers Group LTD, uses cookies and similar technologies. Please read it alongside our ' },
      { text: 'privacy policy', href: '/privacy/' },
      { text: ', which explains how we handle personal information.' },
    ),

    h('2. What cookies are'),
    p('Cookies are small text files a website stores on your device, so it can recognise your browser on later visits. Similar technologies, such as your browser’s local storage, work in much the same way. In this policy, “cookies” covers both.'),

    h('3. The cookies we use'),
    p('We only use cookies that are strictly necessary for the website to work, or that remember a choice you have made. We do not use advertising cookies, and we do not use analytics or tracking cookies.'),
    termList(
      [
        'Sign-in cookies.',
        ' Set only when you log in to your creator profile or to our team area, to keep you signed in securely as you move between pages. They begin “sb-”, and last until you log out, which removes them, or for up to 400 days. A short-lived cookie of the same kind is also used while you follow a login or password-reset link from one of our emails.',
      ],
      [
        'Light or dark display.',
        ' If you switch the site between light and dark, your browser remembers your choice in its local storage, under “theme”. It stays on your device and is not sent to us.',
      ],
    ),

    h('4. Consent'),
    p('Because these cookies are strictly necessary for a service you have asked for, or remember a setting you have chosen, the law does not require your consent before they are set. That is why we do not show a cookie banner.'),
    p('If we ever add analytics or other cookies that are not strictly necessary, we will ask for your consent before setting them and update this policy first.'),

    h('5. Other websites'),
    p('Our website links to other sites, such as Instagram. When you follow those links, the other site may set its own cookies under its own policies, which we do not control.'),

    h('6. Managing cookies'),
    p('You can block or delete cookies through your browser’s settings, and most browsers let you clear the data stored by a single site. If you block our sign-in cookies, you will not be able to log in to your profile. Clearing our site data resets the display to follow your device’s light or dark setting.'),

    h('7. Changes to this policy'),
    p('We will update this policy if the cookies we use change, and update the date above when we do.'),

    h('8. Contact'),
    rich({ text: 'If you have any questions about cookies on our website, contact ' }, email, { text: '.' }),
  ],
};

/**
 * Practical guidance for creators on gifting, linked from campaign emails.
 * Kept in step with the Terms (sections 14 to 18): it explains them, it
 * never adds obligations of its own.
 */
export const giftingGuidelines: LegalDocument = {
  updated: '11 November 2026',
  body: [
    h('How gifting works', 2),
    p('If you’ve joined our gifting network, your dog is considered automatically for gifting that fits their profile: breed, size, age, diet, any allergies and the content you make. You don’t need to opt in to each campaign.'),
    p('Brands choose creators to fit their brief, so not everyone is picked every time. A campaign email doesn’t guarantee you’ll receive the product.'),

    h('PR boxes and gift drops', 2),
    ul(
      'PR boxes are packages put together by a brand, often around a launch, and sent to a smaller group of dogs.',
      'Gift drops are products sent to a wider group of dogs, up to 100 at a time, as part of a gifting campaign.',
    ),

    h('When it arrives', 2),
    ul(
      'Check everything is there, and tell us if anything is missing, damaged or wrong.',
      'Read the ingredients, feeding guides, warnings and instructions, and only use a product if it suits your dog.',
      'Introduce new food and treats gradually, as the pack directs, and check with your vet if your dog has a health condition or a sensitive stomach.',
      'Supervise your dog with new toys and chews, and take away anything that breaks into pieces.',
      'If a product upsets your dog or you can’t use it safely, stop using it and tell us.',
    ),

    h('Sharing your content', 2),
    p('If you enjoy the product, we’d love an Instagram or TikTok story that follows the campaign email. If you love it, a post goes even further. Standout content helps us recommend you for future campaigns, including paid ones.'),
    ul(
      'Tag the brand and @dogfluencers.agency, so we can see it and share it.',
      'Keep it honest. Your opinion should always be your own.',
      'Show the product as it really is, and your dog as they really are with it. Never film anything that puts your dog at risk.',
      'Hold content until any date given in the campaign email.',
    ),
    rich(
      { text: 'Receiving a gift doesn’t, by itself, mean you have to post. Content is only required when a campaign clearly says so and you’ve accepted it. Gifting is unpaid unless payment is agreed in writing. See our ' },
      { text: 'Terms', href: '/terms/' },
      { text: ' for the details.' },
    ),

    h('Always disclose', 2),
    rich(
      { text: 'Make every commercial relationship clear, including gifted products. Where content is advertising, put a prominent ' },
      { text: '“Ad”', bold: true },
      { text: ' at the start, and turn on Instagram’s paid partnership label or TikTok’s branded content toggle. Don’t rely on “gifted”, a brand tag or a disclosure hidden after “more”. These are the UK advertising rules, and brands can’t ask you to break them.' },
    ),

    h('Keep your details up to date', 2),
    rich(
      { text: 'Please ' },
      { text: 'log in', href: '/creator/login/' },
      { text: ' regularly to check your delivery address, your dog’s details and follower numbers, so nothing goes astray and we can match you well.' },
    ),
    rich({ text: 'To stop receiving gifts, or to ask a question, email ' }, email, { text: '.' }),
  ],
};

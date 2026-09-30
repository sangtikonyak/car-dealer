import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

type LegalPageKind = 'privacy' | 'terms';

interface LegalSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

const privacySections: LegalSection[] = [
  {
    heading: 'Information we collect',
    paragraphs: [
      'We may collect information you provide when you contact us, subscribe to updates, request a callback, book a viewing, or enquire about a vehicle.',
      'We may also collect basic device, browser, IP address, page-view, cookie, and website usage information.',
    ],
    bullets: [
      'Name, email address, phone number, and enquiry details.',
      'Vehicle preferences and records of communications with us.',
      'Newsletter subscription information.',
    ],
  },
  {
    heading: 'How we use information',
    paragraphs: ['We use information to:'],
    bullets: [
      'Respond to enquiries and arrange viewings, callbacks, or test drives.',
      'Provide inventory and newsletter updates.',
      'Improve our website, services, and customer experience.',
      'Maintain website security, prevent fraud, and comply with legal obligations.',
    ],
  },
  {
    heading: 'How we share information',
    paragraphs: [
      'We may share information with service providers that support our website, hosting, email, analytics, and customer service operations. We may also share information when required by law, to protect our rights, or as part of a business sale or reorganization.',
      'We do not sell your personal information. Replace this statement if it does not accurately describe your business practices.',
    ],
  },
  {
    heading: 'Cookies and retention',
    paragraphs: [
      'We may use essential cookies and, where applicable, analytics or preference cookies. You can control cookies through your browser settings.',
      'We retain personal information only for as long as reasonably necessary for the purposes described in this policy, legal requirements, dispute resolution, and business records.',
    ],
  },
  {
    heading: 'Security and your rights',
    paragraphs: [
      'We use reasonable administrative, technical, and organizational safeguards to protect personal information. No online transmission or storage system can be guaranteed to be completely secure.',
      'Depending on your location, you may have rights to request access, correction, deletion, restriction, portability, or objection to certain uses of your information. Contact us to make a request.',
    ],
  },
  {
    heading: 'Children, changes, and contact',
    paragraphs: [
      'This website is not directed to children under [13/16], and we do not knowingly collect personal information from children.',
      'We may update this Privacy Policy from time to time. The updated version will be posted on this page with a revised effective date.',
      'Contact: privacy@driva.example · [Legal business name] · [Business address]. Replace these sample details before launch.',
    ],
  },
];

const termsSections: LegalSection[] = [
  {
    heading: 'Website use',
    paragraphs: [
      'You may use this website for personal, lawful purposes, including browsing vehicle listings and contacting us. You must not misuse the website, interfere with its operation, submit misleading information, or attempt unauthorized access.',
    ],
  },
  {
    heading: 'Vehicle listings',
    paragraphs: [
      'Vehicle descriptions, images, prices, mileage, specifications, availability, and equipment are provided for general information. Listings may change or be withdrawn without notice. Images may be representative and may not show the exact vehicle currently available.',
      'Independently confirm the vehicle condition, history, mileage, availability, price, taxes, fees, and equipment before making a purchase decision.',
    ],
  },
  {
    heading: 'Enquiries, appointments, and payment',
    paragraphs: [
      'Submitting an enquiry does not reserve a vehicle or create a purchase contract. A vehicle sale is completed only through a separate agreement signed by the relevant parties.',
      'Prices may exclude taxes, registration, delivery, finance charges, documentation fees, or other applicable costs. Final price and payment terms will be confirmed in the applicable sales documentation.',
    ],
  },
  {
    heading: 'Intellectual property and third-party links',
    paragraphs: [
      'Website text, branding, graphics, photographs, logos, and other content belong to Driva or its licensors. You may not reproduce, modify, distribute, or commercially use this content without written permission.',
      'The website may contain links to third-party websites or services. Driva is not responsible for their content, availability, privacy practices, or terms.',
    ],
  },
  {
    heading: 'Disclaimers and liability',
    paragraphs: [
      'To the extent permitted by law, the website and its content are provided on an “as available” basis. We do not guarantee that the website will always be accurate, uninterrupted, secure, or error-free.',
      'Nothing in these Terms excludes rights or protections that cannot legally be excluded. To the extent permitted by law, Driva will not be liable for indirect, incidental, special, or consequential losses arising from your use of the website or reliance on listing information.',
    ],
  },
  {
    heading: 'Privacy, changes, and governing law',
    paragraphs: [
      'Our collection and use of personal information is described in our Privacy Policy.',
      'We may update these Terms from time to time. Updated Terms will be posted on this page with a revised effective date.',
      'These Terms are governed by the laws of [state/country]. Any disputes will be handled by the courts of [location], unless applicable law requires otherwise.',
      'Contact: legal@driva.example · [Legal business name] · [Business address]. Replace these sample details before launch.',
    ],
  },
];

export function LegalPage({ kind }: { kind: LegalPageKind }) {
  const isPrivacy = kind === 'privacy';
  const title = isPrivacy ? 'Privacy policy' : 'Terms and conditions';
  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <main className="legal-page">
      <div className="legal-page-inner">
        <Link className="back-link" to="/">
          <ArrowLeft size={16} aria-hidden="true" /> Back home
        </Link>
        <header className="legal-page-header">
          <p className="section-eyebrow">Driva Pre-Owned · Legal</p>
          <h1>{title}</h1>
          <p>
            {isPrivacy
              ? 'How we collect, use, and protect information when you browse our collection or contact our team.'
              : 'The terms that apply when you browse our collection, contact our team, or use this website.'}
          </p>
          <span className="legal-page-effective">Last updated: [Date]</span>
        </header>

        <div className="legal-page-body">
          <aside className="legal-page-side">
            <p className="section-eyebrow">On this page</p>
            <nav aria-label={`${title} sections`}>
              {sections.map((section) => (
                <a
                  href={`#${section.heading.toLowerCase().replaceAll(' ', '-')}`}
                  key={section.heading}
                >
                  {section.heading}
                </a>
              ))}
            </nav>
          </aside>
          <article className="legal-page-article">
            {sections.map((section, index) => (
              <section
                id={section.heading.toLowerCase().replaceAll(' ', '-')}
                className="legal-page-section"
                key={section.heading}
              >
                <span className="legal-page-section-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>
        </div>
      </div>
    </main>
  );
}

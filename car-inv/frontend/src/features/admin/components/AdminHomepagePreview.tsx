import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { useState } from 'react';
import { BenefitsSection } from '../../../components/BenefitsSection';
import { FaqSection } from '../../../components/FaqSection';
import { Footer } from '../../../components/Footer';
import { Hero } from '../../../components/Hero';
import { HowItWorksSection } from '../../../components/HowItWorksSection';
import { MobileAppSection } from '../../../components/MobileAppSection';
import { ShowroomSection } from '../../../components/ShowroomSection';
import type { AdminHomepagePayload } from '../types';
import type { HomepageSection } from './AdminHomepageWorkspace';

type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

const viewportOptions: Array<{
  value: PreviewViewport;
  label: string;
  icon: typeof Monitor;
}> = [
  { value: 'desktop', label: 'Desktop preview', icon: Monitor },
  { value: 'tablet', label: 'Tablet preview', icon: Tablet },
  { value: 'mobile', label: 'Mobile preview', icon: Smartphone },
];

export function AdminHomepagePreview({
  section,
  content,
}: {
  section: Exclude<HomepageSection, 'overview'>;
  content: AdminHomepagePayload;
}) {
  const [viewport, setViewport] = useState<PreviewViewport>('desktop');

  return (
    <aside className="admin-live-preview" aria-label={`${section} live preview`}>
      <div className="admin-live-preview-toolbar">
        <div>
          <strong>Live preview</strong>
          <span>Unsaved changes appear here instantly.</span>
        </div>
        <div className="admin-preview-viewport-switcher" aria-label="Preview size">
          {viewportOptions.map(({ value, label, icon: Icon }) => (
            <button
              className={viewport === value ? 'active' : ''}
              type="button"
              aria-label={label}
              aria-pressed={viewport === value}
              key={value}
              onClick={() => setViewport(value)}
            >
              <Icon size={15} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <div className={`admin-live-preview-stage is-${viewport}`} data-viewport={viewport}>
        <div className="admin-live-preview-document">
          <PreviewSection section={section} content={content} />
        </div>
      </div>
    </aside>
  );
}

function PreviewSection({
  section,
  content,
}: {
  section: Exclude<HomepageSection, 'overview'>;
  content: AdminHomepagePayload;
}) {
  switch (section) {
    case 'site-identity':
      return (
        <section className="admin-site-identity-preview">
          <p className="admin-kicker">SITE IDENTITY</p>
          <h2>{content.site.brandName}</h2>
          <p>{content.site.title}</p>
          <span>{content.site.inventoryCtaLabel}</span>
        </section>
      );
    case 'brand-hero':
      return <Hero content={content} />;
    case 'benefits':
      return <BenefitsSection content={content} />;
    case 'how-it-works':
      return <HowItWorksSection content={content} />;
    case 'faqs':
      return <FaqSection content={content} />;
    case 'showroom':
      return <ShowroomSection content={content} />;
    case 'about':
      return <MobileAppSection content={content} />;
    case 'footer':
      return <Footer content={content} />;
  }
}

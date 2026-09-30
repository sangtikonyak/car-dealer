import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  CircleAlert,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Info,
  Mail,
  MapPinned,
  MessageCircleQuestion,
  Plus,
  Route,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type * as React from 'react';
import type { HomepageContent } from '../../homepage/types';
import {
  updateAdminHomepageAbout,
  updateAdminHomepageBenefits,
  updateAdminHomepageFaqs,
  updateAdminHomepageHowItWorks,
  updateAdminHomepageIdentity,
  updateAdminHomepageSiteIdentity,
  updateAdminHomepageFooter,
  updateAdminHomepageShowroom,
} from '../api';
import type { AdminHomepagePayload, MediaAsset } from '../types';
import { useSnackbar } from '../../../components/Snackbar';
import {
  AdminTextArea,
  AdminTextField,
  IconPicker,
  resolveMediaUrl,
  SectionSaveButton,
  TonePicker,
} from './AdminHomepageEditor';
import { AdminDropdown, type AdminDropdownOption } from './AdminDropdown';

const MAX_HOMEPAGE_BENEFITS = 6;

export type HomepageSection =
  | 'overview'
  | 'site-identity'
  | 'brand-hero'
  | 'benefits'
  | 'how-it-works'
  | 'faqs'
  | 'showroom'
  | 'about'
  | 'footer';

export const homepageSectionLabels: Record<HomepageSection, string> = {
  overview: 'Homepage overview',
  'site-identity': 'Site identity',
  'brand-hero': 'Brand & hero',
  benefits: 'Benefits',
  'how-it-works': 'How it works',
  faqs: 'FAQs',
  showroom: 'Showroom',
  about: 'About',
  footer: 'Footer',
};

const homepageSaveEntityLabels: Record<HomepageSection, string> = {
  overview: 'Homepage overview',
  'site-identity': 'Site identity',
  'brand-hero': 'Brand & hero',
  benefits: 'Benefits',
  'how-it-works': 'How it works',
  faqs: 'FAQ',
  showroom: 'Showroom',
  about: 'About',
  footer: 'Footer',
};

const isHomepageSection = (value: string): value is HomepageSection =>
  Object.hasOwn(homepageSectionLabels, value);

const mediaFileName = (asset: MediaAsset): string => asset.url.split('/').pop() ?? asset.url;

type HomepageSaveError = {
  message: string;
  details: string[];
};

const homepageValidationLabels: Record<string, string> = {
  'footer.description': 'Description',
  'footer.email': 'Email',
  'footer.phone': 'Phone number',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function formatHomepageSaveError(error: unknown): HomepageSaveError {
  const response = isRecord(error) ? error.response : undefined;
  const responseData = isRecord(response) ? response.data : undefined;
  const body = isRecord(responseData) ? responseData : null;
  const errorBody = body && isRecord(body.error) ? body.error : null;
  const details = Array.isArray(errorBody?.details)
    ? errorBody.details.flatMap((detail): string[] => {
        if (
          !isRecord(detail) ||
          !Array.isArray(detail.path) ||
          typeof detail.message !== 'string'
        ) {
          return [];
        }

        const pathParts = detail.path.filter(
          (part): part is string | number => typeof part === 'string' || typeof part === 'number',
        );
        const path = pathParts.join('.');
        if (!path) return [detail.message];

        const lastPathPart = pathParts.at(-1);
        const fieldPathPart = typeof lastPathPart === 'number' ? pathParts.at(-2) : lastPathPart;
        const fieldName =
          homepageValidationLabels[path] ?? humanize(String(fieldPathPart ?? 'Field'));
        const message = detail.message.toLowerCase().includes('too small')
          ? `${fieldName} is required.`
          : `${fieldName}: ${detail.message}`;
        return [message];
      })
    : [];

  return {
    message:
      body && typeof body.message === 'string'
        ? body.message
        : 'We could not save this section. Check the fields and try again.',
    details,
  };
}

type RequiredField = [label: string, value: string];

function getRequiredFieldsValidationError(fields: RequiredField[]): HomepageSaveError | null {
  const missingFields = fields.filter(([, value]) => !value.trim());

  return missingFields.length
    ? {
        message: 'Please complete the required fields.',
        details: missingFields.map(([label]) => `${label} is required.`),
      }
    : null;
}

function getSectionRequiredValidationError(
  section: HomepageSection,
  content: AdminHomepagePayload,
): HomepageSaveError | null {
  switch (section) {
    case 'site-identity':
      return getRequiredFieldsValidationError([
        ['Brand name', content.site.brandName],
        ['Site title', content.site.title],
        ['Brand logo', content.site.brandMark],
        ['Inventory button label', content.site.inventoryCtaLabel],
      ]);
    case 'brand-hero':
      return getRequiredFieldsValidationError([
        ['Eyebrow', content.hero.eyebrow],
        ['Image alt text', content.hero.imageAlt],
        ['Title lines', content.hero.titleLines.join('\n')],
        ['Description', content.hero.description],
        ['Hero image', content.hero.imageUrl],
      ]);
    case 'showroom':
      return getRequiredFieldsValidationError([
        ['Eyebrow', content.showroom.eyebrow],
        ['Title', content.showroom.title],
        ['Location', content.showroom.location],
        ['Opening hours', content.showroom.openingHours],
        ['Sunday hours', content.showroom.sundayHours],
        ['Phone', content.showroom.phone],
        ['Phone href', content.showroom.phoneHref],
        ['Map label', content.showroom.mapLabel],
        ['Description', content.showroom.description],
        ['Map area', content.showroom.mapArea],
        ['Directions URL', content.showroom.directionsUrl],
      ]);
    case 'about':
      return getRequiredFieldsValidationError([
        ['Eyebrow', content.about.eyebrow],
        ['Title', content.about.title],
        ['Description', content.about.description],
        ['Appointment duration', content.about.preview.appointmentDuration],
        ['Appointment label', content.about.preview.appointmentLabel],
        ['Appointment time', content.about.preview.appointmentTime],
        ['Saved vehicle label', content.about.preview.savedVehicleLabel],
        ['Vehicle name', content.about.preview.vehicleName],
        ['Mileage label', content.about.preview.mileageLabel],
        ['Mileage', content.about.preview.mileage],
        ['Price label', content.about.preview.priceLabel],
        ['Price', content.about.preview.price],
        ['Inspection label', content.about.preview.inspectionLabel],
        ['Inspection', content.about.preview.inspection],
        ['Enquiry label', content.about.preview.enquiryLabel],
        ['Preview image', content.about.preview.imageUrl],
        ['Preview image alt text', content.about.preview.imageAlt],
      ]);
    case 'footer':
      return getRequiredFieldsValidationError([
        ['Description', content.footer.description],
        ['Email', content.footer.email],
        ['Phone number', content.footer.phone],
      ]);
    default:
      return null;
  }
}

export function getHomepageSection(value: string | undefined): HomepageSection {
  return value && isHomepageSection(value) ? value : 'overview';
}

export function AdminHomepageWorkspace({
  section,
  initialContent,
  mediaAssets,
  onSaved,
  onOpenSection,
  reloadPage = () => window.location.reload(),
}: {
  section: HomepageSection;
  initialContent: AdminHomepagePayload;
  mediaAssets: MediaAsset[];
  onSaved: (updated: AdminHomepagePayload) => void;
  onOpenSection: (section: HomepageSection) => void;
  reloadPage?: () => void;
}) {
  const [content, setContent] = useState<AdminHomepagePayload>(() =>
    structuredClone(initialContent),
  );
  const [saveError, setSaveError] = useState<HomepageSaveError | null>(null);
  const { showSnackbar } = useSnackbar();

  const updateContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>> = (next) => {
    setSaveError(null);
    setContent(next);
  };

  const save = useMutation({
    mutationFn: () => saveHomepageSection(section, content),
    onSuccess: (updated) => {
      setSaveError(null);
      setContent(updated);
      onSaved(updated);
      showSnackbar({
        message: `${homepageSaveEntityLabels[section]} saved successfully`,
        tone: 'success',
      });
      if (section === 'site-identity') {
        reloadPage();
      }
    },
    onError: (error) => {
      const nextError = formatHomepageSaveError(error);
      setSaveError(nextError);
      showSnackbar({ message: nextError.message, tone: 'error' });
    },
  });

  if (section === 'overview') {
    return <HomepageOverview content={content} onOpenSection={onOpenSection} />;
  }

  const page = renderSection({ section, content, mediaAssets, setContent: updateContent });

  const handleSave = () => {
    const validationError = getSectionRequiredValidationError(section, content);
    if (validationError) {
      setSaveError(validationError);
      showSnackbar({ message: validationError.message, tone: 'error' });
      return;
    }

    setSaveError(null);
    save.mutate();
  };

  return (
    <div className="admin-workspace-stack admin-section-editor">
      <div className="admin-workspace-intro">
        <div>
          <p className="admin-kicker">HOMEPAGE / {homepageSectionLabels[section].toUpperCase()}</p>
          <h2>{page.title}</h2>
          <p>{page.description}</p>
        </div>
        <SectionSaveButton
          label={page.saveLabel}
          message={null}
          pending={save.isPending}
          onClick={handleSave}
        />
      </div>
      {saveError ? (
        <div className="admin-form-error" role="alert">
          <span className="admin-form-error-icon" aria-hidden="true">
            <CircleAlert size={17} strokeWidth={2} />
          </span>
          <div className="admin-form-error-body">
            <p className="admin-form-error-title">{saveError.message}</p>
            <p className="admin-form-error-copy">
              Review the details below and try again before saving this section.
            </p>
            {saveError.details.length ? (
              <ul className="admin-validation-summary">
                {saveError.details.map((detail, index) => (
                  <li key={`${detail}-${index}`}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="admin-centered-editor-form">{page.content}</div>
    </div>
  );
}

async function saveHomepageSection(
  section: HomepageSection,
  content: AdminHomepagePayload,
): Promise<AdminHomepagePayload> {
  switch (section) {
    case 'site-identity':
      return updateAdminHomepageSiteIdentity({ site: content.site });
    case 'brand-hero':
      return updateAdminHomepageIdentity({ site: content.site, hero: content.hero });
    case 'benefits':
      return updateAdminHomepageBenefits({
        benefitsIntro: content.benefitsIntro,
        benefits: content.benefits.map((benefit, index) => ({
          ...benefit,
          displayOrder: index,
        })),
      });
    case 'how-it-works':
      return updateAdminHomepageHowItWorks({
        howItWorks: content.howItWorks,
        steps: content.steps.map((step, index) => ({ ...step, displayOrder: index })),
      });
    case 'faqs':
      return updateAdminHomepageFaqs({
        faq: content.faq,
        faqs: content.faqs.map((faq, index) => ({ ...faq, displayOrder: index })),
      });
    case 'showroom':
      return updateAdminHomepageShowroom(content.showroom);
    case 'about':
      return updateAdminHomepageAbout(content.about);
    case 'footer':
      return updateAdminHomepageFooter(content.footer);
    default:
      return content;
  }
}

function renderSection({
  section,
  content,
  mediaAssets,
  setContent,
}: {
  section: Exclude<HomepageSection, 'overview'>;
  content: AdminHomepagePayload;
  mediaAssets: MediaAsset[];
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>;
}): { title: string; description: string; saveLabel: string; content: React.ReactNode } {
  switch (section) {
    case 'site-identity':
      return {
        title: 'Site identity',
        description: 'Set the brand name, browser title, logo, and primary inventory label.',
        saveLabel: 'Save site identity',
        content: (
          <SiteIdentityForm content={content} mediaAssets={mediaAssets} setContent={setContent} />
        ),
      };
    case 'brand-hero':
      return {
        title: 'Brand & hero',
        description: 'Set the first impression visitors see across the public homepage.',
        saveLabel: 'Save brand & hero',
        content: (
          <BrandHeroForm content={content} mediaAssets={mediaAssets} setContent={setContent} />
        ),
      };
    case 'benefits':
      return {
        title: 'Benefits',
        description: 'Manage the trust signals and icon cards shown below the buying journey.',
        saveLabel: 'Save benefits',
        content: <BenefitsForm content={content} setContent={setContent} />,
      };
    case 'how-it-works':
      return {
        title: 'How it works',
        description: 'Explain the buying journey in a clear sequence of steps.',
        saveLabel: 'Save how it works',
        content: <HowItWorksForm content={content} setContent={setContent} />,
      };
    case 'faqs':
      return {
        title: 'Frequently asked questions',
        description: 'Answer common buyer questions without sending visitors away from the page.',
        saveLabel: 'Save FAQ',
        content: <FaqForm content={content} setContent={setContent} />,
      };
    case 'showroom':
      return {
        title: 'Showroom',
        description: 'Keep location, opening hours, contact details, and directions current.',
        saveLabel: 'Save showroom',
        content: <ShowroomForm content={content} setContent={setContent} />,
      };
    case 'about':
      return {
        title: 'About',
        description: 'Shape the confidence-building story and product preview on the homepage.',
        saveLabel: 'Save about',
        content: <AboutForm content={content} mediaAssets={mediaAssets} setContent={setContent} />,
      };
    case 'footer':
      return {
        title: 'Footer',
        description: 'Keep the footer description and contact details current.',
        saveLabel: 'Save footer',
        content: <FooterForm content={content} setContent={setContent} />,
      };
  }
}

function HomepageOverview({
  content,
  onOpenSection,
}: {
  content: AdminHomepagePayload;
  onOpenSection: (section: HomepageSection) => void;
}) {
  type EditableSection = Exclude<HomepageSection, 'overview'>;
  const [selectedSection, setSelectedSection] = useState<EditableSection>('site-identity');
  const items: Array<{
    section: EditableSection;
    detail: string;
    count: string;
    icon: typeof ImageIcon;
  }> = [
    {
      section: 'site-identity',
      detail: 'Brand name, title, logo and inventory label',
      count: 'Configured',
      icon: CircleUserRound,
    },
    {
      section: 'brand-hero',
      detail: 'Hero copy and image',
      count: 'Configured',
      icon: ImageIcon,
    },
    {
      section: 'benefits',
      detail: 'Intro copy and buyer trust cards',
      count: `${content.benefits.length}/${MAX_HOMEPAGE_BENEFITS} cards`,
      icon: ShieldCheck,
    },
    {
      section: 'how-it-works',
      detail: 'Buying journey and step-by-step guidance',
      count: `${content.steps.length} steps`,
      icon: Route,
    },
    {
      section: 'faqs',
      detail: 'Questions and answers',
      count: `${content.faqs.length} questions`,
      icon: MessageCircleQuestion,
    },
    {
      section: 'showroom',
      detail: 'Location, hours, phone and directions',
      count: 'Configured',
      icon: MapPinned,
    },
    {
      section: 'about',
      detail: 'Confidence story, checklist and product preview',
      count: 'Configured',
      icon: CircleUserRound,
    },
    {
      section: 'footer',
      detail: 'Description, email and phone number',
      count: 'Configured',
      icon: Mail,
    },
  ];
  const selectedItem = items.find((item) => item.section === selectedSection) ?? items[0];
  const completedCount = items.filter((item) =>
    isHomepageOverviewSectionComplete(item.section, content),
  ).length;
  const isPublishReady = completedCount === items.length;

  return (
    <div className="admin-workspace-stack admin-progress-canvas">
      <div className="admin-workspace-intro admin-overview-intro admin-progress-canvas-heading">
        <div>
          <p className="admin-kicker">WEBSITE CONTENT</p>
          <h2>Homepage overview</h2>
          <p>
            Create, review and publish each section of your homepage. Keep your content consistent
            and on-brand.
          </p>
        </div>
        <div className="admin-progress-canvas-heading-actions">
          <div
            className={`admin-progress-ready-badge ${isPublishReady ? 'is-ready' : 'is-attention'}`}
          >
            <span className="admin-status-dot" />
            {isPublishReady ? 'Publish-ready' : 'Needs attention'}
          </div>
          <small>
            {completedCount} of {items.length} sections complete
          </small>
        </div>
      </div>
      <div className="admin-progress-canvas-layout">
        <aside className="admin-progress-stepper" aria-label="Homepage sections">
          <div className="admin-progress-stepper-heading">
            <strong>Homepage overview</strong>
            <span>Build and publish your homepage, section by section.</span>
          </div>
          <div className="admin-progress-stepper-list">
            {items.map((item, index) => {
              const Icon = item.icon;
              const isSelected = item.section === selectedSection;
              const isComplete = isHomepageOverviewSectionComplete(item.section, content);
              return (
                <button
                  className={`admin-progress-step ${isSelected ? 'is-selected' : ''}`}
                  type="button"
                  key={item.section}
                  aria-current={isSelected ? 'step' : undefined}
                  onClick={() => setSelectedSection(item.section)}
                >
                  <span className="admin-progress-step-index">{index + 1}</span>
                  <span className="admin-progress-step-copy">
                    <strong>{homepageSectionLabels[item.section]}</strong>
                    <small>{item.detail}</small>
                  </span>
                  {isComplete ? (
                    <CheckCircle2 className="admin-progress-step-check" size={17} />
                  ) : (
                    <Icon className="admin-progress-step-icon" size={17} />
                  )}
                </button>
              );
            })}
          </div>
          <div
            className={`admin-progress-publish-card ${isPublishReady ? 'is-ready' : 'is-attention'}`}
          >
            {isPublishReady ? (
              <CheckCircle2 size={22} aria-hidden="true" />
            ) : (
              <CircleAlert size={22} aria-hidden="true" />
            )}
            <span>
              <strong>{isPublishReady ? 'Publish-ready' : 'Review required'}</strong>
              <small>
                {isPublishReady
                  ? 'Your homepage is live and up to date.'
                  : 'Complete each section before publishing.'}
              </small>
            </span>
          </div>
        </aside>

        <section className="admin-progress-canvas-main" aria-live="polite">
          <div className="admin-progress-canvas-main-heading">
            <div>
              <span>
                Section {items.findIndex((item) => item.section === selectedSection) + 1} of{' '}
                {items.length}
              </span>
              <h3>{homepageSectionLabels[selectedSection]}</h3>
              <p>{selectedItem.detail}</p>
            </div>
            <div
              className={`admin-progress-completion-ring ${isHomepageOverviewSectionComplete(selectedSection, content) ? 'is-complete' : 'is-incomplete'}`}
              aria-label={
                isHomepageOverviewSectionComplete(selectedSection, content)
                  ? '100 percent complete'
                  : 'Needs attention'
              }
            >
              <strong>
                {isHomepageOverviewSectionComplete(selectedSection, content) ? '100%' : 'Review'}
              </strong>
              <span>
                {isHomepageOverviewSectionComplete(selectedSection, content)
                  ? 'Complete'
                  : 'Needed'}
              </span>
            </div>
          </div>
          <HomepageOverviewSelectedSection
            section={selectedSection}
            content={content}
            onOpenSection={onOpenSection}
          />
          <div className="admin-progress-other-sections">
            <div className="admin-progress-other-heading">
              <div>
                <h3>Other sections</h3>
                <p>Review the status of your remaining sections or jump in to make changes.</p>
              </div>
            </div>
            <div className="admin-progress-other-grid">
              {items
                .filter((item) => item.section !== selectedSection)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      className="admin-progress-other-card"
                      type="button"
                      key={item.section}
                      onClick={() => setSelectedSection(item.section)}
                    >
                      <span className="admin-progress-other-icon">
                        <Icon size={18} />
                      </span>
                      <span className="admin-progress-other-copy">
                        <strong>{homepageSectionLabels[item.section]}</strong>
                        <small>{item.count}</small>
                      </span>
                      <CheckCircle2 className="admin-progress-other-check" size={16} />
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  );
                })}
            </div>
          </div>
          <div className="admin-progress-activity">
            <Check size={15} aria-hidden="true" />
            <span>
              <strong>Recent activity</strong> Homepage content is live and ready for visitors.
            </span>
            <span className="admin-progress-activity-link">
              View all activity <ArrowRight size={14} />
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function isHomepageOverviewSectionComplete(
  section: Exclude<HomepageSection, 'overview'>,
  content: AdminHomepagePayload,
): boolean {
  const hasValues = (values: string[]) => values.every((value) => value.trim().length > 0);

  switch (section) {
    case 'site-identity':
      return hasValues([
        content.site.brandName,
        content.site.title,
        content.site.brandMark,
        content.site.inventoryCtaLabel,
      ]);
    case 'brand-hero':
      return hasValues([
        content.hero.description,
        content.hero.imageUrl,
        content.hero.titleLines.join(' '),
      ]);
    case 'benefits':
      return content.benefits.length > 0;
    case 'how-it-works':
      return content.steps.length > 0;
    case 'faqs':
      return content.faqs.length > 0;
    case 'showroom':
      return hasValues([
        content.showroom.location,
        content.showroom.openingHours,
        content.showroom.phone,
      ]);
    case 'about':
      return hasValues([
        content.about.title,
        content.about.description,
        content.about.preview.imageUrl,
      ]);
    case 'footer':
      return hasValues([content.footer.description, content.footer.email, content.footer.phone]);
  }
}

function HomepageOverviewSelectedSection({
  section,
  content,
  onOpenSection,
}: {
  section: Exclude<HomepageSection, 'overview'>;
  content: AdminHomepagePayload;
  onOpenSection: (section: HomepageSection) => void;
}) {
  const summaryRows = getHomepageOverviewSummaryRows(section, content);
  const imageUrl =
    section === 'brand-hero'
      ? content.hero.imageUrl
      : section === 'about'
        ? content.about.preview.imageUrl
        : '';
  const title =
    section === 'brand-hero'
      ? content.hero.titleLines.join(' ')
      : getHomepageOverviewPreviewTitle(section, content);

  return (
    <div className="admin-progress-selected-section">
      <div className="admin-progress-selected-preview">
        {imageUrl ? (
          <img src={resolveMediaUrl(imageUrl)} alt="" />
        ) : (
          <div className={`admin-progress-selected-placeholder is-${section}`} aria-hidden="true">
            {getHomepageOverviewIcon(section, 52)}
          </div>
        )}
        <div className="admin-progress-selected-preview-copy">
          <span>
            {section === 'brand-hero' ? content.hero.eyebrow : homepageSectionLabels[section]}
          </span>
          <strong>{title}</strong>
          <small>{getHomepageOverviewPreviewDescription(section, content)}</small>
        </div>
      </div>
      <div className="admin-progress-content-summary">
        <div className="admin-progress-content-summary-heading">
          <strong>Content summary</strong>
          <button type="button" onClick={() => onOpenSection(section)}>
            <span>Edit section</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
        <div className="admin-progress-summary-list">
          {summaryRows.map((row) => (
            <div className="admin-progress-summary-row" key={row.label}>
              <span className="admin-progress-summary-icon">{row.icon}</span>
              <strong>{row.label}</strong>
              <span>{row.value}</span>
              <CheckCircle2 size={16} aria-label="Complete" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getHomepageOverviewIcon(section: Exclude<HomepageSection, 'overview'>, size: number) {
  const Icon = {
    'site-identity': CircleUserRound,
    'brand-hero': ImageIcon,
    benefits: ShieldCheck,
    'how-it-works': Route,
    faqs: MessageCircleQuestion,
    showroom: MapPinned,
    about: CircleUserRound,
    footer: Mail,
  }[section];
  return <Icon size={size} strokeWidth={1.6} />;
}

function getHomepageOverviewPreviewTitle(
  section: Exclude<HomepageSection, 'overview'>,
  content: AdminHomepagePayload,
): string {
  switch (section) {
    case 'site-identity':
      return content.site.title;
    case 'benefits':
      return content.benefitsIntro.title;
    case 'how-it-works':
      return content.howItWorks.title;
    case 'faqs':
      return content.faq.title;
    case 'showroom':
      return content.showroom.title;
    case 'about':
      return content.about.title;
    case 'footer':
      return content.footer.description;
    case 'brand-hero':
      return content.hero.titleLines.join(' ');
  }
}

function getHomepageOverviewPreviewDescription(
  section: Exclude<HomepageSection, 'overview'>,
  content: AdminHomepagePayload,
): string {
  switch (section) {
    case 'site-identity':
      return `${content.site.brandName} · ${content.site.inventoryCtaLabel}`;
    case 'brand-hero':
      return content.hero.description;
    case 'benefits':
      return `${content.benefits.length} buyer trust cards configured.`;
    case 'how-it-works':
      return `${content.steps.length} steps guide visitors through the buying journey.`;
    case 'faqs':
      return `${content.faqs.length} questions answered for buyers.`;
    case 'showroom':
      return `${content.showroom.location} · ${content.showroom.openingHours}`;
    case 'about':
      return content.about.description;
    case 'footer':
      return `${content.footer.email} · ${content.footer.phone}`;
  }
}

function getHomepageOverviewSummaryRows(
  section: Exclude<HomepageSection, 'overview'>,
  content: AdminHomepagePayload,
): Array<{ label: string; value: string; icon: React.ReactNode }> {
  switch (section) {
    case 'site-identity':
      return [
        { label: 'Brand name', value: content.site.brandName, icon: <CircleUserRound size={16} /> },
        { label: 'Site title', value: content.site.title, icon: <Info size={16} /> },
        {
          label: 'Brand logo',
          value: content.site.brandMark ? 'Configured' : 'Missing',
          icon: <ImageIcon size={16} />,
        },
        {
          label: 'Inventory button',
          value: content.site.inventoryCtaLabel,
          icon: <ArrowRight size={16} />,
        },
      ];
    case 'brand-hero':
      return [
        {
          label: 'Hero image',
          value: content.hero.imageUrl ? 'Uploaded' : 'Missing',
          icon: <ImageIcon size={16} />,
        },
        { label: 'Headline', value: content.hero.titleLines.join(' '), icon: <Info size={16} /> },
        { label: 'Subheadline', value: content.hero.description, icon: <FileText size={16} /> },
        { label: 'Primary button', value: content.hero.cta.label, icon: <ArrowRight size={16} /> },
      ];
    case 'benefits':
      return [
        { label: 'Intro title', value: content.benefitsIntro.title, icon: <Info size={16} /> },
        {
          label: 'Trust cards',
          value: `${content.benefits.length}/${MAX_HOMEPAGE_BENEFITS} configured`,
          icon: <ShieldCheck size={16} />,
        },
        {
          label: 'Active content',
          value: 'Published to homepage',
          icon: <CheckCircle2 size={16} />,
        },
      ];
    case 'how-it-works':
      return [
        { label: 'Journey title', value: content.howItWorks.title, icon: <Info size={16} /> },
        {
          label: 'Steps',
          value: `${content.steps.length} steps configured`,
          icon: <Route size={16} />,
        },
        { label: 'Guidance', value: content.howItWorks.description, icon: <FileText size={16} /> },
      ];
    case 'faqs':
      return [
        { label: 'FAQ title', value: content.faq.title, icon: <Info size={16} /> },
        {
          label: 'Questions',
          value: `${content.faqs.length} questions configured`,
          icon: <MessageCircleQuestion size={16} />,
        },
        {
          label: 'Public status',
          value: 'Published to homepage',
          icon: <CheckCircle2 size={16} />,
        },
      ];
    case 'showroom':
      return [
        { label: 'Location', value: content.showroom.location, icon: <MapPinned size={16} /> },
        { label: 'Opening hours', value: content.showroom.openingHours, icon: <Info size={16} /> },
        { label: 'Phone', value: content.showroom.phone, icon: <Mail size={16} /> },
        { label: 'Directions', value: content.showroom.mapLabel, icon: <ArrowRight size={16} /> },
      ];
    case 'about':
      return [
        { label: 'Story title', value: content.about.title, icon: <Info size={16} /> },
        {
          label: 'Checklist',
          value: `${content.about.checklist.length} confidence points`,
          icon: <CheckCircle2 size={16} />,
        },
        {
          label: 'Product preview',
          value: content.about.preview.vehicleName,
          icon: <ImageIcon size={16} />,
        },
      ];
    case 'footer':
      return [
        { label: 'Description', value: content.footer.description, icon: <FileText size={16} /> },
        { label: 'Email', value: content.footer.email, icon: <Mail size={16} /> },
        { label: 'Phone number', value: content.footer.phone, icon: <Info size={16} /> },
      ];
  }
}

function SiteIdentityForm({
  content,
  mediaAssets,
  setContent,
}: {
  content: AdminHomepagePayload;
  mediaAssets: MediaAsset[];
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>;
}) {
  return (
    <section className="admin-homepage-form-card admin-brand-hero-card admin-editor-card admin-modern-card">
      <header className="admin-brand-hero-card-heading">
        <span className="admin-brand-hero-card-icon" aria-hidden="true">
          <CircleUserRound size={19} strokeWidth={1.8} />
        </span>
        <div>
          <p className="admin-kicker">SITE IDENTITY</p>
          <h3>Make the brand unmistakable</h3>
          <p>Your brand name, title, logo, and inventory label appear across the public site.</p>
        </div>
      </header>

      <div className="admin-form-grid admin-brand-hero-grid">
        <AdminTextField
          label="Brand name"
          value={content.site.brandName}
          required
          onChange={(value) =>
            setContent((current) => ({ ...current, site: { ...current.site, brandName: value } }))
          }
        />
        <AdminTextField
          label="Site title"
          value={content.site.title}
          required
          onChange={(value) =>
            setContent((current) => ({ ...current, site: { ...current.site, title: value } }))
          }
        />
        <MediaPicker
          label="Brand logo"
          recommendation="Recommended: 1024 × 1024 px · transparent PNG/WebP"
          value={content.site.brandMark}
          alt={`${content.site.brandName} logo`}
          assets={mediaAssets}
          required
          onChange={(brandMark) =>
            setContent((current) => ({ ...current, site: { ...current.site, brandMark } }))
          }
        />
        <AdminTextField
          label="Inventory button label"
          value={content.site.inventoryCtaLabel}
          required
          onChange={(value) =>
            setContent((current) => ({
              ...current,
              site: { ...current.site, inventoryCtaLabel: value },
            }))
          }
        />
      </div>
    </section>
  );
}

function BrandHeroForm({
  content,
  mediaAssets,
  setContent,
}: {
  content: AdminHomepagePayload;
  mediaAssets: MediaAsset[];
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>;
}) {
  return (
    <section className="admin-homepage-form-card admin-brand-hero-card admin-editor-card admin-modern-card">
      <header className="admin-brand-hero-card-heading">
        <span className="admin-brand-hero-card-icon" aria-hidden="true">
          <ImageIcon size={19} strokeWidth={1.8} />
        </span>
        <div>
          <p className="admin-kicker">HERO CONTENT</p>
          <h3>Manage your first impression</h3>
          <p>Set the copy and image visitors see when they arrive on your homepage.</p>
        </div>
      </header>

      <div className="admin-brand-hero-section">
        <div className="admin-brand-hero-section-heading">
          <span className="admin-brand-hero-section-icon" aria-hidden="true">
            <ImageIcon size={17} strokeWidth={1.8} />
          </span>
          <div>
            <p className="admin-kicker">HERO CONTENT</p>
            <h4>The first impression</h4>
            <p>Set the copy and image visitors see when they arrive on your homepage.</p>
          </div>
        </div>
        <div className="admin-form-grid admin-brand-hero-grid">
          <AdminTextField
            label="Eyebrow"
            value={content.hero.eyebrow}
            required
            onChange={(value) =>
              setContent((current) => ({ ...current, hero: { ...current.hero, eyebrow: value } }))
            }
          />
          <AdminTextField
            label="Image alt text"
            value={content.hero.imageAlt}
            required
            onChange={(value) =>
              setContent((current) => ({ ...current, hero: { ...current.hero, imageAlt: value } }))
            }
          />
          <AdminTextArea
            label="Title lines (one per line)"
            value={content.hero.titleLines.join('\n')}
            required
            onChange={(value) =>
              setContent((current) => ({
                ...current,
                hero: {
                  ...current.hero,
                  titleLines: value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                },
              }))
            }
          />
          <AdminTextArea
            label="Description"
            value={content.hero.description}
            required
            onChange={(value) =>
              setContent((current) => ({
                ...current,
                hero: { ...current.hero, description: value },
              }))
            }
          />
        </div>
        <MediaPicker
          label="Hero image"
          recommendation="Recommended: 1600 × 1000 px · WebP"
          value={content.hero.imageUrl}
          alt={content.hero.imageAlt}
          assets={mediaAssets}
          required
          onChange={(imageUrl) =>
            setContent((current) => ({ ...current, hero: { ...current.hero, imageUrl } }))
          }
        />
      </div>
    </section>
  );
}

function BenefitsForm({
  content,
  setContent,
}: {
  content: AdminHomepagePayload;
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>;
}) {
  const [activeBenefitId, setActiveBenefitId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleBenefitDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveBenefitId(null);
    if (!over || active.id === over.id) return;

    setContent((current) => {
      const oldIndex = current.benefits.findIndex(
        (benefit) => `benefit:${benefit.id}` === active.id,
      );
      const newIndex = current.benefits.findIndex((benefit) => `benefit:${benefit.id}` === over.id);

      if (oldIndex < 0 || newIndex < 0) return current;

      return {
        ...current,
        benefits: arrayMove(current.benefits, oldIndex, newIndex).map((benefit, index) => ({
          ...benefit,
          displayOrder: index,
        })),
      };
    });
  };

  return (
    <HomepageFormCard
      icon={ShieldCheck}
      eyebrow="BENEFITS"
      title="Build buyer confidence"
      description="Shape the trust signals visitors see while they explore your homepage."
    >
      <HomepageFormSection icon={Info} eyebrow="SECTION INTRO" title="Benefits heading">
        <IntroFields
          value={content.benefitsIntro}
          onChange={(benefitsIntro) => setContent((current) => ({ ...current, benefitsIntro }))}
        />
      </HomepageFormSection>
      <HomepageFormSection
        icon={ShieldCheck}
        eyebrow="TRUST SIGNALS"
        title="Benefit cards"
        className="admin-benefits-form-section"
        description={`Add up to ${MAX_HOMEPAGE_BENEFITS} cards to keep the homepage section balanced.`}
      >
        <p className="admin-benefits-note" role="note">
          <Info size={15} aria-hidden="true" />
          <span>
            Keep this section to six benefits or fewer. Shorter lists stay easier for buyers to scan
            on desktop and mobile.
          </span>
        </p>
        <div className="admin-benefits-list-heading">
          <span>Benefit cards</span>
          <span>
            <GripVertical size={15} aria-hidden="true" /> Drag to reorder
          </span>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }: DragStartEvent) => setActiveBenefitId(String(active.id))}
          onDragEnd={handleBenefitDragEnd}
          onDragCancel={() => setActiveBenefitId(null)}
        >
          <SortableContext
            items={content.benefits.map((benefit) => `benefit:${benefit.id}`)}
            strategy={rectSortingStrategy}
          >
            <div className="admin-repeater-list admin-benefits-grid">
              {content.benefits.map((benefit, index) => (
                <SortableBenefitCard
                  key={benefit.id}
                  benefit={benefit}
                  index={index}
                  setContent={setContent}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeBenefitId ? (
              <div className="admin-benefit-drag-overlay">Moving benefit</div>
            ) : null}
          </DragOverlay>
        </DndContext>
        <button
          className={`admin-secondary-button admin-add-button${
            content.benefits.length >= MAX_HOMEPAGE_BENEFITS ? ' is-limit-reached' : ''
          }`}
          type="button"
          onClick={() => addBenefit(content, setContent)}
          disabled={content.benefits.length >= MAX_HOMEPAGE_BENEFITS}
        >
          <Plus size={16} />
          {content.benefits.length >= MAX_HOMEPAGE_BENEFITS
            ? 'Maximum of 6 benefits reached'
            : 'Add benefit'}
        </button>
      </HomepageFormSection>
    </HomepageFormCard>
  );
}

function SortableBenefitCard({
  benefit,
  index,
  setContent,
}: {
  benefit: HomepageContent['benefits'][number];
  index: number;
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>;
}) {
  const sortable = useSortable({ id: `benefit:${benefit.id}` });

  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={`admin-modern-repeater admin-benefit-repeater${
        sortable.isDragging ? ' is-dragging' : ''
      }`}
    >
      <button
        className="admin-drag-handle admin-benefit-drag-handle"
        type="button"
        aria-label={`Drag benefit ${index + 1} to reorder`}
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <GripVertical size={16} />
      </button>
      <span className="admin-modern-repeater-index">{String(index + 1).padStart(2, '0')}</span>
      <div className="admin-modern-repeater-fields">
        <div className="admin-field">
          <span>Icon</span>
          <IconPicker
            value={benefit.iconKey}
            onChange={(iconKey) => updateBenefit(setContent, index, 'iconKey', iconKey)}
          />
        </div>
        <AdminTextField
          label="Title"
          value={benefit.title}
          onChange={(title) => updateBenefit(setContent, index, 'title', title)}
        />
        <AdminTextArea
          label="Description"
          value={benefit.description}
          onChange={(description) => updateBenefit(setContent, index, 'description', description)}
        />
        <div className="admin-field">
          <span>Tone</span>
          <TonePicker
            value={benefit.tone}
            onChange={(tone) => updateBenefit(setContent, index, 'tone', tone)}
          />
        </div>
      </div>
      <button
        className="admin-icon-button danger"
        type="button"
        aria-label={`Remove benefit ${index + 1}`}
        onClick={() =>
          setContent((current) => ({
            ...current,
            benefits: current.benefits.filter((_, itemIndex) => itemIndex !== index),
          }))
        }
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function HowItWorksForm({
  content,
  setContent,
}: {
  content: AdminHomepagePayload;
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>;
}) {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleStepDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveStepId(null);
    if (!over || active.id === over.id) return;

    setContent((current) => {
      const oldIndex = current.steps.findIndex((step) => `step:${step.id}` === active.id);
      const newIndex = current.steps.findIndex((step) => `step:${step.id}` === over.id);

      if (oldIndex < 0 || newIndex < 0) return current;

      return {
        ...current,
        steps: arrayMove(current.steps, oldIndex, newIndex).map((step, index) => ({
          ...step,
          displayOrder: index,
        })),
      };
    });
  };

  return (
    <HomepageFormCard
      icon={Route}
      eyebrow="HOW IT WORKS"
      title="Guide the buying journey"
      description="Explain the path from first visit to confident purchase in a clear sequence."
    >
      <HomepageFormSection icon={Info} eyebrow="SECTION INTRO" title="How it works heading">
        <IntroFields
          value={content.howItWorks}
          onChange={(howItWorks) => setContent((current) => ({ ...current, howItWorks }))}
        />
      </HomepageFormSection>
      <HomepageFormSection
        icon={Route}
        eyebrow="BUYING JOURNEY"
        title="Steps"
        className="admin-steps-form-section"
        description="Keep the sequence short and easy to scan."
      >
        <div className="admin-benefits-list-heading admin-steps-list-heading">
          <span>Journey steps</span>
          <span>
            <GripVertical size={15} aria-hidden="true" /> Drag to reorder
          </span>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }: DragStartEvent) => setActiveStepId(String(active.id))}
          onDragEnd={handleStepDragEnd}
          onDragCancel={() => setActiveStepId(null)}
        >
          <SortableContext
            items={content.steps.map((step) => `step:${step.id}`)}
            strategy={rectSortingStrategy}
          >
            <div className="admin-repeater-list admin-steps-grid">
              {content.steps.map((step, index) => (
                <SortableStepCard key={step.id} step={step} index={index} setContent={setContent} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeStepId ? <div className="admin-step-drag-overlay">Moving step</div> : null}
          </DragOverlay>
        </DndContext>
        <button
          className="admin-secondary-button admin-add-button"
          type="button"
          onClick={() => addStep(content, setContent)}
          disabled={content.steps.length >= 20}
        >
          <Plus size={16} /> Add step
        </button>
      </HomepageFormSection>
    </HomepageFormCard>
  );
}

function SortableStepCard({
  step,
  index,
  setContent,
}: {
  step: HomepageContent['steps'][number];
  index: number;
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>;
}) {
  const sortable = useSortable({ id: `step:${step.id}` });

  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={`admin-modern-repeater admin-step-repeater${
        sortable.isDragging ? ' is-dragging' : ''
      }`}
    >
      <button
        className="admin-drag-handle admin-step-drag-handle"
        type="button"
        aria-label={`Drag step ${index + 1} to reorder`}
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <GripVertical size={16} />
      </button>
      <span className="admin-modern-repeater-index">{String(index + 1).padStart(2, '0')}</span>
      <div className="admin-modern-repeater-fields">
        <div className="admin-field">
          <span>Icon</span>
          <IconPicker
            value={step.iconKey}
            onChange={(iconKey) => updateStep(setContent, index, 'iconKey', iconKey)}
          />
        </div>
        <AdminTextField
          label="Step number"
          value={step.number}
          onChange={(number) => updateStep(setContent, index, 'number', number)}
        />
        <AdminTextField
          label="Title"
          value={step.title}
          onChange={(title) => updateStep(setContent, index, 'title', title)}
        />
        <AdminTextArea
          label="Description"
          value={step.description}
          onChange={(description) => updateStep(setContent, index, 'description', description)}
        />
      </div>
      <button
        className="admin-icon-button danger"
        type="button"
        aria-label={`Remove step ${index + 1}`}
        onClick={() =>
          setContent((current) => ({
            ...current,
            steps: current.steps.filter((_, itemIndex) => itemIndex !== index),
          }))
        }
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function FaqForm({
  content,
  setContent,
}: {
  content: AdminHomepagePayload;
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>;
}) {
  return (
    <HomepageFormCard
      icon={MessageCircleQuestion}
      eyebrow="FAQS"
      title="Answer buyer questions"
      description="Give visitors the clarity they need without sending them away from the page."
    >
      <HomepageFormSection icon={Info} eyebrow="SECTION INTRO" title="FAQ heading">
        <IntroFields
          value={content.faq}
          onChange={(faq) => setContent((current) => ({ ...current, faq }))}
        />
      </HomepageFormSection>
      <HomepageFormSection
        icon={MessageCircleQuestion}
        eyebrow="BUYER QUESTIONS"
        title="Questions and answers"
      >
        <div className="admin-repeater-list">
          {content.faqs.map((faq, index) => (
            <div className="admin-modern-repeater" key={faq.id ?? `faq-${index}`}>
              <span className="admin-modern-repeater-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="admin-modern-repeater-fields">
                <AdminTextField
                  label="Question"
                  value={faq.question}
                  onChange={(question) => updateFaq(setContent, index, 'question', question)}
                />
                <AdminTextArea
                  label="Answer"
                  value={faq.answer}
                  onChange={(answer) => updateFaq(setContent, index, 'answer', answer)}
                />
              </div>
              <button
                className="admin-icon-button danger"
                type="button"
                aria-label={`Remove FAQ ${index + 1}`}
                onClick={() =>
                  setContent((current) => ({
                    ...current,
                    faqs: current.faqs.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          className="admin-secondary-button admin-add-button"
          type="button"
          onClick={() => addFaq(content, setContent)}
        >
          <Plus size={16} /> Add FAQ
        </button>
      </HomepageFormSection>
    </HomepageFormCard>
  );
}

function ShowroomForm({
  content,
  setContent,
}: {
  content: AdminHomepagePayload;
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>;
}) {
  const showroom = content.showroom;
  const set = (field: keyof typeof showroom, value: string | number) =>
    setContent((current) => ({ ...current, showroom: { ...current.showroom, [field]: value } }));
  return (
    <HomepageFormCard
      icon={MapPinned}
      eyebrow="SHOWROOM"
      title="Make your showroom easy to visit"
      description="Keep your location, opening hours, contact details, and directions current."
    >
      <HomepageFormSection icon={MapPinned} eyebrow="SHOWROOM DETAILS" title="Visit us in person">
        <div className="admin-form-grid">
          {(
            [
              'eyebrow',
              'title',
              'location',
              'openingHours',
              'sundayHours',
              'phone',
              'phoneHref',
              'mapLabel',
            ] as const
          ).map((field) => (
            <AdminTextField
              key={field}
              label={humanize(field)}
              value={showroom[field]}
              prefix={field === 'phoneHref' ? 'tel:' : undefined}
              required
              onChange={(value) => set(field, value)}
            />
          ))}
          <AdminTextArea
            label="Description"
            value={showroom.description}
            required
            onChange={(description) => set('description', description)}
          />
          <AdminTextField
            label="Map area"
            value={showroom.mapArea}
            required
            onChange={(mapArea) => set('mapArea', mapArea)}
          />
          <AdminTextField
            label="Directions URL"
            value={showroom.directionsUrl}
            required
            onChange={(directionsUrl) => set('directionsUrl', directionsUrl)}
          />
        </div>
      </HomepageFormSection>
    </HomepageFormCard>
  );
}

function AboutForm({
  content,
  mediaAssets,
  setContent,
}: {
  content: AdminHomepagePayload;
  mediaAssets: MediaAsset[];
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>;
}) {
  const about = content.about;
  const set = (field: keyof typeof about, value: unknown) =>
    setContent((current) => ({ ...current, about: { ...current.about, [field]: value } }));
  const setPreview = (field: keyof typeof about.preview, value: string) =>
    setContent((current) => ({
      ...current,
      about: { ...current.about, preview: { ...current.about.preview, [field]: value } },
    }));
  return (
    <HomepageFormCard
      icon={CircleUserRound}
      eyebrow="ABOUT"
      title="Build confidence beyond the listing"
      description="Shape the story, checklist, and product preview that support the buying decision."
    >
      <HomepageFormSection icon={CircleUserRound} eyebrow="ABOUT INTRO" title="Confidence story">
        <div className="admin-form-grid">
          <AdminTextField
            label="Eyebrow"
            value={about.eyebrow}
            required
            onChange={(value) => set('eyebrow', value)}
          />
          <AdminTextField
            label="Title"
            value={about.title}
            required
            onChange={(value) => set('title', value)}
          />
          <AdminTextArea
            label="Description"
            value={about.description}
            required
            onChange={(value) => set('description', value)}
          />
        </div>
        <StringListEditor
          label="Checklist"
          values={about.checklist}
          onChange={(checklist) => set('checklist', checklist)}
        />
      </HomepageFormSection>
      <HomepageFormSection icon={ImageIcon} eyebrow="PREVIEW CARD" title="Product preview">
        <div className="admin-form-grid">
          {(
            [
              'appointmentDuration',
              'appointmentLabel',
              'appointmentTime',
              'savedVehicleLabel',
              'vehicleName',
              'mileageLabel',
              'mileage',
              'priceLabel',
              'price',
              'inspectionLabel',
              'inspection',
              'enquiryLabel',
            ] as const
          ).map((field) => (
            <AdminTextField
              key={field}
              label={humanize(field)}
              value={about.preview[field]}
              required
              onChange={(value) => setPreview(field, value)}
            />
          ))}
        </div>
        <MediaPicker
          label="Preview image"
          recommendation="Recommended: 1200 × 800 px · WebP"
          value={about.preview.imageUrl}
          alt={about.preview.imageAlt}
          assets={mediaAssets}
          required
          onChange={(imageUrl) => setPreview('imageUrl', imageUrl)}
        />
        <AdminTextField
          label="Preview image alt text"
          value={about.preview.imageAlt}
          required
          onChange={(value) => setPreview('imageAlt', value)}
        />
      </HomepageFormSection>
    </HomepageFormCard>
  );
}

function FooterForm({
  content,
  setContent,
}: {
  content: AdminHomepagePayload;
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>;
}) {
  const footer = content.footer;
  const set = (field: keyof typeof footer, value: string) =>
    setContent((current) => ({ ...current, footer: { ...current.footer, [field]: value } }));

  return (
    <HomepageFormCard
      icon={Mail}
      eyebrow="FOOTER"
      title="Keep your contact details current"
      description="Make it easy for visitors to find the right way to contact your showroom."
    >
      <HomepageFormSection icon={Mail} eyebrow="FOOTER CONTENT" title="Footer details">
        <div className="admin-form-grid">
          <AdminTextArea
            label="Description"
            value={footer.description}
            required
            onChange={(description) => set('description', description)}
          />
          <AdminTextField
            label="Email"
            value={footer.email}
            required
            onChange={(email) => set('email', email)}
          />
          <AdminTextField
            label="Phone number"
            value={footer.phone}
            required
            onChange={(phone) => set('phone', phone)}
          />
        </div>
      </HomepageFormSection>
    </HomepageFormCard>
  );
}

function HomepageFormCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: typeof ImageIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-homepage-form-card admin-editor-card admin-modern-card">
      <header className="admin-homepage-form-card-heading">
        <span className="admin-homepage-form-card-icon" aria-hidden="true">
          <Icon size={19} strokeWidth={1.8} />
        </span>
        <div>
          <p className="admin-kicker">{eyebrow}</p>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function HomepageFormSection({
  icon: Icon,
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  icon: typeof ImageIcon;
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`admin-homepage-form-section${className ? ` ${className}` : ''}`}>
      <div className="admin-homepage-form-section-heading">
        <span className="admin-homepage-form-section-icon" aria-hidden="true">
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <div>
          <p className="admin-kicker">{eyebrow}</p>
          <h4>{title}</h4>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function IntroFields({
  value,
  onChange,
}: {
  value: HomepageContent['howItWorks'];
  onChange: (value: HomepageContent['howItWorks']) => void;
}) {
  return (
    <div className="admin-form-grid">
      <AdminTextField
        label="Eyebrow"
        value={value.eyebrow}
        onChange={(eyebrow) => onChange({ ...value, eyebrow })}
      />
      <AdminTextField
        label="Title"
        value={value.title}
        onChange={(title) => onChange({ ...value, title })}
      />
      <AdminTextArea
        label="Description"
        value={value.description}
        onChange={(description) => onChange({ ...value, description })}
      />
    </div>
  );
}

function MediaPicker({
  label,
  recommendation,
  value,
  alt,
  assets,
  onChange,
  required = false,
}: {
  label: string;
  recommendation: string;
  value: string;
  alt: string;
  assets: MediaAsset[];
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const selectedAsset = assets.find((asset) => asset.url === value);
  const hasImageValue =
    value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://');
  const emptyLabel = label.toLowerCase().includes('logo')
    ? 'Select an uploaded logo'
    : 'Select an uploaded image';
  const selectedName = selectedAsset
    ? compactMediaName(mediaFileName(selectedAsset))
    : hasImageValue
      ? 'Current image'
      : emptyLabel;

  const options: AdminDropdownOption[] = assets.map((asset) => ({
    value: asset.url,
    label: compactMediaName(mediaFileName(asset)),
    description: `${asset.width} × ${asset.height} · WebP`,
    startAdornment: (
      <span className="admin-media-option-thumb">
        <img src={resolveMediaUrl(asset.url)} alt="" />
      </span>
    ),
  }));

  return (
    <div className="admin-media-picker">
      <div className="admin-media-picker-control">
        <span className="admin-media-picker-label">
          {label}
          {required ? (
            <span className="admin-required-mark" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </span>
        <span className="admin-media-picker-recommendation">{recommendation}</span>
        <AdminDropdown
          className="admin-media-dropdown"
          value={value}
          options={options}
          placeholder={selectedName}
          ariaLabel={`${label} options`}
          required={required}
          onChange={onChange}
          renderValue={(option) => (
            <span className="admin-dropdown-rich-value">
              <span className="admin-media-picker-thumb">
                {hasImageValue ? (
                  <img src={resolveMediaUrl(value)} alt={alt} />
                ) : (
                  <ImageIcon size={19} aria-hidden="true" />
                )}
              </span>
              <span className="admin-media-picker-copy">
                <strong>{option?.label ?? selectedName}</strong>
                <small>
                  {selectedAsset
                    ? `${selectedAsset.width} × ${selectedAsset.height} · WebP`
                    : 'Use the current image'}
                </small>
              </span>
            </span>
          )}
        />
      </div>
      {hasImageValue ? (
        <div className="admin-inline-image-preview">
          <img src={resolveMediaUrl(value)} alt={alt} />
          <span>Selected preview</span>
        </div>
      ) : null}
    </div>
  );
}

function compactMediaName(name: string): string {
  return name.length > 30 ? `${name.slice(0, 13)}…${name.slice(-13)}` : name;
}

function StringListEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="admin-list-editor">
      <div className="admin-list-editor-heading">
        <span>{label}</span>
        <button
          className="admin-secondary-button admin-add-button"
          type="button"
          onClick={() => onChange([...values, 'New checklist item'])}
        >
          <Plus size={14} /> Add item
        </button>
      </div>
      {values.map((value, index) => (
        <div className="admin-link-row" key={`checklist-${index}`}>
          <input
            aria-label={`${label} item ${index + 1}`}
            value={value}
            onChange={(event) =>
              onChange(
                values.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
              )
            }
          />
          <button
            className="admin-icon-button danger"
            type="button"
            aria-label={`Remove ${label} item ${index + 1}`}
            onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

function updateBenefit<T extends keyof HomepageContent['benefits'][number]>(
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>,
  index: number,
  field: T,
  value: HomepageContent['benefits'][number][T],
) {
  setContent((current) => ({
    ...current,
    benefits: current.benefits.map((benefit, benefitIndex) =>
      benefitIndex === index ? { ...benefit, [field]: value } : benefit,
    ),
  }));
}

function updateStep<T extends keyof HomepageContent['steps'][number]>(
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>,
  index: number,
  field: T,
  value: HomepageContent['steps'][number][T],
) {
  setContent((current) => ({
    ...current,
    steps: current.steps.map((step, stepIndex) =>
      stepIndex === index ? { ...step, [field]: value } : step,
    ),
  }));
}

function updateFaq<T extends keyof HomepageContent['faqs'][number]>(
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>,
  index: number,
  field: T,
  value: HomepageContent['faqs'][number][T],
) {
  setContent((current) => ({
    ...current,
    faqs: current.faqs.map((faq, faqIndex) =>
      faqIndex === index ? { ...faq, [field]: value } : faq,
    ),
  }));
}

function addBenefit(
  content: AdminHomepagePayload,
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>,
) {
  if (content.benefits.length >= MAX_HOMEPAGE_BENEFITS) return;

  setContent((current) => ({
    ...current,
    benefits: [
      ...current.benefits,
      {
        id: `benefit-${Date.now()}`,
        iconKey: 'support',
        title: 'New benefit',
        description: 'Add a concise buyer benefit.',
        tone: 'mint',
        displayOrder: content.benefits.length,
        isActive: true,
      },
    ],
  }));
}

function addStep(
  content: AdminHomepagePayload,
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>,
) {
  setContent((current) => ({
    ...current,
    steps: [
      ...current.steps,
      {
        id: `step-${Date.now()}`,
        number: String(current.steps.length + 1).padStart(2, '0'),
        title: 'New step',
        description: 'Add a clear explanation.',
        iconKey: 'support',
        displayOrder: content.steps.length,
        isActive: true,
      },
    ],
  }));
}

function addFaq(
  content: AdminHomepagePayload,
  setContent: React.Dispatch<React.SetStateAction<AdminHomepagePayload>>,
) {
  setContent((current) => ({
    ...current,
    faqs: [
      ...current.faqs,
      {
        id: `faq-${Date.now()}`,
        question: 'New question',
        answer: 'Add a helpful answer.',
        displayOrder: content.faqs.length,
        isActive: true,
      },
    ],
  }));
}

function humanize(value: string): string {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase());
}

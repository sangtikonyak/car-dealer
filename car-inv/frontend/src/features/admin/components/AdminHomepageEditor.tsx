import { Plus, Save, Trash2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getHomepageIcon, homepageIconRegistry } from '../../homepage/iconRegistry';
import type { HomepageContent } from '../../homepage/types';
import {
  updateAdminHomepageBenefits,
  updateAdminHomepageFaqs,
  updateAdminHomepageIdentity,
} from '../api';
import { frontendEnvironment } from '../../../config/env';
import type { MediaAsset } from '../types';
import { useSnackbar } from '../../../components/Snackbar';
import { AdminDropdown, type AdminDropdownOption } from './AdminDropdown';

const iconKeys = Object.keys(
  homepageIconRegistry,
) as HomepageContent['benefits'][number]['iconKey'][];
const toneOptions = [
  { value: 'mint', label: 'Mint' },
  { value: 'rose', label: 'Rose' },
  { value: 'blue', label: 'Blue' },
  { value: 'sand', label: 'Sand' },
] as const satisfies ReadonlyArray<{
  value: HomepageContent['benefits'][number]['tone'];
  label: string;
}>;

const mediaOrigin = (): string => {
  const apiUrl = new URL(frontendEnvironment.VITE_API_BASE_URL);
  return `${apiUrl.protocol}//${apiUrl.host}`;
};

export const resolveMediaUrl = (url: string): string =>
  url.startsWith('/uploads/') ? `${mediaOrigin()}${url}` : url;

export const mediaFileName = (asset: MediaAsset): string => asset.url.split('/').pop() ?? asset.url;

export function AdminHomepageEditor({
  initialContent,
  mediaAssets,
  onSaved,
}: {
  initialContent: HomepageContent;
  mediaAssets: MediaAsset[];
  onSaved: (updated: HomepageContent) => void;
}) {
  const [content, setContent] = useState<HomepageContent>(() => structuredClone(initialContent));
  const [identityMessage, setIdentityMessage] = useState<string | null>(null);
  const [benefitsMessage, setBenefitsMessage] = useState<string | null>(null);
  const [faqsMessage, setFaqsMessage] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const identitySave = useMutation({
    mutationFn: updateAdminHomepageIdentity,
    onSuccess: (updated) => {
      setContent((current) => ({ ...current, site: updated.site, hero: updated.hero }));
      setIdentityMessage(null);
      showSnackbar({ message: 'Brand & hero saved successfully', tone: 'success' });
      onSaved(updated);
    },
    onError: () => showSnackbar({ message: 'Brand & hero could not be saved.', tone: 'error' }),
  });
  const benefitsSave = useMutation({
    mutationFn: updateAdminHomepageBenefits,
    onSuccess: (updated) => {
      setContent((current) => ({ ...current, benefits: updated.benefits }));
      setBenefitsMessage(null);
      showSnackbar({ message: 'Benefits saved successfully', tone: 'success' });
      onSaved(updated);
    },
    onError: () => showSnackbar({ message: 'Benefits could not be saved.', tone: 'error' }),
  });
  const faqsSave = useMutation({
    mutationFn: updateAdminHomepageFaqs,
    onSuccess: (updated) => {
      setContent((current) => ({ ...current, faqs: updated.faqs }));
      setFaqsMessage(null);
      showSnackbar({ message: 'FAQ saved successfully', tone: 'success' });
      onSaved(updated);
    },
    onError: () => showSnackbar({ message: 'FAQ could not be saved.', tone: 'error' }),
  });

  const updateHero = (field: 'title' | 'description' | 'imageUrl', value: string) => {
    setContent((current) => ({
      ...current,
      hero: {
        ...current.hero,
        ...(field === 'title'
          ? { titleLines: value.split('\n').filter(Boolean) }
          : { [field]: value }),
      },
    }));
  };

  return (
    <div className="admin-panel-stack">
      <div className="admin-editor-toolbar">
        <div>
          <p className="admin-kicker">CONTENT SYSTEM</p>
          <h2>Shape what buyers see first.</h2>
          <p>
            Keep the homepage current while the six latest vehicle cards remain managed separately.
          </p>
        </div>
        <p className="admin-save-hint">Save each content area independently.</p>
      </div>

      <section className="admin-editor-card">
        <div className="admin-card-heading">
          <div>
            <p className="admin-kicker">SITE IDENTITY</p>
            <h3>Brand and hero</h3>
          </div>
          <SectionSaveButton
            label="Save brand & hero"
            message={identityMessage}
            pending={identitySave.isPending}
            onClick={() => identitySave.mutate({ site: content.site, hero: content.hero })}
          />
        </div>
        <div className="admin-form-grid">
          <AdminTextField
            label="Brand name"
            value={content.site.brandName}
            onChange={(value) =>
              setContent((current) => ({ ...current, site: { ...current.site, brandName: value } }))
            }
          />
          <AdminTextField
            label="Inventory button label"
            value={content.site.inventoryCtaLabel}
            onChange={(value) =>
              setContent((current) => ({
                ...current,
                site: { ...current.site, inventoryCtaLabel: value },
              }))
            }
          />
          <AdminTextArea
            label="Hero title lines"
            value={content.hero.titleLines.join('\n')}
            onChange={(value) => updateHero('title', value)}
          />
          <AdminTextArea
            label="Hero description"
            value={content.hero.description}
            onChange={(value) => updateHero('description', value)}
          />
          <AdminTextField
            label="Hero image URL"
            value={content.hero.imageUrl}
            onChange={(value) => updateHero('imageUrl', value)}
          />
          <AdminTextField
            label="Hero image alt text"
            value={content.hero.imageAlt}
            onChange={(value) =>
              setContent((current) => ({ ...current, hero: { ...current.hero, imageAlt: value } }))
            }
          />
          <div className="admin-hero-image-picker">
            <AdminDropdown
              className="admin-field"
              label="Choose uploaded hero image"
              value={
                mediaAssets.some((asset) => asset.url === content.hero.imageUrl)
                  ? content.hero.imageUrl
                  : ''
              }
              placeholder={
                mediaAssets.length > 0 ? 'Select an uploaded WebP' : 'No uploaded images available'
              }
              options={mediaAssets.map((asset) => ({
                value: asset.url,
                label: mediaFileName(asset),
                description: `${asset.width}×${asset.height}`,
              }))}
              onChange={(value) => updateHero('imageUrl', value)}
            />
            {content.hero.imageUrl ? (
              <div className="admin-hero-image-preview">
                <img src={resolveMediaUrl(content.hero.imageUrl)} alt={content.hero.imageAlt} />
                <span>Current hero preview</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="admin-editor-card">
        <div className="admin-card-heading">
          <div>
            <p className="admin-kicker">TRUST SIGNALS</p>
            <h3>Benefits and icon system</h3>
            <p>Up to 20 benefit cards can be curated with the supported icon catalog.</p>
          </div>
          <div className="admin-section-actions">
            <SectionSaveButton
              label="Save benefits"
              message={benefitsMessage}
              pending={benefitsSave.isPending}
              onClick={() =>
                benefitsSave.mutate(
                  content.benefits.map((benefit, index) => ({ ...benefit, displayOrder: index })),
                )
              }
            />
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() => addBenefit(content, setContent)}
              disabled={content.benefits.length >= 20}
            >
              <Plus size={16} /> Add benefit
            </button>
          </div>
        </div>
        <div className="admin-editor-list">
          {content.benefits.map((benefit, index) => (
            <div className="admin-repeater-card" key={benefit.id ?? `${benefit.iconKey}-${index}`}>
              <div className="admin-repeater-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="admin-repeater-fields">
                <div className="admin-field">
                  <span>Icon</span>
                  <IconPicker
                    value={benefit.iconKey}
                    onChange={(value) => updateBenefit(setContent, index, 'iconKey', value)}
                  />
                </div>
                <AdminTextField
                  label="Title"
                  value={benefit.title}
                  onChange={(value) => updateBenefit(setContent, index, 'title', value)}
                />
                <AdminTextArea
                  label="Description"
                  value={benefit.description}
                  onChange={(value) => updateBenefit(setContent, index, 'description', value)}
                />
                <div className="admin-field">
                  <span>Tone</span>
                  <TonePicker
                    value={benefit.tone}
                    onChange={(value) => updateBenefit(setContent, index, 'tone', value)}
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
          ))}
        </div>
      </section>

      <section className="admin-editor-card">
        <div className="admin-card-heading">
          <div>
            <p className="admin-kicker">BUYER QUESTIONS</p>
            <h3>Frequently asked questions</h3>
          </div>
          <div className="admin-section-actions">
            <SectionSaveButton
              label="Save FAQ"
              message={faqsMessage}
              pending={faqsSave.isPending}
              onClick={() =>
                faqsSave.mutate(content.faqs.map((faq, index) => ({ ...faq, displayOrder: index })))
              }
            />
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() =>
                setContent((current) => ({
                  ...current,
                  faqs: [
                    ...current.faqs,
                    {
                      id: `faq-${Date.now()}`,
                      question: 'New question',
                      answer: 'Add a helpful answer.',
                      displayOrder: current.faqs.length,
                      isActive: true,
                    },
                  ],
                }))
              }
            >
              <Plus size={16} /> Add FAQ
            </button>
          </div>
        </div>
        <div className="admin-editor-list">
          {content.faqs.map((faq, index) => (
            <div className="admin-repeater-card" key={faq.id ?? `faq-${index}`}>
              <div className="admin-repeater-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="admin-repeater-fields">
                <AdminTextField
                  label="Question"
                  value={faq.question}
                  onChange={(value) =>
                    setContent((current) => ({
                      ...current,
                      faqs: current.faqs.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, question: value } : item,
                      ),
                    }))
                  }
                />
                <AdminTextArea
                  label="Answer"
                  value={faq.answer}
                  onChange={(value) =>
                    setContent((current) => ({
                      ...current,
                      faqs: current.faqs.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, answer: value } : item,
                      ),
                    }))
                  }
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
      </section>
    </div>
  );
}

export function SectionSaveButton({
  label,
  message,
  pending,
  onClick,
}: {
  label: string;
  message: string | null;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <div className="admin-section-save">
      {message ? <span className="admin-save-message">{message}</span> : null}
      <button className="admin-save-button" type="button" onClick={onClick} disabled={pending}>
        <Save size={15} /> {pending ? 'Saving…' : label}
      </button>
    </div>
  );
}

export function IconPicker({
  value,
  onChange,
}: {
  value: HomepageContent['benefits'][number]['iconKey'];
  onChange: (value: HomepageContent['benefits'][number]['iconKey']) => void;
}) {
  const options: AdminDropdownOption[] = iconKeys.map((key) => {
    const Icon = getHomepageIcon(key);
    return { value: key, label: key, startAdornment: <Icon size={17} /> };
  });

  return (
    <AdminDropdown
      ariaLabel="Icon options"
      value={value}
      options={options}
      onChange={(nextValue) => onChange(nextValue as typeof value)}
    />
  );
}

export function TonePicker({
  value,
  onChange,
}: {
  value: HomepageContent['benefits'][number]['tone'];
  onChange: (value: HomepageContent['benefits'][number]['tone']) => void;
}) {
  const selectedTone = toneOptions.find((tone) => tone.value === value) ?? toneOptions[0];

  return (
    <AdminDropdown
      ariaLabel="Tone options"
      value={value}
      options={toneOptions.map((tone) => ({
        value: tone.value,
        label: tone.label,
        startAdornment: (
          <span className={`admin-tone-swatch admin-tone-${tone.value}`} aria-hidden="true" />
        ),
      }))}
      onChange={(nextValue) => onChange(nextValue as typeof value)}
      renderValue={(option) => (
        <span className="admin-dropdown-rich-value">
          <span
            className={`admin-tone-swatch admin-tone-${option?.value ?? selectedTone.value}`}
            aria-hidden="true"
          />
          <span>{option?.label ?? selectedTone.label}</span>
        </span>
      )}
    />
  );
}

export function AdminTextField({
  label,
  value,
  onChange,
  prefix,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  required?: boolean;
}) {
  const editableValue = prefix && value.startsWith(prefix) ? value.slice(prefix.length) : value;

  return (
    <label className="admin-field">
      <span>
        {label}
        {required ? (
          <span className="admin-required-mark" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      {prefix ? (
        <span className="admin-prefixed-input">
          <span aria-hidden="true">{prefix}</span>
          <input
            type="text"
            inputMode="tel"
            required={required}
            aria-required={required}
            aria-label={required ? label : undefined}
            value={editableValue}
            onChange={(event) => onChange(`${prefix}${event.target.value}`)}
          />
        </span>
      ) : (
        <input
          type="text"
          required={required}
          aria-required={required}
          aria-label={required ? label : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

export function AdminTextArea({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="admin-field">
      <span>
        {label}
        {required ? (
          <span className="admin-required-mark" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      <textarea
        rows={3}
        required={required}
        aria-required={required}
        aria-label={required ? label : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function updateBenefit<T extends keyof HomepageContent['benefits'][number]>(
  setContent: Dispatch<SetStateAction<HomepageContent>>,
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

function addBenefit(
  content: HomepageContent,
  setContent: Dispatch<SetStateAction<HomepageContent>>,
) {
  const iconKey =
    iconKeys.find((key) => !content.benefits.some((benefit) => benefit.iconKey === key)) ??
    'support';
  setContent((current) => ({
    ...current,
    benefits: [
      ...current.benefits,
      {
        id: `benefit-${Date.now()}`,
        iconKey,
        title: 'New benefit',
        description: 'Add a concise buyer benefit.',
        tone: 'mint',
        displayOrder: current.benefits.length,
        isActive: true,
      },
    ],
  }));
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { homepageDefaults } from '../../homepage/homepageDefaults';
import type { AdminHomepagePayload } from '../types';
import { AdminHomepagePreview } from './AdminHomepagePreview';

afterEach(cleanup);

function renderPreview(
  section: Parameters<typeof AdminHomepagePreview>[0]['section'],
  content: AdminHomepagePayload = homepageDefaults,
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminHomepagePreview section={section} content={content} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminHomepagePreview', () => {
  it('renders unsaved draft content through the real public component', () => {
    const content = structuredClone(homepageDefaults);
    content.hero.eyebrow = 'Unsaved preview copy';

    renderPreview('brand-hero', content);

    expect(screen.getByText('Unsaved preview copy')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /premium.*pre-owned.*cars/i,
    );
  });

  it('switches between the three responsive preview widths', () => {
    const { container } = renderPreview('benefits');
    const stage = container.querySelector('.admin-live-preview-stage');

    expect(stage).toHaveClass('is-desktop');
    fireEvent.click(screen.getByRole('button', { name: 'Mobile preview' }));
    expect(stage).toHaveClass('is-mobile');
    fireEvent.click(screen.getByRole('button', { name: 'Tablet preview' }));
    expect(stage).toHaveClass('is-tablet');
  });

  it('switches from the timeline to a row-wise grid after six benefits', () => {
    const shortPreview = renderPreview('benefits');
    expect(shortPreview.container.querySelector('.benefits-inner')).not.toHaveClass('is-grid');
    expect(shortPreview.container.querySelector('.benefits-progress')).toBeInTheDocument();

    cleanup();

    const content = structuredClone(homepageDefaults);
    content.benefits = Array.from({ length: 7 }, (_, index) => ({
      ...homepageDefaults.benefits[index % homepageDefaults.benefits.length],
      id: `extended-benefit-${index + 1}`,
      title: `Extended benefit ${index + 1}`,
    }));
    const extendedPreview = renderPreview('benefits', content);

    expect(extendedPreview.container.querySelector('.benefits-inner')).toHaveClass('is-grid');
    expect(extendedPreview.container.querySelector('.benefits-list')).toHaveClass('is-grid');
    expect(extendedPreview.container.querySelector('.benefits-progress')).not.toBeInTheDocument();
    expect(extendedPreview.container.querySelectorAll('.benefits-row-grid')).toHaveLength(7);
  });

  it.each([
    ['benefits', homepageDefaults.benefitsIntro.title],
    ['how-it-works', homepageDefaults.howItWorks.title],
    ['faqs', homepageDefaults.faq.title],
    ['showroom', homepageDefaults.showroom.title],
    ['about', homepageDefaults.about.title],
  ] as const)('renders the %s public section', (section, expectedHeading) => {
    renderPreview(section);
    expect(screen.getByRole('heading', { name: expectedHeading })).toBeInTheDocument();
  });

  it('renders the footer preview with contact details', () => {
    renderPreview('footer');

    expect(screen.getByRole('link', { name: homepageDefaults.footer.email })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: homepageDefaults.footer.phone })).toBeInTheDocument();
  });
});

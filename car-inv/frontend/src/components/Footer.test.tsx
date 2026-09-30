import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { homepageDefaults } from '../features/homepage/homepageDefaults';
import { Footer } from './Footer';

const { homepageContentMock } = vi.hoisted(() => ({ homepageContentMock: vi.fn() }));

vi.mock('../features/homepage/hooks/useHomepageContent', () => ({
  useHomepageContent: homepageContentMock,
}));

describe('Footer', () => {
  afterEach(cleanup);

  beforeEach(() => {
    homepageContentMock.mockReturnValue({
      data: {
        ...homepageDefaults,
        footer: {
          ...homepageDefaults.footer,
          termsHref: 'mailto:legal@driva.example',
          privacyHref: 'mailto:privacy@driva.example',
        },
      },
    });
  });

  it('renders global policy links and removes the newsletter block', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('heading', { name: /new arrivals/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terms & Conditions' })).toHaveAttribute(
      'href',
      '/terms',
    );
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy',
    );
    expect(screen.getByRole('navigation', { name: 'Footer navigation' })).toHaveClass(
      'footer-global-links',
    );
    expect(document.querySelector('.footer-contact-label')).toHaveTextContent('Contact');
    expect(screen.getByText('Email:')).toBeInTheDocument();
    expect(screen.getByText('Phone:')).toBeInTheDocument();
    expect(screen.getByText(homepageDefaults.footer.copyright)).toHaveClass(
      'footer-global-copyright',
    );
    expect(screen.getByRole('link', { name: homepageDefaults.footer.email })).toHaveAttribute(
      'href',
      `mailto:${homepageDefaults.footer.email}`,
    );
    expect(screen.getByRole('link', { name: homepageDefaults.footer.phone })).toHaveAttribute(
      'href',
      'tel:+914440001020',
    );
  });

  it('uses the compact vehicle-detail footer without the newsletter block', () => {
    render(
      <MemoryRouter initialEntries={['/inventory/mercedes-benz-c-class']}>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('heading', { name: /new arrivals/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terms & Conditions' })).toHaveAttribute(
      'href',
      '/terms',
    );
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy',
    );
    expect(screen.getByRole('navigation', { name: 'Footer navigation' })).toHaveClass(
      'vehicle-detail-footer-links',
    );
    expect(screen.getByText(homepageDefaults.footer.copyright)).toHaveClass(
      'vehicle-detail-footer-copyright',
    );
  });
});

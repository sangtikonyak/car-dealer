import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentMetadata } from './DocumentMetadata';

const homepageContentMock = vi.hoisted(() => ({
  brandName: 'Driva',
  title: 'Driva — Premium pre-owned vehicles',
  brandMark: 'D',
}));

vi.mock('../features/homepage/hooks/useHomepageContent', () => ({
  useHomepageContent: () => ({ data: { site: homepageContentMock } }),
}));

afterEach(() => {
  cleanup();
  document.head.innerHTML = '';
  document.title = '';
});

const renderMetadata = () =>
  render(
    <MemoryRouter initialEntries={['/inventory']}>
      <DocumentMetadata />
    </MemoryRouter>,
  );

describe('DocumentMetadata', () => {
  it('uses the configured brand name in document metadata', () => {
    document.head.innerHTML = `
      <meta property="og:site_name" />
      <meta property="og:title" />
      <meta name="twitter:title" />
      <meta property="og:url" />
      <link rel="icon" />
    `;

    homepageContentMock.brandName = 'Driva';
    homepageContentMock.title = 'Driva — Premium pre-owned vehicles';
    renderMetadata();

    expect(document.title).toBe('Driva — Premium pre-owned vehicles');
    expect(document.querySelector('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'Driva',
    );
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Driva — Premium pre-owned vehicles',
    );
    expect(document.querySelector('meta[name="twitter:title"]')).toHaveAttribute(
      'content',
      'Driva — Premium pre-owned vehicles',
    );
    expect(document.querySelector('link[rel="icon"]')).toHaveAttribute(
      'href',
      expect.stringContaining('data:image/svg+xml'),
    );
  });

  it('updates metadata when the configured brand changes', () => {
    document.head.innerHTML = `
      <meta property="og:site_name" />
      <meta property="og:title" />
      <meta name="twitter:title" />
      <meta property="og:url" />
      <link rel="icon" />
    `;

    homepageContentMock.brandName = 'Northstar Motors';
    homepageContentMock.title = 'Northstar Motors showroom';
    renderMetadata();

    expect(document.title).toBe('Northstar Motors showroom');
    expect(document.querySelector('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'Northstar Motors',
    );
  });

  it('updates the browser title when only the configured title changes', () => {
    document.head.innerHTML = `
      <meta property="og:site_name" />
      <meta property="og:title" />
      <meta name="twitter:title" />
      <meta property="og:url" />
      <link rel="icon" />
    `;

    homepageContentMock.brandName = 'Driva';
    homepageContentMock.title = 'Driva showroom';
    const view = renderMetadata();

    homepageContentMock.title = 'Driva premium vehicles';
    view.rerender(
      <MemoryRouter initialEntries={['/inventory']}>
        <DocumentMetadata />
      </MemoryRouter>,
    );

    expect(document.title).toBe('Driva premium vehicles');
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Driva premium vehicles',
    );
  });
});

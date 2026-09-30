import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { homepageDefaults } from '../features/homepage/homepageDefaults';
import { Header } from './Header';

vi.mock('../features/homepage/hooks/useHomepageContent', () => ({
  useHomepageContent: () => ({ data: homepageDefaults }),
}));

afterEach(cleanup);

const renderHeader = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<Header />} />
      </Routes>
    </MemoryRouter>,
  );

describe('Header inventory CTA', () => {
  it('uses the configured brand name for the home link', () => {
    renderHeader('/');

    expect(screen.getByRole('link', { name: 'Driva home' })).toHaveAttribute('href', '/');
  });

  it('includes a home link', () => {
    renderHeader('/inventory');

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });

  it('links to inventory from the homepage', () => {
    renderHeader('/');

    expect(screen.getByRole('link', { name: /view inventory/i })).toHaveAttribute(
      'href',
      '/inventory',
    );
  });

  it('links back home from inventory routes', () => {
    renderHeader('/inventory/bmw-4-series-430i');

    expect(screen.getByRole('link', { name: /back home/i })).toHaveAttribute('href', '/');
  });
});

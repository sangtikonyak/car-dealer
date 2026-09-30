import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { LegalPage } from './LegalPage';

describe('LegalPage', () => {
  afterEach(cleanup);

  it('renders the privacy policy page', () => {
    render(
      <MemoryRouter>
        <LegalPage kind="privacy" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /information we collect/i })).toBeInTheDocument();
  });

  it('renders the terms page', () => {
    render(
      <MemoryRouter>
        <LegalPage kind="terms" />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /terms and conditions/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /vehicle listings/i })).toBeInTheDocument();
  });
});

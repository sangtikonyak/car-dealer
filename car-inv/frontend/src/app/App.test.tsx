import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(cleanup);

describe('App', () => {
  it('renders the premium pre-owned dealership landing page', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /premium.*pre-owned.*cars/i,
    );
    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /latest arrivals/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Buy with confidence$/i })).toBeInTheDocument();
  });
});

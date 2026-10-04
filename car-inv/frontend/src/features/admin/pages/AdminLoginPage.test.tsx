import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { homepageDefaults } from '../../homepage/homepageDefaults';
import { AdminLoginPage } from './AdminLoginPage';

vi.mock('../hooks/useAdminSession', () => ({
  useAdminLogin: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
  useAdminSession: () => ({ data: null, isLoading: false }),
}));

describe('AdminLoginPage branding', () => {
  it('uses the saved brand name and logo in the sign-in lockup', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['homepage-content'], {
      ...homepageDefaults,
      site: {
        ...homepageDefaults.site,
        brandName: 'Northstar Motors',
        brandMark: 'https://cdn.example/northstar.png',
      },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminLoginPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole('link', { name: 'Back to Northstar Motors homepage' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Northstar Motors CONTROL ROOM')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.example/northstar.png',
    );
  });
});

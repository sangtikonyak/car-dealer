import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SnackbarProvider } from '../../../components/Snackbar';
import { homepageDefaults } from '../../homepage/homepageDefaults';
import { updateAdminHomepageIdentity, updateAdminHomepageSiteIdentity } from '../api';
import { AdminHomepageWorkspace } from './AdminHomepageWorkspace';

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');

  return {
    ...actual,
    updateAdminHomepageIdentity: vi.fn(),
    updateAdminHomepageSiteIdentity: vi.fn(),
  };
});

describe('AdminHomepageWorkspace overview', () => {
  afterEach(() => {
    cleanup();
  });

  const renderWorkspace = (onOpenSection = vi.fn()) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    return render(
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <AdminHomepageWorkspace
            section="overview"
            initialContent={homepageDefaults}
            mediaAssets={[]}
            onSaved={vi.fn()}
            onOpenSection={onOpenSection}
          />
        </SnackbarProvider>
      </QueryClientProvider>,
    );
  };

  it('renders the progress canvas and selected section summary', () => {
    renderWorkspace();

    expect(
      screen.getByRole('heading', { name: 'Homepage overview', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Section 1 of 8')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Site identity', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('Content summary')).toBeInTheDocument();
    expect(screen.getByText('Recent activity')).toBeInTheDocument();
  });

  it('changes the selected section without navigating away from the overview', () => {
    const onOpenSection = vi.fn();

    renderWorkspace(onOpenSection);

    fireEvent.click(
      screen.getByRole('button', { name: /BenefitsIntro copy and buyer trust cards/i }),
    );

    expect(screen.getByText('Section 3 of 8')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Benefits', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('4/6 configured')).toBeInTheDocument();
    expect(onOpenSection).not.toHaveBeenCalled();
  });

  it('opens the existing editor route from the selected section', () => {
    const onOpenSection = vi.fn();

    renderWorkspace(onOpenSection);

    fireEvent.click(screen.getAllByRole('button', { name: /Edit section/i })[0]);

    expect(onOpenSection).toHaveBeenCalledWith('site-identity');
  });

  it('allows selecting a lower hero image option from the media dropdown', () => {
    const mediaAssets = Array.from({ length: 8 }, (_, index) => ({
      id: `asset-${index + 1}`,
      url: `/uploads/asset-${index + 1}.webp`,
      mimeType: 'image/webp',
      width: 1600,
      height: 1000,
      bytes: 1024,
      originalName: `hero-${index + 1}.webp`,
    }));
    const onSaved = vi.fn();

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <SnackbarProvider>
          <AdminHomepageWorkspace
            section="brand-hero"
            initialContent={homepageDefaults}
            mediaAssets={mediaAssets}
            onSaved={onSaved}
            onOpenSection={vi.fn()}
          />
        </SnackbarProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hero image options' }));

    const lowerOption = screen.getByRole('option', { name: /asset-8\.webp/i });
    expect(lowerOption).toBeInTheDocument();

    fireEvent.click(lowerOption);

    expect(screen.getByRole('button', { name: 'Hero image options' })).toHaveTextContent(
      'asset-8.webp',
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('reloads the page after saving site identity successfully', async () => {
    const reloadPage = vi.fn();
    const onSaved = vi.fn();
    vi.mocked(updateAdminHomepageSiteIdentity).mockResolvedValue(homepageDefaults);

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <SnackbarProvider>
          <AdminHomepageWorkspace
            section="site-identity"
            initialContent={homepageDefaults}
            mediaAssets={[]}
            onSaved={onSaved}
            onOpenSection={vi.fn()}
            reloadPage={reloadPage}
          />
        </SnackbarProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save site identity' }));

    await waitFor(() => expect(updateAdminHomepageSiteIdentity).toHaveBeenCalledOnce());
    expect(onSaved).toHaveBeenCalledOnce();
    expect(reloadPage).toHaveBeenCalledOnce();
  });

  it('does not reload after saving another homepage section', async () => {
    const reloadPage = vi.fn();
    vi.mocked(updateAdminHomepageIdentity).mockResolvedValue(homepageDefaults);

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <SnackbarProvider>
          <AdminHomepageWorkspace
            section="brand-hero"
            initialContent={homepageDefaults}
            mediaAssets={[]}
            onSaved={vi.fn()}
            onOpenSection={vi.fn()}
            reloadPage={reloadPage}
          />
        </SnackbarProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save brand & hero' }));

    await waitFor(() => expect(updateAdminHomepageIdentity).toHaveBeenCalledOnce());
    expect(reloadPage).not.toHaveBeenCalled();
  });
});

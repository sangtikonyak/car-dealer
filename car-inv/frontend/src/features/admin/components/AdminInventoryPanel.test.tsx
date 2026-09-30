import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SnackbarProvider } from '../../../components/Snackbar';
import {
  createAdminVehicle,
  createAdminFuelType,
  createAdminMake,
  deleteAdminFuelType,
  deleteAdminMake,
  fetchAdminFuelTypes,
  fetchAdminMakes,
  fetchAdminVehicle,
  updateAdminFuelType,
  updateAdminMake,
} from '../../inventory/api';
import type { Vehicle } from '../../../types/vehicle';
import { AdminInventoryPanel } from './AdminInventoryPanel';

vi.mock('../../inventory/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../inventory/api')>();
  return {
    ...actual,
    createAdminVehicle: vi.fn(),
    createAdminFuelType: vi.fn(),
    createAdminMake: vi.fn(),
    deleteAdminFuelType: vi.fn(),
    deleteAdminMake: vi.fn(),
    fetchAdminFuelTypes: vi.fn(),
    fetchAdminMakes: vi.fn(),
    fetchAdminVehicle: vi.fn(),
    updateAdminFuelType: vi.fn(),
    updateAdminMake: vi.fn(),
  };
});

const makes = [
  { id: 'make-audi', name: 'Audi', slug: 'audi', isActive: true },
  { id: 'make-bmw', name: 'BMW', slug: 'bmw', isActive: false },
];

const fuelTypes = [{ id: 'fuel-electric', name: 'Electric', slug: 'electric', isActive: true }];

const existingVehicle: Vehicle = {
  id: 'vehicle-mercedes',
  slug: 'mercedes-benz-c-class',
  make: 'Mercedes-Benz',
  makeId: 'make-mercedes',
  model: 'C-Class',
  trim: 'C 300',
  category: 'Sedan',
  year: 2022,
  price: 45000,
  mileage: 12000,
  fuel: 'Petrol',
  fuelTypeId: 'fuel-petrol',
  priceNegotiable: false,
  photos: [],
  documents: [],
  exterior: 'Black',
  interior: 'Black',
  vin: 'DEMO-C300-22-005',
  engine: '2.0L',
  power: '255 hp',
  torque: '295 lb-ft',
  transmission: 'Automatic',
  drivetrain: 'AWD',
  range: '',
  description: 'A test vehicle',
  highlights: [],
  customFields: [],
  isPublished: true,
};

function renderPanel(path = '/admin/inventory/makes') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/admin/inventory/makes" element={<AdminInventoryPanel mode="makes" />} />
            <Route
              path="/admin/inventory/fuel-types"
              element={<AdminInventoryPanel mode="fuel-types" />}
            />
          </Routes>
        </MemoryRouter>
      </SnackbarProvider>
    </QueryClientProvider>,
  );
}

function renderVehicleEditor() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <MemoryRouter initialEntries={['/admin/inventory/new']}>
          <Routes>
            <Route path="/admin/inventory/new" element={<AdminInventoryPanel mode="new" />} />
          </Routes>
        </MemoryRouter>
      </SnackbarProvider>
    </QueryClientProvider>,
  );
}

function VehicleRouteHarness() {
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.pathname.endsWith('/new');

  return (
    <>
      <button type="button" onClick={() => navigate('/admin/inventory/new')}>
        Add vehicle route
      </button>
      <AdminInventoryPanel
        mode={isNew ? 'new' : 'edit'}
        vehicleId={isNew ? undefined : 'vehicle-mercedes'}
      />
    </>
  );
}

describe('AdminInventoryPanel option management', () => {
  beforeEach(() => {
    vi.mocked(fetchAdminMakes).mockResolvedValue(makes);
    vi.mocked(fetchAdminFuelTypes).mockResolvedValue(fuelTypes);
    vi.mocked(createAdminMake).mockResolvedValue(makes[0]);
    vi.mocked(createAdminFuelType).mockResolvedValue(fuelTypes[0]);
    vi.mocked(updateAdminMake).mockResolvedValue(makes[0]);
    vi.mocked(updateAdminFuelType).mockResolvedValue(fuelTypes[0]);
    vi.mocked(deleteAdminMake).mockResolvedValue(undefined);
    vi.mocked(deleteAdminFuelType).mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('opens and cancels the compact add form', async () => {
    renderPanel();

    expect(await screen.findByText('2 makes')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'New make' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add make' }));
    const input = screen.getByRole('textbox', { name: 'New make' });
    fireEvent.change(input, { target: { value: 'Volvo' } });
    expect(input).toHaveValue('Volvo');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('textbox', { name: 'New make' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add make' }));
    const reopenedInput = screen.getByRole('textbox', { name: 'New make' });
    expect(reopenedInput).toHaveValue('');
    fireEvent.change(reopenedInput, { target: { value: 'Volvo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add make' }));

    await waitFor(() => expect(createAdminMake).toHaveBeenCalledWith('Volvo'));
  });

  it('supports saving and cancelling inline name edits', async () => {
    renderPanel();

    await screen.findByText('Audi');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Audi' }));
    const audiInput = screen.getByRole('textbox', { name: 'Edit Audi' });
    fireEvent.change(audiInput, { target: { value: 'Audi AG' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateAdminMake).toHaveBeenCalledWith('make-audi', 'Audi AG', true));

    fireEvent.click(screen.getByRole('button', { name: 'Edit BMW' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit BMW' }), {
      target: { value: 'BMW Group' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('textbox', { name: 'Edit BMW' })).not.toBeInTheDocument();
    expect(screen.getByText('BMW')).toBeInTheDocument();
  });

  it('updates active status through an accessible switch', async () => {
    renderPanel();

    const activeSwitch = await screen.findByRole('switch', { name: 'Audi active' });
    expect(activeSwitch).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(activeSwitch);

    await waitFor(() => expect(updateAdminMake).toHaveBeenCalledWith('make-audi', 'Audi', false));
  });

  it('keeps destructive actions inside the row overflow menu', async () => {
    renderPanel();

    await screen.findByText('Audi');
    fireEvent.click(screen.getByRole('button', { name: 'More actions for Audi' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete Audi' }));

    await waitFor(() => expect(deleteAdminMake).toHaveBeenCalledWith('make-audi'));
  });

  it('navigates between make and fuel-type settings', async () => {
    renderPanel();

    await screen.findByText('2 makes');
    fireEvent.click(screen.getByRole('button', { name: 'Fuel types' }));

    expect(await screen.findByText('1 fuel types')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fuel types' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText('Electric')).toBeInTheDocument();
  });

  it('shows and edits the documentation section in the vehicle editor', async () => {
    renderVehicleEditor();

    fireEvent.click(await screen.findByRole('button', { name: /documentation/i }));

    expect(screen.getByRole('heading', { name: 'Documentation' })).toBeInTheDocument();
    expect(screen.getByText('No documents have been added yet.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add document' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Document' }), {
      target: { value: 'Vehicle history report' },
    });

    expect(screen.getByRole('textbox', { name: 'Document' })).toHaveValue('Vehicle history report');
    expect(screen.getByRole('checkbox', { name: 'Available' })).not.toBeChecked();
    expect(screen.queryByRole('combobox', { name: 'Document status' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Document URL (optional)' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Available' }));
    expect(screen.getByRole('checkbox', { name: 'Available' })).toBeChecked();

    fireEvent.click(
      screen.getByRole('button', { name: /delete document vehicle history report/i }),
    );
    expect(screen.getByText('No documents have been added yet.')).toBeInTheDocument();
  });

  it('resets the editor when navigating from edit to add vehicle', async () => {
    vi.mocked(fetchAdminVehicle).mockResolvedValue(existingVehicle);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <MemoryRouter initialEntries={['/admin/inventory/vehicle-mercedes']}>
            <Routes>
              <Route path="/admin/inventory/:vehicleId" element={<VehicleRouteHarness />} />
              <Route path="/admin/inventory/new" element={<VehicleRouteHarness />} />
            </Routes>
          </MemoryRouter>
        </SnackbarProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByDisplayValue('mercedes-benz-c-class')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add vehicle route' }));

    expect(await screen.findByRole('heading', { name: 'Add vehicle' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Slug' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Model' })).toHaveValue('');
  });

  it('marks required vehicle fields with an accessible red asterisk', async () => {
    renderVehicleEditor();

    const slugLabel = (await screen.findByText('Slug', { exact: true })).closest('label');
    const makeLabel = screen.getByText('Make', { exact: true }).parentElement;

    expect(slugLabel?.querySelector('.admin-required-mark')).toBeInTheDocument();
    expect(makeLabel?.querySelector('.admin-required-mark')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Specifications/ }));
    const rangeLabel = screen.getByText('Range', { exact: true }).closest('label');

    expect(rangeLabel?.querySelector('.admin-required-mark')).not.toBeInTheDocument();
    expect(screen.getAllByText('required', { selector: '.sr-only' }).length).toBeGreaterThan(0);
  });

  it('keeps the basic and specifications headings in the shared editor content shell', async () => {
    renderVehicleEditor();

    const editorMain = screen.getByRole('main');
    expect(screen.getByRole('heading', { name: 'Identity and availability' })).toBeInTheDocument();
    expect(editorMain.querySelector('.admin-editor-section-heading')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Specifications/ }));

    expect(screen.getByRole('heading', { name: 'What buyers need to know' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Identity and availability' }),
    ).not.toBeInTheDocument();
    expect(editorMain.querySelector('.admin-editor-section-heading')).toBeInTheDocument();
  });

  it('blocks saving and focuses validation feedback when required fields are missing', async () => {
    renderVehicleEditor();

    fireEvent.click(await screen.findByRole('button', { name: 'Save vehicle' }));

    expect((await screen.findAllByText('Slug is required.')).length).toBeGreaterThan(0);
    expect(screen.getByRole('textbox', { name: /Slug/ })).toHaveAttribute('aria-invalid', 'true');
    expect(createAdminVehicle).not.toHaveBeenCalled();
  });

  it('validates an individual field when it loses focus', async () => {
    renderVehicleEditor();

    const slug = await screen.findByRole('textbox', { name: 'Slug' });
    fireEvent.blur(slug);

    expect(await screen.findAllByText('Slug is required.')).not.toHaveLength(0);
    expect(slug).toHaveAttribute('aria-invalid', 'true');
    expect(createAdminVehicle).not.toHaveBeenCalled();
  });
});

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link, useNavigate } from 'react-router-dom';
import { useSnackbar } from '../../../components/Snackbar';
import { AdminVehicleDetails } from './AdminVehicleDetails';
import { AdminDropdown } from './AdminDropdown';
import {
  createAdminFuelType,
  createAdminMake,
  createAdminVehicle,
  deleteAdminFuelType,
  deleteAdminMake,
  deleteAdminVehicle,
  deleteVehiclePhoto,
  fetchAdminFuelTypes,
  fetchAdminMakes,
  fetchAdminVehicle,
  fetchAdminVehicles,
  reorderVehiclePhotos,
  updateAdminFuelType,
  updateAdminMake,
  updateAdminVehicle,
  uploadVehiclePhotos,
  type AdminInventoryStatus,
  type InventoryOption,
  type VehiclePayload,
} from '../../inventory/api';
import type { Vehicle, VehicleCustomField } from '../../../types/vehicle';
import {
  emptyVehicleForm,
  getServerVehicleError,
  type VehicleFormErrors,
  type VehicleFormValues,
  validateVehicleForm,
  validationSection,
  vehicleToForm,
} from '../validation/vehicle-form';

type Mode = 'list' | 'new' | 'edit' | 'details' | 'makes' | 'fuel-types';
type PendingPhoto = { id: string; file: File; preview: string };
type VehicleEditorSection = 'basic' | 'specifications' | 'images' | 'documents' | 'custom';
const maxClientUploadBytes = 10 * 1024 * 1024;
const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const vehicleEditorSections: Array<{
  id: VehicleEditorSection;
  label: string;
  description: string;
}> = [
  { id: 'basic', label: 'Basic information', description: 'Identity and availability' },
  { id: 'specifications', label: 'Specifications', description: 'Pricing and vehicle details' },
  { id: 'images', label: 'Images', description: 'Upload and order photos' },
  { id: 'documents', label: 'Documentation', description: 'Records and paperwork' },
  { id: 'custom', label: 'Custom details', description: 'Flexible label/value fields' },
];

const focusFirstVehicleError = (errors: VehicleFormErrors) => {
  const firstError = Object.keys(errors)[0];
  if (!firstError) return;
  window.requestAnimationFrame(() => {
    const target = Array.from(document.querySelectorAll<HTMLElement>('[data-validation-key]')).find(
      (element) => element.dataset.validationKey === firstError,
    );
    if (!target) return;
    if (
      target instanceof HTMLButtonElement ||
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      target.focus();
      return;
    }
    target.querySelector<HTMLElement>('button, input, textarea')?.focus();
  });
};

const removeValidationErrors = (errors: VehicleFormErrors, field: string): VehicleFormErrors =>
  Object.fromEntries(
    Object.entries(errors).filter(([key]) => key !== field && !key.startsWith(`${field}.`)),
  );

const sectionErrorCount = (errors: VehicleFormErrors, section: VehicleEditorSection): number =>
  Object.keys(errors).filter((path) => validationSection(path) === section).length;

export function AdminInventoryPanel({ mode, vehicleId }: { mode: Mode; vehicleId?: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const options = useQuery({
    queryKey: ['admin-inventory-options'],
    queryFn: async () => ({
      makes: await fetchAdminMakes(),
      fuelTypes: await fetchAdminFuelTypes(),
    }),
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminInventoryStatus>('all');
  const [fuelType, setFuelType] = useState('all');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const list = useQuery({
    queryKey: ['admin-inventory', { search, status, fuelType, year, page, pageSize }],
    queryFn: () =>
      fetchAdminVehicles({
        search: search.trim() || undefined,
        status,
        fuelType,
        year: year ? Number(year) : undefined,
        page,
        pageSize,
        includeUnpublished: true,
      }),
    enabled: mode === 'list',
  });
  const vehicle = useQuery({
    queryKey: ['admin-vehicle', vehicleId],
    queryFn: () => fetchAdminVehicle(vehicleId ?? ''),
    enabled: (mode === 'edit' || mode === 'details') && Boolean(vehicleId),
  });

  if (mode === 'makes' || mode === 'fuel-types') return <LookupEditor type={mode} />;
  if (mode === 'new' || mode === 'edit') {
    if (mode === 'edit' && vehicle.isLoading)
      return <div className="admin-empty-state">Loading vehicle…</div>;
    return (
      <VehicleEditor
        key={mode === 'edit' ? vehicleId : 'new'}
        initial={vehicle.data}
        options={options.data ?? { makes: [], fuelTypes: [] }}
        onSaved={(updated) => {
          queryClient.setQueryData(['admin-vehicle', updated.id], updated);
          void queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
          showSnackbar({ message: 'Vehicle saved successfully', tone: 'success' });
          navigate('/admin/inventory');
        }}
      />
    );
  }
  if (mode === 'details') {
    if (vehicle.isLoading) return <div className="admin-empty-state">Loading vehicle…</div>;
    if (vehicle.isError || !vehicle.data) {
      return (
        <div className="admin-empty-state admin-query-error" role="alert">
          Vehicle details could not be loaded.
        </div>
      );
    }
    return (
      <AdminVehicleDetails
        vehicle={vehicle.data}
        onEdit={() => vehicle.data?.id && navigate(`/admin/inventory/${vehicle.data.id}`)}
      />
    );
  }
  return (
    <VehicleList
      items={list.data?.items ?? []}
      loading={list.isLoading}
      fetching={list.isFetching}
      error={list.isError}
      page={list.data?.page ?? page}
      pageSize={list.data?.pageSize ?? pageSize}
      total={list.data?.total ?? 0}
      totalPages={list.data?.totalPages ?? 0}
      search={search}
      status={status}
      fuelType={fuelType}
      year={year}
      fuelTypes={options.data?.fuelTypes ?? []}
      onSearch={(value) => {
        setSearch(value);
        setPage(1);
      }}
      onStatusChange={(value) => {
        setStatus(value);
        setPage(1);
      }}
      onFuelTypeChange={(value) => {
        setFuelType(value);
        setPage(1);
      }}
      onYearChange={(value) => {
        setYear(value);
        setPage(1);
      }}
      onPageChange={setPage}
      onAdd={() => navigate('/admin/inventory/new')}
      onEdit={(id) => navigate(`/admin/inventory/${id}`)}
      onDetails={(id) => navigate(`/admin/inventory/${id}/details`)}
      onDelete={async (id) => {
        try {
          await deleteAdminVehicle(id);
          await queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
          showSnackbar({ message: 'Vehicle deleted successfully', tone: 'success' });
        } catch {
          showSnackbar({ message: 'Vehicle could not be deleted.', tone: 'error' });
        }
      }}
    />
  );
}

function VehicleList({
  items,
  loading,
  fetching,
  error,
  page,
  pageSize,
  total,
  totalPages,
  search,
  status,
  fuelType,
  year,
  fuelTypes,
  onSearch,
  onStatusChange,
  onFuelTypeChange,
  onYearChange,
  onPageChange,
  onAdd,
  onEdit,
  onDetails,
  onDelete,
}: {
  items: Vehicle[];
  loading: boolean;
  fetching: boolean;
  error: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  search: string;
  status: AdminInventoryStatus;
  fuelType: string;
  year: string;
  fuelTypes: InventoryOption[];
  onSearch: (value: string) => void;
  onStatusChange: (value: AdminInventoryStatus) => void;
  onFuelTypeChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDetails: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="admin-panel-stack admin-inventory-listing">
      <section className="admin-section-heading admin-inventory-heading">
        <div>
          <p className="admin-kicker">INVENTORY</p>
          <h2>Vehicles</h2>
          <p>{total} total listings</p>
        </div>
        <button className="admin-save-button" type="button" onClick={onAdd}>
          <Plus size={16} /> Add vehicle
        </button>
      </section>
      <section className="admin-modern-card admin-inventory-toolbar" aria-label="Inventory filters">
        <label className="admin-inventory-search">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Search vehicles"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search vehicles…"
          />
        </label>
        <AdminDropdown
          className="admin-inventory-filter"
          label="Status"
          labelHidden
          value={status}
          ariaLabel="Filter by status"
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
          ]}
          onChange={(value) => onStatusChange(value as AdminInventoryStatus)}
        />
        <AdminDropdown
          className="admin-inventory-filter"
          label="Fuel type"
          labelHidden
          value={fuelType}
          ariaLabel="Filter by fuel type"
          options={[
            { value: 'all', label: 'All fuel types' },
            ...fuelTypes.map((option) => ({ value: option.slug, label: option.name })),
          ]}
          onChange={onFuelTypeChange}
        />
        <label className="admin-inventory-filter admin-inventory-year-filter">
          <span>Year</span>
          <input
            aria-label="Filter by year"
            type="number"
            min="1886"
            max={currentYear + 2}
            value={year}
            onChange={(event) => onYearChange(event.target.value)}
            placeholder="Any year"
          />
        </label>
        <button
          className="admin-inventory-clear"
          type="button"
          disabled={!search && status === 'all' && fuelType === 'all' && !year}
          onClick={() => {
            onSearch('');
            onStatusChange('all');
            onFuelTypeChange('all');
            onYearChange('');
          }}
        >
          Clear filters
        </button>
      </section>
      {loading ? (
        <div className="admin-empty-state">Loading vehicles…</div>
      ) : error ? (
        <div className="admin-empty-state admin-query-error" role="alert">
          Vehicles could not be loaded. Refresh and try again.
        </div>
      ) : items.length === 0 ? (
        <div className="admin-empty-state">No vehicles match these filters.</div>
      ) : (
        <div className={`admin-inventory-rows${fetching ? ' is-fetching' : ''}`}>
          {items.map((item, index) => {
            const itemKey = item.id ?? item.slug;
            const absoluteIndex = (page - 1) * pageSize + index + 1;
            return (
              <article className="admin-inventory-row" key={itemKey}>
                <span className="admin-inventory-order">
                  {String(absoluteIndex).padStart(2, '0')}
                </span>
                <button
                  className="admin-inventory-thumb"
                  type="button"
                  aria-label={`Open details for ${item.make} ${item.model}`}
                  onClick={() => {
                    if (item.id) onDetails(item.id);
                  }}
                  disabled={!item.id}
                >
                  {item.photos[0] ? (
                    <img
                      src={item.photos[0].src}
                      alt={item.photos[0].alt || `${item.make} ${item.model}`}
                      loading="lazy"
                    />
                  ) : (
                    <span>No image</span>
                  )}
                </button>
                <button
                  className="admin-inventory-identity admin-inventory-identity-button"
                  type="button"
                  onClick={() => {
                    if (item.id) onDetails(item.id);
                  }}
                  disabled={!item.id}
                >
                  <strong>
                    {item.make} {item.model}
                  </strong>
                  <span>{item.trim}</span>
                </button>
                <div className="admin-inventory-meta">
                  <span className="admin-inventory-meta-label">Year</span>
                  <strong>{item.year}</strong>
                </div>
                <div className="admin-inventory-meta">
                  <span className="admin-inventory-meta-label">Fuel</span>
                  <strong>{item.fuel}</strong>
                </div>
                <div className="admin-inventory-meta admin-inventory-price">
                  <span className="admin-inventory-meta-label">Price</span>
                  <strong>{formatPrice(item.price)}</strong>
                </div>
                <span
                  className={`admin-inventory-status ${item.isPublished === false ? 'is-draft' : ''}`}
                >
                  <span aria-hidden="true" /> {item.isPublished === false ? 'Draft' : 'Published'}
                </span>
                <div className="admin-inventory-actions">
                  <button
                    className="admin-icon-button"
                    type="button"
                    aria-label={`Actions for ${item.make} ${item.model}`}
                    aria-haspopup="menu"
                    aria-expanded={openMenu === itemKey}
                    onClick={() => setOpenMenu((current) => (current === itemKey ? null : itemKey))}
                  >
                    <MoreVertical size={17} />
                  </button>
                  {openMenu === itemKey ? (
                    <div className="admin-inventory-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenu(null);
                          if (item.id) onEdit(item.id);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="is-danger"
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenu(null);
                          if (item.id) void onDelete(item.id);
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {totalPages > 0 ? (
        <footer className="admin-inventory-pagination">
          <span>
            Showing {from}–{to} of {total} vehicles
          </span>
          <div>
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1 || fetching}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft size={15} /> Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                className={pageNumber === page ? 'is-active' : ''}
                type="button"
                aria-label={`Page ${pageNumber}`}
                aria-current={pageNumber === page ? 'page' : undefined}
                disabled={fetching}
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= totalPages || fetching}
              onClick={() => onPageChange(page + 1)}
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function VehicleEditor({
  initial,
  options,
  onSaved,
}: {
  initial?: Vehicle;
  options: { makes: InventoryOption[]; fuelTypes: InventoryOption[] };
  onSaved: (updated: Vehicle) => void;
}) {
  const [form, setForm] = useState<VehicleFormValues>(() =>
    initial
      ? vehicleToForm(toPayload(initial))
      : emptyVehicleForm(options.makes[0]?.id, options.fuelTypes[0]?.id),
  );
  const [validationErrors, setValidationErrors] = useState<VehicleFormErrors>({});
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const pendingPhotosRef = useRef<PendingPhoto[]>([]);
  const [savedId, setSavedId] = useState(initial?.id);
  const [existingPhotos, setExistingPhotos] = useState<Vehicle['photos'][number][]>(() => [
    ...(initial?.photos ?? []),
  ]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [photoOrderError, setPhotoOrderError] = useState(false);
  const [photoOrderPending, setPhotoOrderPending] = useState(false);
  const [activeSection, setActiveSection] = useState<VehicleEditorSection>('basic');
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setForm((current) => ({
      ...current,
      makeId: current.makeId || options.makes[0]?.id || '',
      fuelTypeId: current.fuelTypeId || options.fuelTypes[0]?.id || '',
    }));
  }, [options.fuelTypes, options.makes]);
  pendingPhotosRef.current = pendingPhotos;
  useEffect(
    () => () => pendingPhotosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview)),
    [],
  );

  const save = useMutation({
    mutationFn: async (payload: VehiclePayload) => {
      const result = savedId
        ? await updateAdminVehicle(savedId, payload)
        : await createAdminVehicle(payload);
      if (!result.id) throw new Error('The saved vehicle did not return an id.');
      setSavedId(result.id);
      if (pendingPhotos.length) {
        await uploadVehiclePhotos(
          result.id,
          pendingPhotos.map((photo) => photo.file),
        );
        pendingPhotos.forEach((photo) => URL.revokeObjectURL(photo.preview));
        setPendingPhotos([]);
      }
      return fetchAdminVehicle(result.id);
    },
    onSuccess: onSaved,
    onError: (error) => {
      const serverError = getServerVehicleError(error);
      setValidationErrors(serverError.fieldErrors);
      focusFirstVehicleError(serverError.fieldErrors);
      showSnackbar({ message: serverError.message, tone: 'error' });
    },
  });
  const removePhoto = useMutation({
    mutationFn: ({ id, photoId }: { id: string; photoId: string }) =>
      deleteVehiclePhoto(id, photoId),
    onSuccess: (_result, variables) => {
      setExistingPhotos((current) => current.filter((photo) => photo.id !== variables.photoId));
      showSnackbar({ message: 'Vehicle photo deleted successfully', tone: 'success' });
    },
    onError: () => showSnackbar({ message: 'Vehicle photo could not be deleted.', tone: 'error' }),
  });
  const set = <K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setValidationErrors((current) => removeValidationErrors(current, String(key)));
  };
  const handleSave = () => {
    const result = validateVehicleForm(form);
    if (!result.success) {
      setValidationErrors(result.errors);
      focusFirstVehicleError(result.errors);
      showSnackbar({ message: 'Fix the highlighted fields before saving.', tone: 'error' });
      return;
    }
    setValidationErrors({});
    save.mutate(result.data);
  };
  const handleFieldBlur = (field: string) => {
    const result = validateVehicleForm(form);
    if (result.success) {
      setValidationErrors((current) => removeValidationErrors(current, field));
      return;
    }
    const fieldErrors = Object.fromEntries(
      Object.entries(result.errors).filter(([key]) => key === field || key.startsWith(`${field}.`)),
    );
    setValidationErrors((current) => ({
      ...removeValidationErrors(current, field),
      ...fieldErrors,
    }));
  };
  const documents = form.documents;
  const customFields = form.customFields;
  const moveField = (from: number, to: number) => {
    const next = [...customFields];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    set(
      'customFields',
      next.map((field, order) => ({ ...field, order })),
    );
  };
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const selectedFiles = Array.from(files);
    const invalidFiles = selectedFiles.filter(
      (file) => !supportedImageTypes.has(file.type) || file.size > maxClientUploadBytes,
    );
    const validFiles = selectedFiles.filter(
      (file) => supportedImageTypes.has(file.type) && file.size <= maxClientUploadBytes,
    );
    if (invalidFiles.length) {
      setUploadError(
        `${invalidFiles.length} image${invalidFiles.length === 1 ? '' : 's'} rejected. Use JPEG, PNG, or WebP files up to 10 MB.`,
      );
    } else {
      setUploadError(null);
    }
    if (!validFiles.length) return;
    setPendingPhotos((current) => [
      ...current,
      ...validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  };
  const handlePhotoDragStart = (event: DragStartEvent) => setActiveDragId(String(event.active.id));
  const handlePendingPhotoDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    if (!event.over || event.active.id === event.over.id) return;
    const from = pendingPhotos.findIndex((photo) => `pending:${photo.id}` === event.active.id);
    const to = pendingPhotos.findIndex((photo) => `pending:${photo.id}` === event.over?.id);
    if (from >= 0 && to >= 0) setPendingPhotos(arrayMove(pendingPhotos, from, to));
  };
  const handlePhotoDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    if (!event.over || event.active.id === event.over.id) return;
    const from = existingPhotos.findIndex((photo) => `photo:${photo.id}` === event.active.id);
    const to = existingPhotos.findIndex((photo) => `photo:${photo.id}` === event.over?.id);
    if (from < 0 || to < 0) return;
    const previous = existingPhotos;
    const next = arrayMove(existingPhotos, from, to);
    setExistingPhotos(next);
    if (!savedId) return;
    setPhotoOrderError(false);
    setPhotoOrderPending(true);
    try {
      await reorderVehiclePhotos(
        savedId,
        next.map((photo) => photo.id),
      );
      showSnackbar({ message: 'Photo order saved successfully', tone: 'success' });
    } catch {
      setExistingPhotos(previous);
      setPhotoOrderError(true);
      showSnackbar({ message: 'Photo order could not be saved.', tone: 'error' });
    } finally {
      setPhotoOrderPending(false);
    }
  };
  const handleFieldDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    if (!event.over || event.active.id === event.over.id) return;
    const from = customFields.findIndex((field) => `field:${field.order}` === event.active.id);
    const to = customFields.findIndex((field) => `field:${field.order}` === event.over?.id);
    if (from >= 0 && to >= 0) moveField(from, to);
  };

  return (
    <div className="admin-panel-stack admin-vehicle-editor">
      <section className="admin-section-heading admin-editor-heading">
        <div>
          <Link className="back-link" to="/admin/inventory">
            <ArrowLeft size={15} /> Inventory
          </Link>
          <p className="admin-kicker">VEHICLE EDITOR</p>
          <h2>{initial ? 'Edit vehicle' : 'Add vehicle'}</h2>
          <p>Update the listing without leaving the workspace.</p>
        </div>
        <div className="admin-editor-heading-meta">
          <span className={`admin-status-pill ${form.isPublished ? 'is-published' : ''}`}>
            {form.isPublished ? 'Published' : 'Draft'}
          </span>
          <span>{existingPhotos.length + pendingPhotos.length} photos</span>
        </div>
      </section>
      <nav className="admin-editor-nav" aria-label="Vehicle editor sections">
        <p className="admin-editor-nav-label">EDIT LISTING</p>
        <div className="admin-editor-stepper">
          {vehicleEditorSections.map((section, index) => (
            <button
              key={section.id}
              className={`admin-editor-step${activeSection === section.id ? ' is-active' : ''}`}
              type="button"
              aria-current={activeSection === section.id ? 'page' : undefined}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="admin-editor-nav-index">{index + 1}</span>
              <span>
                <strong>{section.label}</strong>
                <small>{section.description}</small>
                {sectionErrorCount(validationErrors, section.id) ? (
                  <em>
                    {sectionErrorCount(validationErrors, section.id)} error
                    {sectionErrorCount(validationErrors, section.id) === 1 ? '' : 's'}
                  </em>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </nav>
      <div className="admin-editor-layout">
        <main className="admin-editor-main">
          {activeSection === 'basic' ? (
            <BasicSection
              form={form}
              options={options}
              set={set}
              errors={validationErrors}
              onFieldBlur={handleFieldBlur}
            />
          ) : null}
          {activeSection === 'specifications' ? (
            <SpecificationsSection
              form={form}
              set={set}
              errors={validationErrors}
              onFieldBlur={handleFieldBlur}
            />
          ) : null}
          {activeSection === 'images' ? (
            <ImagesSection
              existingPhotos={existingPhotos}
              pendingPhotos={pendingPhotos}
              uploadError={uploadError}
              activeDragId={activeDragId}
              photoOrderError={photoOrderError}
              photoOrderPending={photoOrderPending}
              sensors={sensors}
              handleFiles={handleFiles}
              handlePhotoDragStart={handlePhotoDragStart}
              handlePhotoDragEnd={handlePhotoDragEnd}
              handlePendingPhotoDragEnd={handlePendingPhotoDragEnd}
              setActiveDragId={setActiveDragId}
              removePhoto={(photoId) => savedId && removePhoto.mutate({ id: savedId, photoId })}
              removePendingPhoto={(photo) => {
                URL.revokeObjectURL(photo.preview);
                setPendingPhotos((current) => current.filter((item) => item.id !== photo.id));
              }}
            />
          ) : null}
          {activeSection === 'documents' ? (
            <DocumentationSection
              documents={documents}
              set={set}
              errors={validationErrors}
              onFieldBlur={handleFieldBlur}
            />
          ) : null}
          {activeSection === 'custom' ? (
            <CustomSection
              customFields={customFields}
              set={set}
              errors={validationErrors}
              onFieldBlur={handleFieldBlur}
              activeDragId={activeDragId}
              sensors={sensors}
              handlePhotoDragStart={handlePhotoDragStart}
              handleFieldDragEnd={handleFieldDragEnd}
              setActiveDragId={setActiveDragId}
            />
          ) : null}
        </main>
        <aside className="admin-editor-checklist">
          <div className="admin-editor-checklist-card">
            <div className="admin-editor-checklist-heading">
              <div>
                <p className="admin-kicker">BEFORE YOU SAVE</p>
                <h3>Review the listing</h3>
              </div>
              <CircleAlert size={20} aria-hidden="true" />
            </div>
            {Object.keys(validationErrors).length ? (
              <div className="admin-editor-validation" role="alert">
                <strong>Fix the highlighted fields before saving.</strong>
                <ul className="admin-validation-summary">
                  {Object.entries(validationErrors)
                    .slice(0, 5)
                    .map(([field, message]) => (
                      <li key={field}>
                        <CircleAlert size={14} aria-hidden="true" /> {message}
                      </li>
                    ))}
                </ul>
                {Object.keys(validationErrors).length > 5 ? (
                  <span>
                    There are {Object.keys(validationErrors).length - 5} more errors below.
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="admin-editor-checklist-empty">Required fields are ready for review.</p>
            )}
            <div className="admin-editor-checklist-actions">
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => navigate('/admin/inventory')}
              >
                Cancel
              </button>
              <button
                className="admin-save-button"
                type="button"
                disabled={save.isPending}
                onClick={handleSave}
              >
                <Save size={16} /> {save.isPending ? 'Saving…' : 'Save vehicle'}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DocumentationSection({
  documents,
  set,
  errors,
  onFieldBlur,
}: {
  documents: VehicleFormValues['documents'];
  set: <K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) => void;
  errors: VehicleFormErrors;
  onFieldBlur: (field: string) => void;
}) {
  return (
    <section className="admin-modern-card admin-editor-section-card">
      <div className="admin-card-heading">
        <SectionHeading
          kicker="RECORDS & PAPERWORK"
          title="Documentation"
          description="Add the records and paperwork shown on the public vehicle page."
        />
        <button
          className="admin-secondary-button"
          type="button"
          onClick={() =>
            set('documents', [
              ...documents,
              { name: '', status: 'Not provided', url: '', order: documents.length },
            ])
          }
        >
          <Plus size={15} /> Add document
        </button>
      </div>
      {documents.length ? (
        <div className="admin-document-list">
          {documents.map((document, index) => (
            <div className="admin-document-row" key={`document-${index}`}>
              <label className="admin-field">
                <span>Document</span>
                <input
                  data-validation-key={`documents.${index}.name`}
                  aria-invalid={Boolean(errors[`documents.${index}.name`])}
                  aria-describedby={
                    errors[`documents.${index}.name`] ? `documents-${index}-name-error` : undefined
                  }
                  value={document.name}
                  onChange={(event) =>
                    set(
                      'documents',
                      documents.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, name: event.target.value } : item,
                      ),
                    )
                  }
                  onBlur={() => onFieldBlur(`documents.${index}.name`)}
                  placeholder="e.g. Vehicle history report"
                />
                {errors[`documents.${index}.name`] ? (
                  <small className="admin-field-error" id={`documents-${index}-name-error`}>
                    {errors[`documents.${index}.name`]}
                  </small>
                ) : null}
              </label>
              <div className="admin-document-actions">
                <label className="admin-document-available">
                  <span>Available</span>
                  <input
                    type="checkbox"
                    checked={document.status === 'On file' || document.status === 'Online'}
                    onChange={(event) =>
                      set(
                        'documents',
                        documents.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                status: event.target.checked ? 'On file' : 'Not provided',
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  className="admin-icon-button danger admin-document-delete"
                  aria-label={`Delete document ${document.name || index + 1}`}
                  onClick={() =>
                    set(
                      'documents',
                      documents
                        .filter((_, itemIndex) => itemIndex !== index)
                        .map((item, order) => ({ ...item, order })),
                    )
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="admin-empty-state">No documents have been added yet.</p>
      )}
    </section>
  );
}

function BasicSection({
  form,
  options,
  set,
  errors,
  onFieldBlur,
}: {
  form: VehicleFormValues;
  options: { makes: InventoryOption[]; fuelTypes: InventoryOption[] };
  set: <K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) => void;
  errors: VehicleFormErrors;
  onFieldBlur: (field: string) => void;
}) {
  return (
    <section className="admin-modern-card admin-editor-section-card">
      <SectionHeading kicker="BASIC INFORMATION" title="Identity and availability" />
      <div className="admin-form-grid">
        <Field
          name="slug"
          label="Slug"
          value={form.slug}
          error={errors.slug}
          required
          onBlur={() => onFieldBlur('slug')}
          onChange={(value) => set('slug', value)}
        />
        <SelectField
          name="makeId"
          label="Make"
          value={form.makeId}
          error={errors.makeId}
          required
          onBlur={() => onFieldBlur('makeId')}
          options={options.makes}
          onChange={(value) => set('makeId', value)}
        />
        <Field
          name="model"
          label="Model"
          value={form.model}
          error={errors.model}
          required
          onBlur={() => onFieldBlur('model')}
          onChange={(value) => set('model', value)}
        />
        <Field
          name="trim"
          label="Trim"
          value={form.trim}
          error={errors.trim}
          required
          onBlur={() => onFieldBlur('trim')}
          onChange={(value) => set('trim', value)}
        />
        <Field
          name="category"
          label="Category"
          value={form.category}
          error={errors.category}
          required
          onBlur={() => onFieldBlur('category')}
          onChange={(value) => set('category', value)}
        />
        <Field
          name="year"
          label="Year"
          type="number"
          value={form.year}
          error={errors.year}
          required
          onBlur={() => onFieldBlur('year')}
          onChange={(value) => set('year', value)}
        />
        <SelectField
          name="fuelTypeId"
          label="Fuel type"
          value={form.fuelTypeId}
          error={errors.fuelTypeId}
          required
          onBlur={() => onFieldBlur('fuelTypeId')}
          options={options.fuelTypes}
          onChange={(value) => set('fuelTypeId', value)}
        />
        <Field
          name="vin"
          label="VIN / reference"
          value={form.vin}
          error={errors.vin}
          required
          onBlur={() => onFieldBlur('vin')}
          onChange={(value) => set('vin', value)}
        />
        <label className="admin-field admin-field-checkbox">
          <span>Published</span>
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(event) => set('isPublished', event.target.checked)}
          />
        </label>
      </div>
    </section>
  );
}

function SpecificationsSection({
  form,
  set,
  errors,
  onFieldBlur,
}: {
  form: VehicleFormValues;
  set: <K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) => void;
  errors: VehicleFormErrors;
  onFieldBlur: (field: string) => void;
}) {
  return (
    <section className="admin-modern-card admin-editor-section-card">
      <SectionHeading kicker="PRICING & SPECIFICATIONS" title="What buyers need to know" />
      <div className="admin-form-grid">
        <Field
          name="price"
          label="Price"
          type="number"
          value={form.price}
          error={errors.price}
          required
          onBlur={() => onFieldBlur('price')}
          onChange={(value) => set('price', value)}
        />
        <Field
          name="mileage"
          label="Mileage"
          type="number"
          value={form.mileage}
          error={errors.mileage}
          required
          onBlur={() => onFieldBlur('mileage')}
          onChange={(value) => set('mileage', value)}
        />
        <Field
          name="exterior"
          label="Exterior"
          value={form.exterior}
          error={errors.exterior}
          required
          onBlur={() => onFieldBlur('exterior')}
          onChange={(value) => set('exterior', value)}
        />
        <Field
          name="interior"
          label="Interior"
          value={form.interior}
          error={errors.interior}
          required
          onBlur={() => onFieldBlur('interior')}
          onChange={(value) => set('interior', value)}
        />
        <Field
          name="engine"
          label="Engine"
          value={form.engine}
          error={errors.engine}
          required
          onBlur={() => onFieldBlur('engine')}
          onChange={(value) => set('engine', value)}
        />
        <Field
          name="power"
          label="Power"
          value={form.power}
          error={errors.power}
          required
          onBlur={() => onFieldBlur('power')}
          onChange={(value) => set('power', value)}
        />
        <Field
          name="torque"
          label="Torque"
          value={form.torque}
          error={errors.torque}
          required
          onBlur={() => onFieldBlur('torque')}
          onChange={(value) => set('torque', value)}
        />
        <Field
          name="transmission"
          label="Transmission"
          value={form.transmission}
          error={errors.transmission}
          required
          onBlur={() => onFieldBlur('transmission')}
          onChange={(value) => set('transmission', value)}
        />
        <Field
          name="drivetrain"
          label="Drivetrain"
          value={form.drivetrain}
          error={errors.drivetrain}
          required
          onBlur={() => onFieldBlur('drivetrain')}
          onChange={(value) => set('drivetrain', value)}
        />
        <Field
          name="range"
          label="Range"
          value={form.range}
          error={errors.range}
          onBlur={() => onFieldBlur('range')}
          onChange={(value) => set('range', value)}
        />
        <TextAreaField
          name="description"
          label="Description"
          value={form.description}
          error={errors.description}
          required
          onBlur={() => onFieldBlur('description')}
          onChange={(value) => set('description', value)}
        />
      </div>
      <HighlightsEditor
        values={form.highlights}
        errors={errors}
        onFieldBlur={onFieldBlur}
        onChange={(highlights) => set('highlights', highlights)}
      />
    </section>
  );
}

function HighlightsEditor({
  values,
  errors,
  onFieldBlur,
  onChange,
}: {
  values: VehicleFormValues['highlights'];
  errors: VehicleFormErrors;
  onFieldBlur: (field: string) => void;
  onChange: (values: VehicleFormValues['highlights']) => void;
}) {
  return (
    <div className="admin-list-editor">
      <div className="admin-card-heading">
        <div>
          <p className="admin-kicker">HIGHLIGHTS</p>
          <h4>Key selling points</h4>
        </div>
        <button
          className="admin-secondary-button"
          type="button"
          onClick={() => onChange([...values, { text: '', order: values.length }])}
        >
          <Plus size={15} /> Add highlight
        </button>
      </div>
      <div className="admin-list-editor-items">
        {values.map((highlight, index) => (
          <div className="admin-list-editor-row" key={`highlight-${highlight.order}`}>
            <input
              data-validation-key={`highlights.${index}.text`}
              aria-invalid={Boolean(errors[`highlights.${index}.text`])}
              aria-describedby={
                errors[`highlights.${index}.text`] ? `highlight-${index}-error` : undefined
              }
              aria-label={`Highlight ${index + 1}`}
              value={highlight.text}
              onBlur={() => onFieldBlur(`highlights.${index}.text`)}
              placeholder="e.g. Panoramic sunroof"
              onChange={(event) =>
                onChange(
                  values.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, text: event.target.value } : item,
                  ),
                )
              }
            />
            {errors[`highlights.${index}.text`] ? (
              <small className="admin-field-error" id={`highlight-${index}-error`}>
                {errors[`highlights.${index}.text`]}
              </small>
            ) : null}
            <button
              className="admin-icon-button danger"
              type="button"
              aria-label={`Delete highlight ${index + 1}`}
              onClick={() =>
                onChange(
                  values
                    .filter((_, itemIndex) => itemIndex !== index)
                    .map((item, order) => ({ ...item, order })),
                )
              }
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {!values.length ? (
          <p className="admin-list-editor-empty">No highlights added yet.</p>
        ) : null}
      </div>
    </div>
  );
}

function ImagesSection({
  existingPhotos,
  pendingPhotos,
  uploadError,
  activeDragId,
  photoOrderError,
  photoOrderPending,
  sensors,
  handleFiles,
  handlePhotoDragStart,
  handlePhotoDragEnd,
  handlePendingPhotoDragEnd,
  setActiveDragId,
  removePhoto,
  removePendingPhoto,
}: {
  existingPhotos: Vehicle['photos'][number][];
  pendingPhotos: PendingPhoto[];
  uploadError: string | null;
  activeDragId: string | null;
  photoOrderError: boolean;
  photoOrderPending: boolean;
  sensors: ReturnType<typeof useSensors>;
  handleFiles: (files: FileList | null) => void;
  handlePhotoDragStart: (event: DragStartEvent) => void;
  handlePhotoDragEnd: (event: DragEndEvent) => void;
  handlePendingPhotoDragEnd: (event: DragEndEvent) => void;
  setActiveDragId: (id: string | null) => void;
  removePhoto: (photoId: string) => void;
  removePendingPhoto: (photo: PendingPhoto) => void;
}) {
  return (
    <section className="admin-modern-card admin-editor-section-card">
      <div className="admin-card-heading">
        <SectionHeading
          kicker="IMAGES"
          title="Upload and order photos"
          description="Select images for preview, then save to upload them as WebP."
        />
        <label className="admin-secondary-button">
          <UploadCloud size={15} /> Select images
          <input
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
      </div>
      <p className="admin-dnd-hint">
        <GripVertical size={14} /> Drag the handle to reorder photos.
      </p>
      {photoOrderPending ? (
        <p className="admin-dnd-status" role="status">
          Saving photo order…
        </p>
      ) : null}
      {photoOrderError ? (
        <p className="admin-form-error" role="alert">
          Photo order could not be saved. Your previous order was restored.
        </p>
      ) : null}
      {uploadError ? (
        <p className="admin-form-error" role="alert">
          {uploadError}
        </p>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handlePhotoDragStart}
        onDragEnd={handlePhotoDragEnd}
        onDragCancel={() => setActiveDragId(null)}
      >
        <SortableContext
          items={existingPhotos.map((photo) => `photo:${photo.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="admin-inventory-photo-grid">
            {existingPhotos.map((photo, index) => (
              <SortablePhoto
                key={photo.id}
                photo={photo}
                index={index}
                onDelete={() => removePhoto(photo.id)}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeDragId?.startsWith('photo:') ? (
            <div className="admin-drag-overlay">Moving photo</div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handlePhotoDragStart}
        onDragEnd={handlePendingPhotoDragEnd}
        onDragCancel={() => setActiveDragId(null)}
      >
        <SortableContext
          items={pendingPhotos.map((photo) => `pending:${photo.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="admin-inventory-photo-grid admin-pending-photo-grid">
            {pendingPhotos.map((photo, index) => (
              <SortablePendingPhoto
                key={photo.id}
                photo={photo}
                index={index}
                onDelete={() => removePendingPhoto(photo)}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeDragId?.startsWith('pending:') ? (
            <div className="admin-drag-overlay">Moving photo</div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}

function CustomSection({
  customFields,
  set,
  errors,
  onFieldBlur,
  activeDragId,
  sensors,
  handlePhotoDragStart,
  handleFieldDragEnd,
  setActiveDragId,
}: {
  customFields: VehicleFormValues['customFields'];
  set: <K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) => void;
  errors: VehicleFormErrors;
  onFieldBlur: (field: string) => void;
  activeDragId: string | null;
  sensors: ReturnType<typeof useSensors>;
  handlePhotoDragStart: (event: DragStartEvent) => void;
  handleFieldDragEnd: (event: DragEndEvent) => void;
  setActiveDragId: (id: string | null) => void;
}) {
  return (
    <section className="admin-modern-card admin-editor-section-card">
      <div className="admin-card-heading">
        <SectionHeading
          kicker="CUSTOM DETAILS"
          title="Flexible label/value fields"
          description="Drag rows to change display order."
        />
        <button
          className="admin-secondary-button"
          type="button"
          onClick={() =>
            set('customFields', [
              ...customFields,
              { label: '', value: '', order: customFields.length },
            ])
          }
        >
          <Plus size={15} /> Add field
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handlePhotoDragStart}
        onDragEnd={handleFieldDragEnd}
        onDragCancel={() => setActiveDragId(null)}
      >
        <SortableContext
          items={customFields.map((field) => `field:${field.order}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="admin-custom-field-list">
            {customFields.map((field, index) => (
              <SortableCustomField
                key={`field:${field.order}`}
                field={field}
                index={index}
                errors={errors}
                onFieldBlur={onFieldBlur}
                onChange={(next) =>
                  set(
                    'customFields',
                    customFields.map((item, itemIndex) => (itemIndex === index ? next : item)),
                  )
                }
                onDelete={() =>
                  set(
                    'customFields',
                    customFields
                      .filter((_, itemIndex) => itemIndex !== index)
                      .map((item, order) => ({ ...item, order })),
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeDragId?.startsWith('field:') ? (
            <div className="admin-drag-overlay">Moving field</div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}

function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="admin-editor-section-heading">
      <p className="admin-kicker">{kicker}</p>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
function SortablePhoto({
  photo,
  index,
  onDelete,
}: {
  photo: Vehicle['photos'][number];
  index: number;
  onDelete: () => void;
}) {
  const sortable = useSortable({ id: `photo:${photo.id}` });
  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={`admin-inventory-photo${sortable.isDragging ? ' is-dragging' : ''}`}
    >
      <img src={photo.src} alt={photo.alt} />
      <button
        type="button"
        className="admin-photo-drag-handle"
        aria-label={`Drag photo ${index + 1} to reorder`}
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <GripVertical size={14} /> <span>{index + 1}</span>
      </button>
      <button
        type="button"
        className="admin-photo-delete"
        aria-label="Delete vehicle photo"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
function SortablePendingPhoto({
  photo,
  index,
  onDelete,
}: {
  photo: PendingPhoto;
  index: number;
  onDelete: () => void;
}) {
  const sortable = useSortable({ id: `pending:${photo.id}` });
  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={`admin-inventory-photo is-pending${sortable.isDragging ? ' is-dragging' : ''}`}
    >
      <img src={photo.preview} alt={photo.file.name} />
      <button
        type="button"
        className="admin-photo-drag-handle"
        aria-label={`Drag pending photo ${index + 1} to reorder`}
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <GripVertical size={14} /> <span>Pending {index + 1}</span>
      </button>
      <button
        type="button"
        className="admin-photo-delete"
        aria-label="Remove pending photo"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
function SortableCustomField({
  field,
  index,
  errors,
  onFieldBlur,
  onChange,
  onDelete,
}: {
  field: VehicleFormValues['customFields'][number];
  index: number;
  errors: VehicleFormErrors;
  onFieldBlur: (field: string) => void;
  onChange: (field: VehicleFormValues['customFields'][number]) => void;
  onDelete: () => void;
}) {
  const sortable = useSortable({ id: `field:${field.order}` });
  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={`admin-custom-field-row${sortable.isDragging ? ' is-dragging' : ''}`}
    >
      <button
        type="button"
        className="admin-drag-handle"
        aria-label={`Drag field ${field.label || field.order + 1} to reorder`}
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <GripVertical size={16} />
      </button>
      <input
        data-validation-key={`customFields.${index}.label`}
        aria-invalid={Boolean(errors[`customFields.${index}.label`])}
        aria-describedby={
          errors[`customFields.${index}.label`] ? `custom-field-${index}-label-error` : undefined
        }
        aria-label="Field label"
        value={field.label}
        onBlur={() => onFieldBlur(`customFields.${index}.label`)}
        onChange={(event) => onChange({ ...field, label: event.target.value })}
        placeholder="Label"
      />
      <input
        data-validation-key={`customFields.${index}.value`}
        aria-invalid={Boolean(errors[`customFields.${index}.value`])}
        aria-describedby={
          errors[`customFields.${index}.value`] ? `custom-field-${index}-value-error` : undefined
        }
        aria-label="Field value"
        value={field.value}
        onBlur={() => onFieldBlur(`customFields.${index}.value`)}
        onChange={(event) => onChange({ ...field, value: event.target.value })}
        placeholder="Value"
      />
      {errors[`customFields.${index}.label`] ? (
        <small className="admin-field-error" id={`custom-field-${index}-label-error`}>
          {errors[`customFields.${index}.label`]}
        </small>
      ) : null}
      {errors[`customFields.${index}.value`] ? (
        <small className="admin-field-error" id={`custom-field-${index}-value-error`}>
          {errors[`customFields.${index}.value`]}
        </small>
      ) : null}
      <button
        type="button"
        className="admin-icon-button danger"
        aria-label="Delete custom field"
        onClick={onDelete}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function LookupEditor({ type }: { type: 'makes' | 'fuel-types' }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMake = type === 'makes';
  const singularLabel = isMake ? 'make' : 'fuel type';
  const pluralLabel = isMake ? 'makes' : 'fuel types';
  const { showSnackbar } = useSnackbar();
  const query = useQuery({
    queryKey: [`admin-${type}`],
    queryFn: isMake ? fetchAdminMakes : fetchAdminFuelTypes,
  });
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const create = useMutation({
    mutationFn: () => (isMake ? createAdminMake(name) : createAdminFuelType(name)),
    onSuccess: () => {
      setName('');
      setIsAdding(false);
      void queryClient.invalidateQueries({ queryKey: [`admin-${type}`] });
      showSnackbar({
        message: `${isMake ? 'Make' : 'Fuel type'} added successfully`,
        tone: 'success',
      });
    },
    onError: () =>
      showSnackbar({
        message: `${isMake ? 'Make' : 'Fuel type'} could not be added.`,
        tone: 'error',
      }),
  });
  return (
    <div className="admin-panel-stack admin-settings-panel-stack">
      <section className="admin-section-heading admin-settings-heading">
        <div>
          <p className="admin-kicker">INVENTORY SETTINGS</p>
          <h2>{isMake ? 'Makes' : 'Fuel types'}</h2>
          <p>Manage the options shown in vehicle forms and public filters.</p>
        </div>
      </section>

      <section className="admin-modern-card admin-settings-workspace">
        <nav className="admin-settings-rail" aria-label="Inventory option types">
          <button
            className={isMake ? 'active' : ''}
            type="button"
            aria-current={isMake ? 'page' : undefined}
            onClick={() => navigate('/admin/inventory/makes')}
          >
            <span aria-hidden="true" /> Makes
          </button>
          <button
            className={!isMake ? 'active' : ''}
            type="button"
            aria-current={!isMake ? 'page' : undefined}
            onClick={() => navigate('/admin/inventory/fuel-types')}
          >
            <span aria-hidden="true" /> Fuel types
          </button>
        </nav>

        <div className="admin-settings-content">
          <div className="admin-settings-toolbar">
            <div>
              <strong>
                {query.data?.length ?? 0} {pluralLabel}
              </strong>
              <span>Available in the vehicle editor and public filters.</span>
            </div>
            <button
              className="admin-save-button"
              type="button"
              aria-expanded={isAdding}
              onClick={() => {
                if (isAdding) setName('');
                setIsAdding((current) => !current);
              }}
            >
              {isAdding ? <X size={15} /> : <Plus size={15} />}
              {isAdding ? 'Cancel' : `Add ${singularLabel}`}
            </button>
          </div>

          {isAdding ? (
            <div className="admin-settings-add-row">
              <label className="admin-field">
                <span>{isMake ? 'Make name' : 'Fuel type name'}</span>
                <input
                  autoFocus
                  aria-label={`New ${singularLabel}`}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && name.trim() && !create.isPending) create.mutate();
                    if (event.key === 'Escape') {
                      setName('');
                      setIsAdding(false);
                    }
                  }}
                  placeholder={isMake ? 'e.g. Volvo' : 'e.g. Diesel'}
                />
              </label>
              <button
                className="admin-save-button"
                type="button"
                disabled={!name.trim() || create.isPending}
                onClick={() => create.mutate()}
              >
                {create.isPending ? 'Adding…' : `Add ${singularLabel}`}
              </button>
            </div>
          ) : null}

          {query.isLoading ? <div className="admin-settings-state">Loading options…</div> : null}
          {query.isError ? (
            <div className="admin-settings-state is-error" role="alert">
              Options could not be loaded. Refresh and try again.
            </div>
          ) : null}
          {!query.isLoading && !query.isError && query.data?.length === 0 ? (
            <div className="admin-settings-state">No options added yet.</div>
          ) : null}
          {!query.isLoading && !query.isError && query.data?.length ? (
            <div className="admin-lookup-list">
              {query.data.map((item) => (
                <LookupRow key={item.id} item={item} type={type} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
function LookupRow({ item, type }: { item: InventoryOption; type: 'makes' | 'fuel-types' }) {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const [name, setName] = useState(item.name);
  const [isActive, setIsActive] = useState(item.isActive !== false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMake = type === 'makes';
  const singularLabel = isMake ? 'Make' : 'Fuel type';

  useEffect(() => {
    if (!isEditing) setName(item.name);
    setIsActive(item.isActive !== false);
  }, [isEditing, item.isActive, item.name]);

  const updateName = useMutation({
    mutationFn: () =>
      isMake
        ? updateAdminMake(item.id, name, isActive)
        : updateAdminFuelType(item.id, name, isActive),
    onSuccess: () => {
      setIsEditing(false);
      void queryClient.invalidateQueries({ queryKey: [`admin-${type}`] });
      showSnackbar({ message: `${singularLabel} updated successfully`, tone: 'success' });
    },
    onError: () =>
      showSnackbar({ message: `${singularLabel} could not be updated.`, tone: 'error' }),
  });
  const updateStatus = useMutation({
    mutationFn: (nextIsActive: boolean) =>
      isMake
        ? updateAdminMake(item.id, item.name, nextIsActive)
        : updateAdminFuelType(item.id, item.name, nextIsActive),
    onMutate: (nextIsActive) => setIsActive(nextIsActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [`admin-${type}`] });
      showSnackbar({ message: `${singularLabel} updated successfully`, tone: 'success' });
    },
    onError: () => {
      setIsActive(item.isActive !== false);
      showSnackbar({ message: `${singularLabel} could not be updated.`, tone: 'error' });
    },
  });
  const remove = useMutation({
    mutationFn: () => (isMake ? deleteAdminMake(item.id) : deleteAdminFuelType(item.id)),
    onSuccess: () => {
      setIsMenuOpen(false);
      void queryClient.invalidateQueries({ queryKey: [`admin-${type}`] });
      showSnackbar({ message: `${singularLabel} deleted successfully`, tone: 'success' });
    },
    onError: () =>
      showSnackbar({ message: `${singularLabel} could not be deleted.`, tone: 'error' }),
  });

  const cancelEditing = () => {
    setName(item.name);
    setIsEditing(false);
  };

  return (
    <div className={`admin-lookup-row${isEditing ? ' is-editing' : ''}`}>
      <div className="admin-lookup-name">
        {isEditing ? (
          <input
            autoFocus
            aria-label={`Edit ${item.name}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && name.trim() && !updateName.isPending)
                updateName.mutate();
              if (event.key === 'Escape') cancelEditing();
            }}
          />
        ) : (
          <strong>{item.name}</strong>
        )}
      </div>

      {isEditing ? (
        <div className="admin-lookup-edit-actions">
          <button
            className="admin-save-button"
            type="button"
            disabled={updateName.isPending || !name.trim()}
            onClick={() => updateName.mutate()}
          >
            {updateName.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            className="admin-secondary-button"
            type="button"
            disabled={updateName.isPending}
            onClick={cancelEditing}
          >
            Cancel
          </button>
        </div>
      ) : null}

      <div className="admin-lookup-status">
        <button
          className="admin-lookup-switch"
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label={`${item.name} active`}
          disabled={updateStatus.isPending}
          onClick={() => updateStatus.mutate(!isActive)}
        >
          <span aria-hidden="true" />
        </button>
        <span>{isActive ? 'Active' : 'Inactive'}</span>
      </div>

      {!isEditing ? (
        <button
          className="admin-lookup-action"
          type="button"
          aria-label={`Edit ${item.name}`}
          onClick={() => setIsEditing(true)}
        >
          <Pencil size={16} />
        </button>
      ) : null}

      <div className="admin-lookup-menu-wrap">
        <button
          className="admin-lookup-action"
          type="button"
          aria-label={`More actions for ${item.name}`}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <MoreVertical size={17} />
        </button>
        {isMenuOpen ? (
          <div className="admin-lookup-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              <Trash2 size={15} /> {remove.isPending ? 'Deleting…' : `Delete ${item.name}`}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  error,
  required = false,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="admin-field">
      <span>
        {label}
        {required ? (
          <em className="admin-required-mark" aria-hidden="true">
            *
          </em>
        ) : null}
        {required ? (
          <span className="sr-only" aria-hidden="true">
            required
          </span>
        ) : null}
      </span>
      <input
        data-validation-key={name}
        aria-invalid={Boolean(error)}
        aria-required={required || undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      {error ? (
        <small className="admin-field-error" id={`${name}-error`}>
          {error}
        </small>
      ) : null}
    </label>
  );
}
function TextAreaField({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  required = false,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="admin-field admin-field-full">
      <span>
        {label}
        {required ? (
          <em className="admin-required-mark" aria-hidden="true">
            *
          </em>
        ) : null}
        {required ? (
          <span className="sr-only" aria-hidden="true">
            required
          </span>
        ) : null}
      </span>
      <textarea
        data-validation-key={name}
        aria-invalid={Boolean(error)}
        aria-required={required || undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      {error ? (
        <small className="admin-field-error" id={`${name}-error`}>
          {error}
        </small>
      ) : null}
    </label>
  );
}
function SelectField({
  name,
  label,
  value,
  options,
  onChange,
  onBlur,
  error,
  required = false,
}: {
  name: string;
  label: string;
  value: string;
  options: InventoryOption[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <AdminDropdown
      className="admin-field"
      validationKey={name}
      label={label}
      value={value}
      invalid={Boolean(error)}
      error={error}
      onBlur={onBlur}
      required={required}
      placeholder={`Select ${label.toLowerCase()}`}
      options={options.map((item) => ({ value: item.id, label: item.name }))}
      onChange={onChange}
    />
  );
}
function toPayload(vehicle: Vehicle): VehiclePayload {
  return {
    slug: vehicle.slug,
    makeId: vehicle.makeId ?? '',
    fuelTypeId: vehicle.fuelTypeId ?? '',
    model: vehicle.model,
    trim: vehicle.trim,
    category: vehicle.category,
    year: vehicle.year,
    price: vehicle.price,
    mileage: vehicle.mileage,
    priceNegotiable: vehicle.priceNegotiable,
    exterior: vehicle.exterior,
    interior: vehicle.interior,
    vin: vehicle.vin,
    engine: vehicle.engine,
    power: vehicle.power,
    torque: vehicle.torque,
    transmission: vehicle.transmission,
    drivetrain: vehicle.drivetrain,
    range: vehicle.range ?? '',
    description: vehicle.description,
    isPublished: vehicle.isPublished !== false,
    documents: vehicle.documents.map((item, order) => ({
      name: item.name,
      status: item.status,
      url: item.url,
      order,
    })),
    highlights: vehicle.highlights.map((text, order) => ({ text, order })),
    customFields: (vehicle.customFields ?? []).map((item: VehicleCustomField) => ({
      label: item.label,
      value: item.value,
      order: item.order,
    })),
  };
}

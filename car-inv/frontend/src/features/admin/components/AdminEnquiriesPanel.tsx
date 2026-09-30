import { useState } from 'react';
import type { FormEvent } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, Search, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { frontendEnvironment } from '../../../config/env';
import { useSnackbar } from '../../../components/Snackbar';
import { deleteAdminEnquiry, fetchAdminEnquiries, updateAdminEnquiry } from '../api';
import type { AdminVehicleEnquiry, VehicleEnquiryStatus } from '../types';
import { AdminDropdown } from './AdminDropdown';
import { AdminEnquiryDrawer } from './AdminEnquiryDrawer';

const statuses: Array<{ value: VehicleEnquiryStatus; label: string }> = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'PURCHASED', label: 'Purchased' },
  { value: 'LOST', label: 'Lost' },
  { value: 'CLOSED', label: 'Closed' },
];

const mediaOrigin = (): string => {
  const apiUrl = new URL(frontendEnvironment.VITE_API_BASE_URL);
  return `${apiUrl.protocol}//${apiUrl.host}`;
};

const resolveMediaUrl = (url: string): string =>
  url.startsWith('/uploads/') ? `${mediaOrigin()}${url}` : url;

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));

const statusLabel = (value: VehicleEnquiryStatus): string =>
  statuses.find((item) => item.value === value)?.label ?? value;

export function AdminEnquiriesPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<VehicleEnquiryStatus | ''>('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [activeEnquiry, setActiveEnquiry] = useState<{
    enquiry: AdminVehicleEnquiry;
    mode: 'details' | 'edit';
  } | null>(null);

  const enquiries = useQuery({
    queryKey: ['admin-enquiries', { page, search, status }],
    queryFn: () =>
      fetchAdminEnquiries({
        page,
        pageSize: 10,
        search: search || undefined,
        status: status || undefined,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ([id, payload]: Parameters<typeof updateAdminEnquiry>) =>
      updateAdminEnquiry(id, payload),
    onSuccess: () => {
      setActiveEnquiry(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-enquiries'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-enquiry-summary'] });
      showSnackbar({ message: 'Enquiry updated successfully', tone: 'success' });
    },
    onError: () => showSnackbar({ message: 'Could not update the enquiry', tone: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminEnquiry,
    onSuccess: () => {
      setActiveEnquiry(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-enquiries'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-enquiry-summary'] });
      showSnackbar({ message: 'Enquiry deleted successfully', tone: 'success' });
    },
    onError: () => showSnackbar({ message: 'Could not delete the enquiry', tone: 'error' }),
  });

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const viewVehicle = (enquiry: AdminVehicleEnquiry) => {
    setOpenMenu(null);
    if (enquiry.vehicle.id) {
      navigate(`/admin/inventory/${enquiry.vehicle.id}/details`);
    } else if (enquiry.vehicle.slug) {
      navigate(`/inventory/${enquiry.vehicle.slug}`);
    }
  };

  const confirmDelete = (enquiry: AdminVehicleEnquiry) => {
    setOpenMenu(null);
    if (window.confirm(`Delete the enquiry from ${enquiry.customer.name}?`)) {
      deleteMutation.mutate(enquiry.id);
    }
  };

  return (
    <div className="admin-panel-stack admin-enquiries-panel">
      <section className="admin-section-heading">
        <div>
          <p className="admin-kicker">CUSTOMER PIPELINE</p>
          <h2>Vehicle enquiries</h2>
          <p>Review customer interest, follow-ups and completed purchases.</p>
        </div>
        <span className="admin-count-pill">{enquiries.data?.total ?? 0} enquiries</span>
      </section>

      <form className="admin-enquiries-toolbar" onSubmit={submitSearch}>
        <label className="admin-enquiries-search">
          <span className="sr-only">Search enquiries</span>
          <Search size={16} aria-hidden="true" />
          <input
            value={searchInput}
            placeholder="Search name, email, phone or vehicle"
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        <AdminDropdown
          className="admin-enquiries-status-filter"
          label="Filter by status"
          labelHidden
          value={status}
          ariaLabel="Filter by status"
          options={[{ value: '', label: 'All statuses' }, ...statuses]}
          onChange={(value) => {
            setPage(1);
            setStatus(value as VehicleEnquiryStatus | '');
          }}
        />
        <button className="admin-primary-button" type="submit">
          Search
        </button>
      </form>

      {enquiries.isLoading ? <p className="admin-loading-copy">Loading enquiries…</p> : null}
      {enquiries.isError ? (
        <p className="admin-error-copy">We couldn’t load enquiries. Please try again.</p>
      ) : null}
      {!enquiries.isLoading && !enquiries.isError && enquiries.data?.items.length === 0 ? (
        <div className="admin-empty-state">
          <strong>No enquiries found.</strong>
          <span>New customer enquiries will appear here.</span>
        </div>
      ) : null}
      {enquiries.data?.items.length ? (
        <div className="admin-enquiries-list" role="table" aria-label="Vehicle enquiries">
          <div className="admin-enquiries-list-header" role="row">
            <span role="columnheader">Customer</span>
            <span role="columnheader">Vehicle</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Received</span>
            <span role="columnheader">Actions</span>
          </div>
          {enquiries.data.items.map((enquiry) => (
            <EnquiryRow
              key={enquiry.id}
              enquiry={enquiry}
              openMenu={openMenu === enquiry.id}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === enquiry.id}
              onOpenMenu={() =>
                setOpenMenu((current) => (current === enquiry.id ? null : enquiry.id))
              }
              onOpenDetails={() => {
                setOpenMenu(null);
                setActiveEnquiry({ enquiry, mode: 'details' });
              }}
              onEdit={() => {
                setOpenMenu(null);
                setActiveEnquiry({ enquiry, mode: 'edit' });
              }}
              onDelete={() => confirmDelete(enquiry)}
              onViewVehicle={() => viewVehicle(enquiry)}
            />
          ))}
        </div>
      ) : null}

      {enquiries.data && enquiries.data.totalPages > 1 ? (
        <nav className="admin-enquiries-pagination" aria-label="Enquiry pages">
          <span>
            Page {enquiries.data.page} of {enquiries.data.totalPages}
          </span>
          <div>
            <button
              type="button"
              aria-label="Previous enquiries page"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next enquiries page"
              disabled={page === enquiries.data.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </nav>
      ) : null}

      {activeEnquiry ? (
        <AdminEnquiryDrawer
          enquiry={activeEnquiry.enquiry}
          mode={activeEnquiry.mode}
          isSaving={updateMutation.isPending}
          onClose={() => setActiveEnquiry(null)}
          onViewVehicle={() => viewVehicle(activeEnquiry.enquiry)}
          onSave={(payload) => updateMutation.mutate([activeEnquiry.enquiry.id, payload])}
        />
      ) : null}
    </div>
  );
}

function EnquiryRow({
  enquiry,
  openMenu,
  isDeleting,
  onOpenMenu,
  onOpenDetails,
  onEdit,
  onDelete,
  onViewVehicle,
}: {
  enquiry: AdminVehicleEnquiry;
  openMenu: boolean;
  isDeleting: boolean;
  onOpenMenu: () => void;
  onOpenDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewVehicle: () => void;
}) {
  return (
    <article className="admin-enquiry-row" role="row">
      <div className="admin-enquiry-customer-cell" role="cell">
        <button className="admin-enquiry-customer-link" type="button" onClick={onOpenDetails}>
          <strong>{enquiry.customer.name}</strong>
        </button>
        <span>{enquiry.customer.email || enquiry.customer.phone || 'No contact provided'}</span>
      </div>
      <div className="admin-enquiry-vehicle-cell" role="cell">
        <button
          className="admin-enquiry-vehicle-link"
          type="button"
          disabled={!enquiry.vehicle.id && !enquiry.vehicle.slug}
          onClick={onViewVehicle}
        >
          <span className="admin-enquiry-thumbnail">
            {enquiry.vehicle.imageUrl ? (
              <img
                src={resolveMediaUrl(enquiry.vehicle.imageUrl)}
                alt={enquiry.vehicle.imageAlt ?? enquiry.vehicle.label}
                loading="lazy"
              />
            ) : (
              <span>No image</span>
            )}
          </span>
          <strong>{enquiry.vehicle.label}</strong>
        </button>
      </div>
      <div role="cell">
        <span
          className={`admin-enquiry-status admin-enquiry-status-${enquiry.status.toLowerCase()}`}
        >
          <span aria-hidden="true" /> {statusLabel(enquiry.status)}
        </span>
      </div>
      <div className="admin-enquiry-date" role="cell">
        {formatDate(enquiry.createdAt)}
      </div>
      <div className="admin-enquiry-actions" role="cell">
        <button
          className="admin-icon-button"
          type="button"
          aria-label={`More actions for ${enquiry.customer.name}`}
          aria-haspopup="menu"
          aria-expanded={openMenu}
          disabled={isDeleting}
          onClick={onOpenMenu}
        >
          <MoreVertical size={17} aria-hidden="true" />
        </button>
        {openMenu ? (
          <div className="admin-inventory-menu admin-enquiry-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={onViewVehicle}
              disabled={!enquiry.vehicle.id && !enquiry.vehicle.slug}
            >
              View car details
            </button>
            <button type="button" role="menuitem" onClick={onEdit}>
              Edit enquiry
            </button>
            <button className="is-danger" type="button" role="menuitem" onClick={onDelete}>
              <Trash2 size={14} aria-hidden="true" /> Delete enquiry
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { frontendEnvironment } from '../../../config/env';
import type { AdminVehicleEnquiry, VehicleEnquiryStatus } from '../types';
import { AdminDropdown } from './AdminDropdown';

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

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const formatPrice = (value?: number): string =>
  value === undefined
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);

type EnquirySavePayload = {
  status: VehicleEnquiryStatus;
  remarks: string;
  purchasePrice: number | null;
  purchaseDate: string | null;
};

export function AdminEnquiryDrawer({
  enquiry,
  mode,
  isSaving,
  onClose,
  onSave,
  onViewVehicle,
}: {
  enquiry: AdminVehicleEnquiry;
  mode: 'details' | 'edit';
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: EnquirySavePayload) => void;
  onViewVehicle: () => void;
}) {
  const [status, setStatus] = useState(enquiry.status);
  const [newRemark, setNewRemark] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(
    enquiry.purchasePrice === undefined ? '' : String(enquiry.purchasePrice),
  );
  const [purchaseDate, setPurchaseDate] = useState(
    enquiry.purchaseDate ? enquiry.purchaseDate.slice(0, 10) : '',
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isEditing = mode === 'edit';

  return (
    <div className="admin-enquiry-drawer-backdrop" onMouseDown={onClose}>
      <section
        className="admin-enquiry-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-enquiry-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="admin-enquiry-drawer-header">
          <div>
            <p className="admin-kicker">{isEditing ? 'EDIT ENQUIRY' : 'CUSTOMER DETAILS'}</p>
            <h2 id="admin-enquiry-drawer-title">{enquiry.customer.name}</h2>
          </div>
          <button
            className="admin-icon-button"
            type="button"
            aria-label="Close details"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="admin-enquiry-drawer-body">
          <section className="admin-enquiry-drawer-section">
            <p className="admin-kicker">CUSTOMER</p>
            <dl className="admin-enquiry-detail-list">
              <div>
                <dt>Phone</dt>
                <dd>{enquiry.customer.phone || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{enquiry.customer.email || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{enquiry.customer.fullAddress}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-enquiry-drawer-section admin-enquiry-drawer-vehicle">
            <div>
              <p className="admin-kicker">SELECTED CAR</p>
              <button
                className="admin-enquiry-drawer-vehicle-link"
                type="button"
                disabled={!enquiry.vehicle.id && !enquiry.vehicle.slug}
                onClick={onViewVehicle}
              >
                {enquiry.vehicle.imageUrl ? (
                  <img
                    src={resolveMediaUrl(enquiry.vehicle.imageUrl)}
                    alt={enquiry.vehicle.imageAlt ?? enquiry.vehicle.label}
                  />
                ) : (
                  <span className="admin-enquiry-drawer-no-image">No image</span>
                )}
                <strong>{enquiry.vehicle.label}</strong>
              </button>
            </div>
          </section>

          {isEditing ? (
            <section className="admin-enquiry-drawer-section admin-enquiry-editor">
              <AdminDropdown
                className="admin-field"
                label="Status"
                value={status}
                options={statuses}
                onChange={(value) => setStatus(value as VehicleEnquiryStatus)}
              />
              <label className="admin-field">
                <span>Add remark</span>
                <textarea
                  rows={4}
                  value={newRemark}
                  placeholder="Add a follow-up note or purchase context"
                  onChange={(event) => setNewRemark(event.target.value)}
                />
              </label>
              {status === 'PURCHASED' ? (
                <div className="admin-enquiry-editor-fields">
                  <label className="admin-field">
                    <span>Purchase price</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={purchasePrice}
                      onChange={(event) => setPurchasePrice(event.target.value)}
                    />
                  </label>
                  <label className="admin-field">
                    <span>Purchase date</span>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(event) => setPurchaseDate(event.target.value)}
                    />
                  </label>
                </div>
              ) : null}
              <RemarksHistory remarks={enquiry.remarksHistory} />
            </section>
          ) : (
            <section className="admin-enquiry-drawer-section">
              <p className="admin-kicker">ENQUIRY</p>
              <dl className="admin-enquiry-detail-list">
                <div>
                  <dt>Status</dt>
                  <dd>
                    {statuses.find((item) => item.value === enquiry.status)?.label ??
                      enquiry.status}
                  </dd>
                </div>
                <div>
                  <dt>Received</dt>
                  <dd>{formatDate(enquiry.createdAt)}</dd>
                </div>
                {enquiry.status === 'PURCHASED' ? (
                  <div>
                    <dt>Purchase</dt>
                    <dd>
                      {formatPrice(enquiry.purchasePrice)}
                      {enquiry.purchaseDate ? ` on ${formatDate(enquiry.purchaseDate)}` : ''}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <RemarksHistory remarks={enquiry.remarksHistory} />
            </section>
          )}
        </div>

        <footer className="admin-enquiry-drawer-footer">
          <button className="admin-secondary-button" type="button" onClick={onClose}>
            {isEditing ? 'Cancel' : 'Close'}
          </button>
          {isEditing ? (
            <button
              className="admin-save-button"
              type="button"
              disabled={isSaving}
              onClick={() =>
                onSave({
                  status,
                  remarks: newRemark,
                  purchasePrice: purchasePrice.trim() ? Number(purchasePrice) : null,
                  purchaseDate: purchaseDate || null,
                })
              }
            >
              {isSaving ? 'Saving…' : 'Save enquiry'}
            </button>
          ) : null}
        </footer>
      </section>
    </div>
  );
}

function RemarksHistory({ remarks }: { remarks: AdminVehicleEnquiry['remarksHistory'] }) {
  return (
    <div className="admin-enquiry-remarks-history" aria-label="Remarks history">
      <p className="admin-kicker">REMARKS HISTORY</p>
      {remarks.length === 0 ? (
        <p className="admin-enquiry-no-remarks">No remarks added.</p>
      ) : (
        <ol>
          {remarks.map((remark) => (
            <li key={remark.id}>
              <p>{remark.text}</p>
              <time dateTime={remark.createdAt}>{formatDateTime(remark.createdAt)}</time>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

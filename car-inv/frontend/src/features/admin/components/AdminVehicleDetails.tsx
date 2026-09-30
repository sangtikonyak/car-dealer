import {
  ArrowLeft,
  BarChart3,
  CarFront,
  Check,
  Edit3,
  FileText,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Vehicle } from '../../../types/vehicle';
import { VehicleGallery } from '../../inventory/components/VehicleGallery';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const mileage = new Intl.NumberFormat('en-US');

export function AdminVehicleDetails({ vehicle, onEdit }: { vehicle: Vehicle; onEdit: () => void }) {
  const availableDocuments = vehicle.documents.filter(
    (document) => document.status === 'On file' || document.status === 'Online',
  );
  const specs = [
    ['Year', String(vehicle.year)],
    ['Make & model', `${vehicle.make} ${vehicle.model}`],
    ['Trim', vehicle.trim],
    ['Body type', vehicle.category],
    ['Fuel type', vehicle.fuel],
    ['Mileage', `${mileage.format(vehicle.mileage)} miles`],
    ['Engine / motor', vehicle.engine],
    ['Transmission', vehicle.transmission],
    ['Drivetrain', vehicle.drivetrain],
    ['Exterior', vehicle.exterior],
    ['Interior', vehicle.interior],
    ['VIN / reference', vehicle.vin],
    ...(vehicle.range ? [['Range', vehicle.range]] : []),
  ];

  return (
    <div className="admin-vehicle-details">
      <header className="admin-vehicle-details-heading">
        <div>
          <Link className="admin-vehicle-details-breadcrumb" to="/admin/inventory">
            <ArrowLeft size={15} aria-hidden="true" /> Inventory / Vehicles
          </Link>
          <p className="admin-kicker">VEHICLE DETAILS</p>
          <h2>
            {vehicle.make} {vehicle.model}
          </h2>
          <p>
            {vehicle.trim} · {vehicle.year}
          </p>
        </div>
        <div className="admin-vehicle-details-actions">
          <span
            className={`admin-status-pill ${vehicle.isPublished === false ? '' : 'is-published'}`}
          >
            {vehicle.isPublished === false ? 'Draft' : 'Published'}
          </span>
          <button className="admin-save-button" type="button" onClick={onEdit}>
            <Edit3 size={15} aria-hidden="true" /> Edit vehicle
          </button>
        </div>
      </header>

      <section className="admin-vehicle-details-hero">
        <div className="admin-vehicle-details-gallery">
          {vehicle.photos.length ? (
            <VehicleGallery
              photos={vehicle.photos}
              vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            />
          ) : (
            <div className="admin-vehicle-details-no-photo">No vehicle photos uploaded yet.</div>
          )}
        </div>
        <div className="admin-vehicle-details-summary">
          <p className="admin-kicker">LISTING SUMMARY</p>
          <h1>
            {vehicle.make} {vehicle.model}
            <span>{vehicle.trim}</span>
          </h1>
          <p className="admin-vehicle-details-price">{currency.format(vehicle.price)}</p>
          <div className="admin-vehicle-details-quickfacts">
            <span>
              <Gauge size={15} aria-hidden="true" /> {mileage.format(vehicle.mileage)} miles
            </span>
            <span>{vehicle.fuel}</span>
            <span>{vehicle.photos.length} photos</span>
          </div>
          <p className="admin-vehicle-details-description">{vehicle.description}</p>
        </div>
      </section>

      <nav className="admin-vehicle-details-tabs" aria-label="Vehicle detail sections">
        <a href="#basic-information">Basic information</a>
        <a href="#specifications">Specifications</a>
        <a href="#images">Images</a>
        <a href="#custom-details">Custom details</a>
      </nav>

      <section className="admin-vehicle-details-grid">
        <section className="admin-modern-card admin-vehicle-detail-card" id="basic-information">
          <div className="admin-card-heading">
            <div>
              <p className="admin-kicker">BASIC INFORMATION</p>
              <h3>Identity and availability</h3>
            </div>
          </div>
          <dl className="admin-vehicle-spec-grid">
            {specs.slice(0, 6).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="admin-modern-card admin-vehicle-detail-card" id="specifications">
          <div className="admin-card-heading">
            <div>
              <p className="admin-kicker">SPECIFICATIONS</p>
              <h3>What buyers need to know</h3>
            </div>
          </div>
          <dl className="admin-vehicle-spec-grid">
            {specs.slice(6).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="admin-vehicle-detail-subsection">
            <strong>Performance</strong>
            <span>
              {vehicle.power} · {vehicle.torque}
            </span>
          </div>
        </section>

        <section className="admin-modern-card admin-vehicle-detail-card" id="images">
          <div className="admin-card-heading">
            <div>
              <p className="admin-kicker">IMAGES</p>
              <h3>Uploaded vehicle photos</h3>
            </div>
          </div>
          <p className="admin-vehicle-detail-muted">
            {vehicle.photos.length
              ? `${vehicle.photos.length} photos available in the gallery above.`
              : 'No photos have been uploaded.'}
          </p>
        </section>

        <section className="admin-modern-card admin-vehicle-detail-card" id="custom-details">
          <div className="admin-card-heading">
            <div>
              <p className="admin-kicker">CUSTOM DETAILS</p>
              <h3>Flexible listing information</h3>
            </div>
          </div>
          {vehicle.customFields?.length ? (
            <dl className="admin-vehicle-spec-grid">
              {[...vehicle.customFields]
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div key={field.id}>
                    <dt>{field.label}</dt>
                    <dd>{field.value}</dd>
                  </div>
                ))}
            </dl>
          ) : (
            <p className="admin-vehicle-detail-muted">No custom details have been added.</p>
          )}
        </section>

        <section className="admin-modern-card admin-vehicle-detail-card admin-vehicle-documents-card">
          <div className="admin-vehicle-documents-heading">
            <div>
              <p className="admin-kicker">RECORDS & PAPERWORK</p>
              <h3>Documentation</h3>
            </div>
            <div className="admin-vehicle-documents-summary">
              <Check size={16} aria-hidden="true" />
              {availableDocuments.length} of {vehicle.documents.length} available
            </div>
            <FileText size={23} aria-hidden="true" />
          </div>
          <div className="admin-vehicle-documents-progress" aria-hidden="true" />
          {vehicle.documents.length ? (
            <ul className="admin-vehicle-document-cards">
              {vehicle.documents.map((document) => {
                const isAvailable = document.status === 'On file' || document.status === 'Online';
                const documentName = document.name.toLowerCase();
                return (
                  <li key={document.name} className="admin-vehicle-document-card">
                    <span className="admin-vehicle-document-icon" aria-hidden="true">
                      {documentName.includes('insurance') ? <ShieldCheck size={25} /> : null}
                      {documentName.includes('history') ? <BarChart3 size={25} /> : null}
                      {documentName === 'rc' ? <CarFront size={25} /> : null}
                      {!['insurance', 'history', 'rc'].some((term) =>
                        documentName.includes(term),
                      ) ? (
                        <FileText size={25} />
                      ) : null}
                    </span>
                    <span className="admin-vehicle-document-copy">
                      <strong>{document.name}</strong>
                      <span className={isAvailable ? 'is-verified' : ''}>
                        <Check size={13} aria-hidden="true" />{' '}
                        {isAvailable ? 'Available' : document.status}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="admin-vehicle-detail-muted">No documents have been added yet.</p>
          )}
        </section>

        <aside className="admin-modern-card admin-vehicle-detail-card admin-vehicle-highlights-card">
          <p className="admin-kicker">AT A GLANCE</p>
          <h3>Highlights</h3>
          <ul>
            {vehicle.highlights.map((highlight) => (
              <li key={highlight}>
                <Check size={15} aria-hidden="true" /> {highlight}
              </li>
            ))}
          </ul>
          <div className="admin-vehicle-inspection-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Verify vehicle history and inspection records before publishing.</span>
          </div>
        </aside>
      </section>
    </div>
  );
}

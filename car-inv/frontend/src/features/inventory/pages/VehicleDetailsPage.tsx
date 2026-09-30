import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Fuel,
  Gauge,
  Paintbrush,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchVehicle } from '../api';
import { InventoryNotice } from '../components/InventoryNotice';
import { VehicleEnquiryForm } from '../components/VehicleEnquiryForm';
import { VehicleGallery } from '../components/VehicleGallery';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const mileage = new Intl.NumberFormat('en-US');

export function VehicleDetailsPage() {
  const { vehicleSlug } = useParams();
  const vehicleQuery = useQuery({
    queryKey: ['vehicle', vehicleSlug],
    queryFn: () => fetchVehicle(vehicleSlug ?? ''),
    enabled: Boolean(vehicleSlug),
  });
  const vehicle = vehicleQuery.data;
  const reduceMotion = useReducedMotion();
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const enquiryTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isEnquiryOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsEnquiryOpen(false);
        enquiryTriggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnquiryOpen]);

  const closeEnquiry = () => {
    setIsEnquiryOpen(false);
    window.setTimeout(() => enquiryTriggerRef.current?.focus(), 0);
  };

  if (vehicleQuery.isLoading)
    return (
      <main className="not-found-page">
        <p className="section-eyebrow">Loading vehicle</p>
        <h1 className="section-title">Preparing the details…</h1>
      </main>
    );
  if (vehicleQuery.isError)
    return (
      <main className="not-found-page">
        <p className="section-eyebrow">Inventory unavailable</p>
        <h1 className="section-title">We couldn’t load this vehicle.</h1>
        <button
          className="primary-button mt-8"
          type="button"
          onClick={() => void vehicleQuery.refetch()}
        >
          Try again
        </button>
      </main>
    );

  if (!vehicle) {
    return (
      <main className="not-found-page">
        <p className="section-eyebrow">Vehicle unavailable</p>
        <h1 className="section-title">We couldn’t find that car.</h1>
        <Link className="primary-button mt-8" to="/inventory">
          <ArrowLeft size={17} /> Back to inventory
        </Link>
      </main>
    );
  }

  const specs = [
    ['Year', String(vehicle.year)],
    ['Make & model', `${vehicle.make} ${vehicle.model}`],
    ['Trim', vehicle.trim],
    ['Body style', vehicle.category],
    ['Odometer', `${mileage.format(vehicle.mileage)} miles`],
    ['Fuel type', vehicle.fuel],
    ['Engine / motor', vehicle.engine],
    ['Power', vehicle.power],
    ['Torque', vehicle.torque],
    ['Transmission', vehicle.transmission],
    ['Drivetrain', vehicle.drivetrain],
    ...(vehicle.range ? [['Range', vehicle.range]] : []),
    ['Exterior color', vehicle.exterior],
    ['Interior', vehicle.interior],
    ['Vehicle reference', vehicle.vin],
  ];
  const isDocumentAvailable = (status: (typeof vehicle.documents)[number]['status']) =>
    status === 'On file' || status === 'Online';

  return (
    <main className="vehicle-detail-page">
      <motion.div
        className="vehicle-detail-topline"
        initial={reduceMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
      >
        <Link className="back-link" to="/inventory">
          <ArrowLeft size={16} aria-hidden="true" /> All inventory
        </Link>
        <span>Vehicle ref. {vehicle.vin}</span>
      </motion.div>

      <section className="vehicle-detail-hero">
        <motion.div
          className="vehicle-detail-gallery-column"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: 'easeOut' }}
        >
          <VehicleGallery
            photos={vehicle.photos}
            vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          />
        </motion.div>

        <motion.div
          className="vehicle-detail-summary"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.45,
            delay: reduceMotion ? 0 : 0.08,
            ease: 'easeOut',
          }}
        >
          <p className="section-eyebrow">
            {vehicle.year} · {vehicle.category}
          </p>
          <h1>
            {vehicle.make} {vehicle.model}
            <span>{vehicle.trim}</span>
          </h1>
          <p className="vehicle-detail-description">{vehicle.description}</p>
          <div className="vehicle-detail-price-row">
            <p className="vehicle-detail-price">{currency.format(vehicle.price)}</p>
            <span className={`vehicle-price-badge${vehicle.priceNegotiable ? ' negotiable' : ''}`}>
              {vehicle.priceNegotiable ? 'Negotiable' : 'Price firm'}
            </span>
          </div>
          <div className="vehicle-detail-quickfacts">
            <span>
              <Gauge size={16} aria-hidden="true" /> {mileage.format(vehicle.mileage)} miles
            </span>
            <span>{vehicle.fuel}</span>
            <span>{vehicle.transmission}</span>
          </div>
          <InventoryNotice />
          <button
            ref={enquiryTriggerRef}
            className="vehicle-enquiry-button"
            type="button"
            aria-expanded={isEnquiryOpen}
            aria-controls="vehicle-enquiry-form"
            onClick={() => setIsEnquiryOpen(true)}
          >
            <span>Enquire about this car</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </button>
          <p className="vehicle-enquiry-caption">
            Ask us about availability, inspection and a viewing.
          </p>
        </motion.div>
      </section>

      {isEnquiryOpen ? (
        <div
          className="vehicle-enquiry-modal"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEnquiry();
          }}
        >
          <VehicleEnquiryForm
            vehicleSlug={vehicle.slug}
            vehicleLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`}
            onClose={closeEnquiry}
          />
        </div>
      ) : null}

      <section className="vehicle-key-facts" aria-label="Key vehicle facts">
        <div>
          <span className="vehicle-key-fact-icon" aria-hidden="true">
            <Gauge size={18} />
          </span>
          <span className="vehicle-key-fact-label">Mileage</span>
          <strong>{mileage.format(vehicle.mileage)} miles</strong>
        </div>
        <div>
          <span className="vehicle-key-fact-icon" aria-hidden="true">
            <Fuel size={18} />
          </span>
          <span className="vehicle-key-fact-label">Engine</span>
          <strong>{vehicle.engine}</strong>
        </div>
        <div>
          <span className="vehicle-key-fact-icon" aria-hidden="true">
            <SlidersHorizontal size={18} />
          </span>
          <span className="vehicle-key-fact-label">Transmission</span>
          <strong>{vehicle.transmission}</strong>
        </div>
        <div>
          <span className="vehicle-key-fact-icon" aria-hidden="true">
            <Paintbrush size={18} />
          </span>
          <span className="vehicle-key-fact-label">Exterior colour</span>
          <strong>{vehicle.exterior}</strong>
        </div>
      </section>

      <section className="vehicle-detail-lower">
        <div className="vehicle-spec-panel">
          <div className="vehicle-section-heading">
            <div>
              <p className="section-eyebrow">Full vehicle details</p>
              <h2>Know what you’re looking at.</h2>
            </div>
          </div>
          <dl className="vehicle-spec-grid">
            {specs.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {vehicle.customFields?.length ? (
            <div className="vehicle-custom-fields">
              <p className="section-eyebrow">Additional details</p>
              <dl className="vehicle-spec-grid">
                {[...vehicle.customFields]
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.id}>
                      <dt>{field.label}</dt>
                      <dd>{field.value}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ) : null}
        </div>

        <aside className="vehicle-highlights-panel">
          <p className="section-eyebrow">At a glance</p>
          <h2>Highlights</h2>
          <ul>
            {vehicle.highlights.map((highlight) => (
              <li key={highlight}>
                <Check size={17} aria-hidden="true" /> {highlight}
              </li>
            ))}
          </ul>
          <div className="vehicle-inspection-note">
            <ShieldCheck size={19} aria-hidden="true" />
            <span>
              Vehicle history and inspection details should be independently verified before
              purchase.
            </span>
          </div>
        </aside>

        <section className="vehicle-documents-panel">
          <div className="vehicle-documents-heading">
            <div>
              <p className="section-eyebrow">Records & paperwork</p>
              <h2>Documentation</h2>
            </div>
          </div>
          <ul className="vehicle-document-cards" aria-label="Document availability">
            {vehicle.documents.map((document) => {
              const available = isDocumentAvailable(document.status);

              return (
                <li key={document.name} className="vehicle-document-card">
                  <strong>{document.name}</strong>
                  <span
                    className={`vehicle-document-status${available ? ' is-available' : ' is-unavailable'}`}
                    aria-label={`${document.name}: ${available ? 'Available' : 'Not available'}`}
                  >
                    {available ? (
                      <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                    ) : (
                      <X size={14} strokeWidth={2.5} aria-hidden="true" />
                    )}
                    {available ? 'Available' : 'Not available'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </section>
      <p className="vehicle-detail-disclaimer">
        Illustrative sample listing: price, mileage, VIN, equipment and document availability are
        demo values. Photos are public model-reference images and may not depict the exact trim or a
        vehicle currently for sale. Confirm all details and records with the seller.
      </p>
    </main>
  );
}

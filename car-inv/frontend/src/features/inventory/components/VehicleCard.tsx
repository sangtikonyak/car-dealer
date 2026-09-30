import { ArrowUpRight, CarFront, Gauge } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { Vehicle } from '../../../types/vehicle';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const mileage = new Intl.NumberFormat('en-US');

interface VehicleCardProps {
  readonly vehicle: Vehicle;
  readonly index: number;
}

export function VehicleCard({ vehicle, index }: VehicleCardProps) {
  const reduceMotion = useReducedMotion();
  const primaryPhoto = vehicle.photos[0];

  return (
    <Link
      className="vehicle-card-link"
      to={`/inventory/${vehicle.slug}`}
      aria-label={`View details for ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`}
    >
      <motion.article
        className="vehicle-card"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{
          duration: reduceMotion ? 0 : 0.55,
          delay: reduceMotion ? 0 : (index % 3) * 0.08,
        }}
        whileHover={reduceMotion ? undefined : { y: -5 }}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      >
        <div className="vehicle-card-image-wrap">
          <motion.div
            className="vehicle-card-image-reveal"
            initial={reduceMotion ? false : { opacity: 0, clipPath: 'inset(12% 12% 12% 12%)' }}
            whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{
              duration: reduceMotion ? 0 : 0.7,
              delay: reduceMotion ? 0 : (index % 3) * 0.1,
              ease: [0.22, 0.8, 0.2, 1],
            }}
          >
            {primaryPhoto ? (
              <img
                className="vehicle-card-image"
                src={primaryPhoto.src}
                alt={primaryPhoto.alt}
                loading="lazy"
              />
            ) : (
              <div
                className="vehicle-card-image-placeholder"
                aria-label="Vehicle image unavailable"
              >
                <CarFront size={42} aria-hidden="true" />
                <span>Image coming soon</span>
              </div>
            )}
          </motion.div>
          <span className="vehicle-card-year">{vehicle.year}</span>
          <span className="vehicle-card-photo-count">{vehicle.photos.length} photos</span>
          <span className="vehicle-card-arrow" aria-hidden="true">
            <ArrowUpRight size={18} />
          </span>
        </div>
        <div className="vehicle-card-content">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="vehicle-card-make">{vehicle.make}</p>
              <h2 className="vehicle-card-title">
                {vehicle.model} <span>{vehicle.trim}</span>
              </h2>
            </div>
            <div className="vehicle-card-price-wrap">
              <p className="vehicle-card-price">{currency.format(vehicle.price)}</p>
              <span className="vehicle-price-status">
                {vehicle.priceNegotiable ? 'Negotiable' : 'Price firm'}
              </span>
            </div>
          </div>
          <div className="vehicle-card-meta">
            <span>
              <Gauge size={15} aria-hidden="true" /> {mileage.format(vehicle.mileage)} mi
            </span>
            <span>{vehicle.fuel}</span>
            <span>{vehicle.category}</span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

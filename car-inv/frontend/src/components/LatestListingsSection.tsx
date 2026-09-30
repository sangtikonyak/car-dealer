import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { SlidingTextReveal } from './SlidingTextReveal';
import { fetchInventory } from '../features/inventory/api';
import { VehicleCard } from '../features/inventory/components/VehicleCard';

export function LatestListingsSection() {
  const reduceMotion = useReducedMotion();
  const inventory = useQuery({
    queryKey: ['inventory', 'latest', 6],
    queryFn: () => fetchInventory({ sort: 'latest', page: 1, pageSize: 6 }),
    staleTime: 30_000,
  });
  const latestVehicles = inventory.data?.items ?? [];
  const vehicleLabel = `${latestVehicles.length} ${latestVehicles.length === 1 ? 'vehicle' : 'vehicles'}`;

  return (
    <section
      className="latest-listings-section section-frame"
      aria-labelledby="latest-listings-title"
    >
      <div className="latest-listings-inner">
        <motion.div
          className="latest-listings-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reduceMotion ? 0 : 0.45 }}
        >
          <div>
            <p className="section-eyebrow">
              {inventory.isPending ? 'Just added' : `Just added · ${vehicleLabel}`}
            </p>
            <h2 id="latest-listings-title">
              <SlidingTextReveal text="Latest arrivals." />
            </h2>
            <p>Freshly added to the collection, ready for a closer look.</p>
          </div>
          <Link className="outline-button" to="/inventory">
            View all inventory <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </motion.div>
        {inventory.isPending ? (
          <div className="latest-listings-status" role="status">
            Loading latest vehicles…
          </div>
        ) : inventory.isError ? (
          <div className="latest-listings-status is-error" role="alert">
            Latest vehicles are temporarily unavailable. Please try again shortly.
          </div>
        ) : latestVehicles.length === 0 ? (
          <div className="latest-listings-status">No published vehicles are available yet.</div>
        ) : (
          <div className="latest-listings-grid">
            {latestVehicles.map((vehicle, index) => (
              <VehicleCard key={vehicle.slug} vehicle={vehicle} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

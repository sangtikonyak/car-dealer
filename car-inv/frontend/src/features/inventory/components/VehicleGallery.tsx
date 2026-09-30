import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import type { VehiclePhoto } from '../../../types/vehicle';

interface VehicleGalleryProps {
  readonly photos: readonly VehiclePhoto[];
  readonly vehicleName: string;
}

export function VehicleGallery({ photos, vehicleName }: VehicleGalleryProps) {
  const [selectedId, setSelectedId] = useState(photos[0]?.id);
  const reduceMotion = useReducedMotion();
  const selectedPhoto = photos.find((photo) => photo.id === selectedId) ?? photos[0];

  if (!selectedPhoto) return null;

  return (
    <div className="vehicle-gallery">
      <div className="vehicle-gallery-main" aria-label={`${vehicleName} photo gallery`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={selectedPhoto.id}
            src={selectedPhoto.src}
            alt={selectedPhoto.alt}
            initial={
              reduceMotion ? false : { opacity: 0, scale: 1.08, clipPath: 'inset(0 8% 0 0)' }
            }
            animate={{ opacity: 1, scale: 1, clipPath: 'inset(0 0% 0 0)' }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.22, 0.8, 0.2, 1] }}
          />
        </AnimatePresence>
      </div>
      <div className="vehicle-gallery-thumbnails" role="group" aria-label="Choose a vehicle photo">
        {photos.map((photo, index) => (
          <motion.button
            key={photo.id}
            className={`vehicle-gallery-thumbnail${photo.id === selectedPhoto.id ? ' active' : ''}`}
            type="button"
            aria-label={`Show ${photo.label.toLocaleLowerCase()} photo`}
            aria-pressed={photo.id === selectedPhoto.id}
            onClick={() => setSelectedId(photo.id)}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.28,
              delay: reduceMotion ? 0 : index * 0.045,
            }}
          >
            <img src={photo.src} alt="" loading="lazy" />
            {photo.id === selectedPhoto.id && (
              <motion.span
                className="vehicle-gallery-thumbnail-indicator"
                layoutId="vehicle-gallery-active"
                aria-hidden="true"
              />
            )}
          </motion.button>
        ))}
      </div>
      {selectedPhoto.source ? (
        <p className="vehicle-gallery-credit">
          Reference photo by{' '}
          <a href={selectedPhoto.source} target="_blank" rel="noreferrer">
            {selectedPhoto.credit ?? 'Vehicle archive'}
          </a>{' '}
          · {selectedPhoto.license ?? 'Provided image'}
        </p>
      ) : null}
    </div>
  );
}

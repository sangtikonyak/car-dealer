import { ArrowRight, Clock3, MapPin, Phone } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { SlidingTextReveal } from './SlidingTextReveal';
import { useHomepageContent } from '../features/homepage/hooks/useHomepageContent';
import type { HomepageContent } from '../features/homepage/types';

export function ShowroomSection({ content: contentOverride }: { content?: HomepageContent } = {}) {
  const { data } = useHomepageContent(contentOverride);
  const content = (contentOverride ?? data).showroom;
  const shouldReduceMotion = useReducedMotion();
  const showroomDetails = [
    { label: 'Location', value: content.location, icon: MapPin },
    {
      label: 'Opening hours',
      value: content.openingHours,
      secondary: content.sundayHours,
      icon: Clock3,
    },
    { label: 'Contact', value: content.phone, href: content.phoneHref, icon: Phone },
  ];

  return (
    <section id="showroom" className="showroom-section section-frame">
      <div className="showroom-inner">
        <div className="showroom-grid">
          <motion.div
            className="showroom-content"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: [0.22, 0.8, 0.2, 1] }}
          >
            <p className="section-eyebrow">{content.eyebrow}</p>
            <h2>
              <SlidingTextReveal text={content.title} />
            </h2>
            <p className="showroom-description">{content.description}</p>

            <div className="showroom-details">
              {showroomDetails.map((detail, index) => {
                const Icon = detail.icon;
                return (
                  <motion.div
                    className="showroom-detail"
                    key={detail.label}
                    initial={shouldReduceMotion ? false : { opacity: 0, x: -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.4,
                      delay: shouldReduceMotion ? 0 : index * 0.08,
                    }}
                  >
                    <span className="showroom-detail-icon" aria-hidden="true">
                      <Icon size={17} strokeWidth={1.8} />
                    </span>
                    <span>
                      <span className="showroom-detail-label">{detail.label}</span>
                      {detail.href ? (
                        <a className="showroom-detail-value" href={detail.href}>
                          {detail.value}
                        </a>
                      ) : (
                        <span className="showroom-detail-value">{detail.value}</span>
                      )}
                      {detail.secondary ? (
                        <span className="showroom-detail-secondary">{detail.secondary}</span>
                      ) : null}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            className="showroom-map-card"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: [0.22, 0.8, 0.2, 1] }}
          >
            <div className="showroom-map-art" role="img" aria-label="Decorative showroom map">
              <span className="showroom-map-art-water" aria-hidden="true" />
              <span
                className="showroom-map-art-route showroom-map-art-route-one"
                aria-hidden="true"
              />
              <span
                className="showroom-map-art-route showroom-map-art-route-two"
                aria-hidden="true"
              />
              <span
                className="showroom-map-art-route showroom-map-art-route-three"
                aria-hidden="true"
              />
              <span className="showroom-map-art-pin" aria-hidden="true">
                <MapPin size={22} strokeWidth={2.2} />
              </span>
            </div>
            <div className="showroom-map-footer">
              <span>{content.mapArea}</span>
              <a href={content.directionsUrl} target="_blank" rel="noreferrer">
                Get directions <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

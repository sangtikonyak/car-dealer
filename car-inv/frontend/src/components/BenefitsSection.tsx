import { motion, useReducedMotion } from 'motion/react';
import { SlidingTextReveal } from './SlidingTextReveal';
import { getHomepageIcon } from '../features/homepage/iconRegistry';
import { useHomepageContent } from '../features/homepage/hooks/useHomepageContent';
import type { HomepageContent } from '../features/homepage/types';

export function BenefitsSection({ content: contentOverride }: { content?: HomepageContent } = {}) {
  const { data } = useHomepageContent(contentOverride);
  const content = contentOverride ?? data;
  const shouldReduceMotion = useReducedMotion();
  const hasManyBenefits = content.benefits.length > 6;

  return (
    <section
      id="benefits"
      className="benefits-section section-frame px-5 py-24 sm:px-8 lg:px-14 lg:py-28"
    >
      <div className={`benefits-inner${hasManyBenefits ? ' is-grid' : ''}`}>
        <motion.div
          className="benefits-intro"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <p className="section-eyebrow">{content.benefitsIntro.eyebrow}</p>
          <h2 className="section-title">
            <SlidingTextReveal text={content.benefitsIntro.title} />
          </h2>
          <p className="section-copy max-w-2xl">{content.benefitsIntro.description}</p>
          <a className="benefits-link" href="#how-it-works">
            View our standard <span aria-hidden="true">↗</span>
          </a>
        </motion.div>

        <div className={`benefits-list${hasManyBenefits ? ' is-grid' : ''}`}>
          {!hasManyBenefits && (
            <motion.span
              className="benefits-progress"
              aria-hidden="true"
              initial={{ scaleY: shouldReduceMotion ? 1 : 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.95,
                delay: shouldReduceMotion ? 0 : 0.15,
              }}
            />
          )}
          {content.benefits.map((benefit, index) => {
            const Icon = getHomepageIcon(benefit.iconKey);
            return (
              <motion.article
                initial={{
                  opacity: 0,
                  x: shouldReduceMotion ? 0 : 24,
                  y: shouldReduceMotion ? 0 : 10,
                }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, amount: 0.24 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.72,
                  delay: shouldReduceMotion ? 0 : 0.18 + index * 0.12,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className={`benefits-row${hasManyBenefits ? ' benefits-row-grid' : ''}`}
                key={benefit.id ?? benefit.title}
              >
                <div className="benefits-marker-column">
                  <span className="benefits-step-marker">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="benefits-row-main">
                  <motion.span
                    className={`benefit-icon benefit-icon-${benefit.tone}`}
                    whileHover={shouldReduceMotion ? undefined : { rotate: -6, scale: 1.05 }}
                    transition={{ duration: 0.22 }}
                  >
                    <Icon size={24} strokeWidth={1.8} />
                  </motion.span>
                  <div className="benefits-row-copy">
                    <h3>{benefit.title}</h3>
                    <p className="benefit-description">{benefit.description}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { motion, useReducedMotion } from 'motion/react';
import { SlidingTextReveal } from './SlidingTextReveal';
import { getHomepageIcon } from '../features/homepage/iconRegistry';
import { useHomepageContent } from '../features/homepage/hooks/useHomepageContent';
import type { HomepageContent } from '../features/homepage/types';

export function HowItWorksSection({
  content: contentOverride,
}: { content?: HomepageContent } = {}) {
  const { data } = useHomepageContent(contentOverride);
  const content = contentOverride ?? data;
  const reduceMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="how-it-works-section section-frame">
      <div className="how-it-works-inner">
        <motion.div
          className="how-it-works-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 0.8, 0.2, 1] }}
        >
          <p className="section-eyebrow">{content.howItWorks.eyebrow}</p>
          <h2>
            <SlidingTextReveal text={content.howItWorks.title} />
          </h2>
          <p>{content.howItWorks.description}</p>
        </motion.div>

        <div className="how-it-works-steps">
          <motion.span
            className="how-it-works-progress how-it-works-progress-horizontal"
            aria-hidden="true"
            initial={{ scaleX: reduceMotion ? 1 : 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: reduceMotion ? 0 : 1.05, delay: reduceMotion ? 0 : 0.2 }}
          />
          <motion.span
            className="how-it-works-progress how-it-works-progress-vertical"
            aria-hidden="true"
            initial={{ scaleY: reduceMotion ? 1 : 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: reduceMotion ? 0 : 1.05, delay: reduceMotion ? 0 : 0.2 }}
          />
          {content.steps.map((step, index) => {
            const Icon = getHomepageIcon(step.iconKey);
            return (
              <motion.article
                className="how-it-works-step"
                key={step.number}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.62,
                  delay: reduceMotion ? 0 : index * 0.14,
                  ease: [0.22, 0.8, 0.2, 1],
                }}
              >
                <div className="how-it-works-step-topline">
                  <span className="how-it-works-number">{step.number}</span>
                  <motion.span
                    className="how-it-works-icon"
                    whileHover={reduceMotion ? undefined : { rotate: 8, scale: 1.08 }}
                  >
                    <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                  </motion.span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

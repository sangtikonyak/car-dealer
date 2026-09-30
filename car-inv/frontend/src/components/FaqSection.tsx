import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { SlidingTextReveal } from './SlidingTextReveal';
import { useHomepageContent } from '../features/homepage/hooks/useHomepageContent';
import type { HomepageContent } from '../features/homepage/types';

export function FaqSection({ content: contentOverride }: { content?: HomepageContent } = {}) {
  const { data } = useHomepageContent(contentOverride);
  const content = contentOverride ?? data;
  const [openIndex, setOpenIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="faq" className="faq-section section-frame">
      <div className="faq-inner">
        <div className="faq-grid">
          <motion.div
            className="faq-heading"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: [0.22, 0.8, 0.2, 1] }}
          >
            <p className="section-eyebrow">{content.faq.eyebrow}</p>
            <h2>
              <SlidingTextReveal text={content.faq.title} />
            </h2>
            <p>{content.faq.description}</p>
          </motion.div>

          <div className="faq-list">
            {content.faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              const questionId = `faq-question-${index + 1}`;
              const answerId = `faq-answer-${index + 1}`;

              return (
                <motion.div
                  className={`faq-item${isOpen ? ' faq-item-open' : ''}`}
                  key={faq.question}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.42,
                    delay: shouldReduceMotion ? 0 : index * 0.06,
                  }}
                >
                  <button
                    id={questionId}
                    className="faq-question"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  >
                    <span>{faq.question}</span>
                    <motion.span
                      className="faq-question-icon"
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
                      aria-hidden="true"
                    >
                      <ChevronDown size={18} strokeWidth={1.8} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        id={answerId}
                        className="faq-answer"
                        role="region"
                        aria-labelledby={questionId}
                        initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: 'easeOut' }}
                      >
                        <p>{faq.answer}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

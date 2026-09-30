import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { SlidingTextReveal } from './SlidingTextReveal';
import { useHomepageContent } from '../features/homepage/hooks/useHomepageContent';

const resolvePhoneHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/gu, '')}`;

export function BookingCta() {
  const { data } = useHomepageContent();
  const content = data.bookingCta;
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="contact" className="px-5 pb-8 pt-20 sm:px-8 lg:px-14 lg:pt-24">
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.65 }}
        className="cta-panel mx-auto max-w-[1320px]"
      >
        <motion.span
          className="cta-orbit cta-orbit-one"
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
        />
        <motion.span
          className="cta-orbit cta-orbit-two"
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { rotate: -360 }}
          transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
        />
        <motion.span
          className="cta-orbit-dot cta-orbit-dot-one"
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { y: [0, -12, 0], x: [0, 8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="cta-orbit-dot cta-orbit-dot-two"
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { y: [0, 10, 0], x: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            {content.eyebrow}
          </p>
          <motion.h2
            className="mt-5 text-4xl font-bold tracking-[-0.055em] text-white sm:text-6xl"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24, filter: 'blur(7px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.65,
              delay: shouldReduceMotion ? 0 : 0.12,
            }}
          >
            <SlidingTextReveal text={content.title} />
          </motion.h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
            {content.description}
          </p>
          <motion.a
            className="cta-button mt-9"
            href={resolvePhoneHref(data.footer.phone)}
            whileHover={shouldReduceMotion ? undefined : { x: 4 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          >
            {content.cta.label} <ArrowRight size={18} />
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}

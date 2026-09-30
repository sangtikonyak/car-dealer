import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { SlidingTextReveal } from './SlidingTextReveal';
import { useHomepageContent } from '../features/homepage/hooks/useHomepageContent';
import type { HomepageContent } from '../features/homepage/types';

export function Hero({ content: contentOverride }: { content?: HomepageContent } = {}) {
  const { data } = useHomepageContent(contentOverride);
  const content = contentOverride ?? data;
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const carX = useTransform(scrollYProgress, [0, 0.8], [0, 110]);
  const carY = useTransform(scrollYProgress, [0, 0.8], [0, -72]);
  const carScale = useTransform(scrollYProgress, [0, 0.8], [1, 1.08]);

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.75, ease: [0.2, 0.7, 0.2, 1] as const };
  const titleLines = content.hero.titleLines;

  return (
    <section
      ref={heroRef}
      id="top"
      className="relative min-h-[760px] overflow-hidden bg-white px-5 pb-12 pt-12 sm:px-8 lg:min-h-[790px] lg:px-14 lg:pt-16"
    >
      <div className="map-lines" aria-hidden="true">
        <span className="map-route map-route-one" />
        <span className="map-route map-route-two" />
        <span className="map-route map-route-three" />
        <i className="map-pin map-pin-one" />
        <i className="map-pin map-pin-two" />
        <i className="map-pin map-pin-three" />
        <i className="map-pin map-pin-four" />
      </div>

      <div className="relative mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-0">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                delayChildren: shouldReduceMotion ? 0 : 0.12,
                staggerChildren: shouldReduceMotion ? 0 : 0.12,
              },
            },
          }}
          className="relative z-10 pt-4 lg:pt-10"
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0, transition },
            }}
            className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400"
          >
            {content.hero.eyebrow}
          </motion.p>
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 34 },
              visible: { opacity: 1, y: 0, transition: { ...transition, duration: 0.9 } },
            }}
            className="max-w-[670px] text-[clamp(3.8rem,6.7vw,7.2rem)] font-bold leading-[0.88] tracking-[-0.072em] text-neutral-950"
          >
            {titleLines.map((line, index) => (
              <span className="hero-title-line" key={line}>
                <SlidingTextReveal text={line} delay={shouldReduceMotion ? 0 : index * 0.1} />
              </span>
            ))}
          </motion.h1>
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 22 },
              visible: { opacity: 1, y: 0, transition },
            }}
            className="mt-8 max-w-md text-base leading-7 text-neutral-600 sm:text-xl sm:leading-8"
          >
            {content.hero.description}
          </motion.p>
          <motion.a
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0, transition },
            }}
            className="primary-button mt-9"
            href={content.hero.cta.href}
            whileHover={shouldReduceMotion ? undefined : { x: 4 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          >
            {content.hero.cta.label} <ArrowRight size={18} aria-hidden="true" />
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 110, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ ...transition, delay: shouldReduceMotion ? 0 : 0.2 }}
          className="relative min-h-[360px] lg:min-h-[570px]"
        >
          <motion.img
            className="hero-image absolute left-[50%] top-[52%] z-[2] w-[106%] max-w-[760px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_32px_24px_rgba(18,18,18,0.22)] lg:left-[55%] lg:w-[108%] lg:max-w-[860px]"
            src={content.hero.imageUrl}
            alt={content.hero.imageAlt}
            style={{
              x: shouldReduceMotion ? 0 : carX,
              y: shouldReduceMotion ? 0 : carY,
              scale: shouldReduceMotion ? 1 : carScale,
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}

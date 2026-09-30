import { Check, Search } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { useHomepageContent } from '../features/homepage/hooks/useHomepageContent';
import type { HomepageContent } from '../features/homepage/types';

export function MobileAppSection({ content: contentOverride }: { content?: HomepageContent } = {}) {
  const { data } = useHomepageContent(contentOverride);
  const content = (contentOverride ?? data).about;
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const backPhoneY = useTransform(scrollYProgress, [0, 1], [34, -34]);
  const frontPhoneY = useTransform(scrollYProgress, [0, 1], [-18, 22]);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="section-frame px-5 py-24 sm:px-8 lg:px-14 lg:py-28"
    >
      <div className="mx-auto grid max-w-[1320px] items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="phone-stage" aria-label="Driva digital buying experience preview">
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -72, rotate: -18 }}
            whileInView={{ opacity: 1, x: 0, rotate: -11 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.8,
              delay: shouldReduceMotion ? 0 : 0.12,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="phone phone-back"
            style={{ y: shouldReduceMotion ? 0 : backPhoneY }}
            aria-hidden="true"
          >
            <div className="phone-speaker" />
            <div className="phone-screen bg-[#f5f5f3]">
              <div className="phone-map">
                <span className="phone-route" />
                <span className="phone-location">{content.preview.appointmentDuration}</span>
              </div>
              <div className="p-4">
                <p className="text-xs font-bold">{content.preview.appointmentLabel}</p>
                <p className="mt-1 text-[0.65rem] text-neutral-500">
                  {content.preview.appointmentTime}
                </p>
                <button className="mt-5 w-full rounded-full bg-neutral-950 py-2 text-[0.65rem] font-bold text-white">
                  Confirm appointment
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 72, rotate: 12 }}
            whileInView={{ opacity: 1, x: 0, rotate: 4 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.8,
              delay: shouldReduceMotion ? 0 : 0.28,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="phone phone-front"
            style={{ y: shouldReduceMotion ? 0 : frontPhoneY }}
          >
            <div className="phone-speaker" />
            <div className="phone-screen bg-[#f6f5f2] p-3">
              <div className="flex items-center justify-between text-[0.58rem] font-semibold">
                <span>{content.preview.savedVehicleLabel}</span>
                <Search size={12} />
              </div>
              <img
                className="mt-3 h-28 w-full rounded-2xl bg-white object-contain"
                src={content.preview.imageUrl}
                alt={content.preview.imageAlt}
              />
              <p className="mt-3 text-sm font-bold">{content.preview.vehicleName}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[0.56rem]">
                <div className="rounded-xl bg-white p-2.5">
                  <span className="text-neutral-400">{content.preview.mileageLabel}</span>
                  <strong className="mt-1 block">{content.preview.mileage}</strong>
                </div>
                <div className="rounded-xl bg-white p-2.5">
                  <span className="text-neutral-400">{content.preview.priceLabel}</span>
                  <strong className="mt-1 block">{content.preview.price}</strong>
                </div>
              </div>
              <div className="mt-2 rounded-xl bg-[#1d2228] p-3 text-white">
                <p className="text-[0.55rem] text-white/55">{content.preview.inspectionLabel}</p>
                <div className="mt-2 flex items-center justify-between">
                  <strong className="text-xs">{content.preview.inspection}</strong>
                  <Check className="text-[#b9d6c1]" size={15} />
                </div>
              </div>
              <button className="mt-2 w-full rounded-full bg-neutral-950 py-2.5 text-[0.65rem] font-bold text-white">
                {content.preview.enquiryLabel}
              </button>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.65, delay: 0.1 }}
        >
          <p className="section-eyebrow">{content.eyebrow}</p>
          <h2 className="section-title">{content.title}</h2>
          <p className="section-copy max-w-xl">{content.description}</p>
          <motion.ul
            className="mt-8 grid gap-3 text-sm font-semibold sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.45 }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08 } },
            }}
          >
            {content.checklist.map((item) => (
              <motion.li
                key={item}
                className="experience-pill"
                variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
              >
                <Check size={17} /> {item}
              </motion.li>
            ))}
          </motion.ul>
          <motion.a
            className="primary-button mt-9"
            href={content.cta.href}
            whileHover={shouldReduceMotion ? undefined : { x: 4 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          >
            {content.cta.label}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

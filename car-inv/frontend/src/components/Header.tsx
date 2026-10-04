import { ArrowLeft, ArrowUpRight, Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useHomepageContent } from '../features/homepage/hooks/useHomepageContent';

export function Header() {
  const { data } = useHomepageContent();
  const content = data.site;
  const navigation = [
    { label: 'Home', href: '/' },
    ...content.navigation.filter(
      (item) => item.href !== '/' && item.label.toLowerCase() !== 'home',
    ),
  ];
  const location = useLocation();
  const isInventoryRoute =
    location.pathname === '/inventory' || location.pathname.startsWith('/inventory/');
  const headerCtaLabel = isInventoryRoute ? 'Back home' : content.inventoryCtaLabel;
  const headerCtaHref = isInventoryRoute ? '/' : '/inventory';
  const hasLogoImage =
    content.brandMark.startsWith('http://') || content.brandMark.startsWith('https://');
  const [isOpen, setIsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  return (
    <motion.header
      className="sticky top-0 z-50 bg-white/94 px-5 py-5 backdrop-blur-xl sm:px-8 lg:px-14"
      initial={shouldReduceMotion ? false : { opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: 'easeOut' }}
    >
      <motion.div
        className="scroll-progress"
        style={{ scaleX: shouldReduceMotion ? 0 : scrollYProgress }}
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1320px] items-center justify-between">
        <motion.div whileHover={shouldReduceMotion ? undefined : { x: 2 }}>
          <Link
            className="group flex items-center gap-2.5"
            to="/"
            aria-label={`${content.brandName} home`}
          >
            {hasLogoImage ? (
              <img className="brand-mark brand-mark-image" src={content.brandMark} alt="" />
            ) : (
              <span className="brand-mark" aria-hidden="true">
                {content.brandMark}
              </span>
            )}
            <span className="text-xl font-bold tracking-[-0.05em]">{content.brandName}</span>
          </Link>
        </motion.div>

        <nav
          className="hidden items-center gap-9 text-sm font-semibold text-neutral-800 lg:flex"
          aria-label="Primary navigation"
        >
          {navigation.map((item, index) => (
            <motion.div
              key={item.href}
              initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.25,
                delay: shouldReduceMotion ? 0 : index * 0.05,
              }}
            >
              {item.href.startsWith('/#') ? (
                <a className="nav-link transition-colors hover:text-neutral-500" href={item.href}>
                  {item.label}
                </a>
              ) : (
                <Link className="nav-link transition-colors hover:text-neutral-500" to={item.href}>
                  {item.label}
                </Link>
              )}
            </motion.div>
          ))}
        </nav>

        <motion.div
          className="hidden lg:block"
          whileHover={shouldReduceMotion ? undefined : { y: -2 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        >
          <Link className="header-inventory-button" to={headerCtaHref}>
            {headerCtaLabel}
            {isInventoryRoute ? (
              <ArrowLeft size={15} aria-hidden="true" />
            ) : (
              <ArrowUpRight size={15} aria-hidden="true" />
            )}
          </Link>
        </motion.div>

        <motion.button
          type="button"
          className="grid size-10 place-items-center rounded-full bg-neutral-950 text-white lg:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setIsOpen((current) => !current)}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.nav
            id="mobile-menu"
            className="absolute inset-x-5 top-[76px] flex flex-col rounded-[1.75rem] border border-black/7 bg-white p-5 shadow-xl lg:hidden"
            aria-label="Mobile navigation"
            initial={shouldReduceMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          >
            {navigation.map((item) =>
              item.href.startsWith('/#') ? (
                <a
                  className="rounded-xl px-3 py-3 text-base font-medium hover:bg-neutral-100"
                  href={item.href}
                  key={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  className="rounded-xl px-3 py-3 text-base font-medium hover:bg-neutral-100"
                  to={item.href}
                  key={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ),
            )}
            <Link
              className="mt-2 rounded-full bg-neutral-950 px-5 py-3 text-center text-sm font-semibold text-white"
              to={headerCtaHref}
              onClick={() => setIsOpen(false)}
            >
              {headerCtaLabel}
            </Link>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}

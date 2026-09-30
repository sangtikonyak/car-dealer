import { Link, useLocation } from 'react-router-dom';
import { useHomepageContent } from '../features/homepage/hooks/useHomepageContent';
import type { HomepageContent } from '../features/homepage/types';

const resolvePolicyHref = (href: string, fallback: string): string =>
  href.startsWith('mailto:') ? fallback : href;
const resolvePhoneHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/gu, '')}`;

export function Footer({ content: contentOverride }: { content?: HomepageContent } = {}) {
  const { data } = useHomepageContent(contentOverride);
  const content = contentOverride ?? data;
  const location = useLocation();
  const isVehicleDetailRoute = /^\/inventory\/[^/]+$/.test(location.pathname);
  const hasLogoImage =
    content.site.brandMark.startsWith('http://') || content.site.brandMark.startsWith('https://');
  const termsHref = resolvePolicyHref(content.footer.termsHref, '/terms');
  const privacyHref = resolvePolicyHref(content.footer.privacyHref, '/privacy');

  return (
    <footer
      className={`px-5 pb-12 pt-16 sm:px-8 lg:px-14 lg:pb-16${
        isVehicleDetailRoute ? ' vehicle-detail-footer' : ''
      }`}
    >
      {isVehicleDetailRoute ? (
        <div className="vehicle-detail-footer-inner">
          <div className="vehicle-detail-footer-brand">
            <Link className="inline-flex items-center gap-2.5" to="/">
              {hasLogoImage ? (
                <img className="brand-mark brand-mark-image" src={content.site.brandMark} alt="" />
              ) : (
                <span className="brand-mark" aria-hidden="true">
                  {content.site.brandMark}
                </span>
              )}
              <span className="text-xl font-bold tracking-[-0.05em]">{content.site.brandName}</span>
            </Link>
            <p>{content.footer.description}</p>
            <div className="footer-contact-links">
              <p className="footer-contact-label">Contact</p>
              <p className="footer-contact-item">
                <span className="footer-contact-item-label">Email:</span>
                <a href={`mailto:${content.footer.email}`}>{content.footer.email}</a>
              </p>
              <p className="footer-contact-item">
                <span className="footer-contact-item-label">Phone:</span>
                <a href={resolvePhoneHref(content.footer.phone)}>{content.footer.phone}</a>
              </p>
            </div>
          </div>

          <nav className="vehicle-detail-footer-links" aria-label="Footer navigation">
            {content.footer.links.map((link) =>
              link.href.startsWith('/#') ? (
                <a href={link.href} key={link.label}>
                  {link.label}
                </a>
              ) : (
                <Link to={link.href} key={link.label}>
                  {link.label}
                </Link>
              ),
            )}
            {termsHref.startsWith('/') ? (
              <Link to={termsHref}>Terms &amp; Conditions</Link>
            ) : (
              <a href={termsHref}>Terms &amp; Conditions</a>
            )}
            {privacyHref.startsWith('/') ? (
              <Link to={privacyHref}>Privacy Policy</Link>
            ) : (
              <a href={privacyHref}>Privacy Policy</a>
            )}
          </nav>
          <p className="vehicle-detail-footer-copyright">{content.footer.copyright}</p>
        </div>
      ) : null}

      {!isVehicleDetailRoute ? (
        <div className="footer-global-inner mx-auto grid max-w-[1320px] gap-14 border-t border-black/8 pt-12">
          <div>
            <Link className="inline-flex items-center gap-2.5" to="/">
              {hasLogoImage ? (
                <img className="brand-mark brand-mark-image" src={content.site.brandMark} alt="" />
              ) : (
                <span className="brand-mark" aria-hidden="true">
                  {content.site.brandMark}
                </span>
              )}
              <span className="text-xl font-bold tracking-[-0.05em]">{content.site.brandName}</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-neutral-500">
              {content.footer.description}
            </p>
            <div className="footer-contact-links">
              <p className="footer-contact-label">Contact</p>
              <p className="footer-contact-item">
                <span className="footer-contact-item-label">Email:</span>
                <a href={`mailto:${content.footer.email}`}>{content.footer.email}</a>
              </p>
              <p className="footer-contact-item">
                <span className="footer-contact-item-label">Phone:</span>
                <a href={resolvePhoneHref(content.footer.phone)}>{content.footer.phone}</a>
              </p>
            </div>
          </div>

          <nav className="footer-global-links" aria-label="Footer navigation">
            {content.footer.links.map((link) =>
              link.href.startsWith('/#') ? (
                <a
                  className="w-fit transition hover:text-neutral-500"
                  href={link.href}
                  key={link.label}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  className="w-fit transition hover:text-neutral-500"
                  to={link.href}
                  key={link.label}
                >
                  {link.label}
                </Link>
              ),
            )}
            {termsHref.startsWith('/') ? (
              <Link to={termsHref}>Terms &amp; Conditions</Link>
            ) : (
              <a href={termsHref}>Terms &amp; Conditions</a>
            )}
            {privacyHref.startsWith('/') ? (
              <Link to={privacyHref}>Privacy Policy</Link>
            ) : (
              <a href={privacyHref}>Privacy Policy</a>
            )}
          </nav>
          <p className="footer-global-copyright text-xs text-neutral-400">
            {content.footer.copyright}
          </p>
        </div>
      ) : null}
    </footer>
  );
}

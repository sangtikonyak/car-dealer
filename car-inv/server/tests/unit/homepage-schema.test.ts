import { describe, expect, it } from 'vitest';
import { homepageIconKeys } from '../../src/constants/homepage-icons.js';
import { homepageUpdateSchema } from '../../src/modules/homepage/homepage.schema.js';
import { homepageDefaults } from '../../src/modules/homepage/homepage.defaults.js';

describe('homepage content schema', () => {
  it('supports the complete 20-icon catalog', () => {
    expect(homepageIconKeys).toHaveLength(20);
    expect(() => homepageUpdateSchema.parse(homepageDefaults)).not.toThrow();
  });

  it('rejects unknown fields and untrusted javascript links', () => {
    expect(() => homepageUpdateSchema.parse({ ...homepageDefaults, unexpected: true })).toThrow();
    expect(() =>
      homepageUpdateSchema.parse({
        ...homepageDefaults,
        hero: { ...homepageDefaults.hero, cta: { label: 'Go', href: 'javascript:alert(1)' } },
      }),
    ).toThrow();
  });

  it('fills new footer contact defaults for legacy saved homepage content', () => {
    const legacyFooter = Object.fromEntries(
      Object.entries(homepageDefaults.footer).filter(([key]) => key !== 'email' && key !== 'phone'),
    );
    const parsed = homepageUpdateSchema.parse({
      ...homepageDefaults,
      footer: legacyFooter,
    });

    expect(parsed.footer.email).toBe('sales@driva.example');
    expect(parsed.footer.phone).toBe('+91 44 4000 1020');
  });

  it('fills the default site title for legacy saved homepage content', () => {
    const legacySite = Object.fromEntries(
      Object.entries(homepageDefaults.site).filter(([key]) => key !== 'title'),
    );
    const parsed = homepageUpdateSchema.parse({
      ...homepageDefaults,
      site: legacySite,
    });

    expect(parsed.site.title).toBe('Driva — Premium pre-owned vehicles');
  });
});

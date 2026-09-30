import { describe, expect, it } from 'vitest';
import { getHomepageIcon, homepageIconRegistry } from './iconRegistry';

const homepageIconKeys = [
  'history',
  'inspection',
  'financing',
  'warranty',
  'vehicle',
  'performance',
  'maintenance',
  'search',
  'documentation',
  'price',
  'testDrive',
  'location',
  'contact',
  'rating',
  'premium',
  'keys',
  'trust',
  'journey',
  'electric',
  'support',
] as const;

describe('homepage icon registry', () => {
  it('provides a renderable icon for every supported key', () => {
    for (const key of homepageIconKeys) {
      expect(homepageIconRegistry[key]).toBeDefined();
      expect(getHomepageIcon(key)).toBe(homepageIconRegistry[key]);
    }
  });

  it('falls back safely for an unknown key from an untrusted API payload', () => {
    expect(getHomepageIcon('unknown-icon')).toBe(homepageIconRegistry.support);
  });
});

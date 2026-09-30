import { z } from 'zod';

export const homepageIconKeys = [
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

export type HomepageIconKey = (typeof homepageIconKeys)[number];

export const homepageIconKeySchema = z.enum(homepageIconKeys);

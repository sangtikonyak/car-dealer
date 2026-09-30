import { z } from 'zod';
import { homepageIconKeySchema } from '../../constants/homepage-icons.js';

const safeHref = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => /^(?:\/(?!\/)|https?:|mailto:|tel:)/iu.test(value),
    'Only relative, HTTP(S), mailto, and tel links are allowed.',
  );

const linkSchema = z.object({ label: z.string().trim().min(1).max(80), href: safeHref }).strict();
const introSchema = z
  .object({
    eyebrow: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(180),
    description: z.string().trim().min(1).max(500),
  })
  .strict();

export const siteSchema = z
  .object({
    brandName: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(180).default('Driva — Premium pre-owned vehicles'),
    brandMark: z
      .string()
      .trim()
      .min(1)
      .max(500)
      .refine(
        (value) => value.length <= 4 || /^(?:\/(?!\/)|https?:)/iu.test(value),
        'Brand mark must be a short text fallback or a relative/HTTP(S) image URL.',
      ),
    navigation: z.array(linkSchema).max(20),
    inventoryCtaLabel: z.string().trim().min(1).max(80),
  })
  .strict();

export const heroSchema = z
  .object({
    eyebrow: z.string().trim().min(1).max(100),
    titleLines: z.array(z.string().trim().min(1).max(80)).min(1).max(6),
    description: z.string().trim().min(1).max(500),
    cta: linkSchema,
    imageUrl: safeHref,
    imageAlt: z.string().trim().min(1).max(180),
  })
  .strict();

export const showroomSchema = z
  .object({
    eyebrow: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(180),
    description: z.string().trim().min(1).max(500),
    location: z.string().trim().min(1).max(200),
    openingHours: z.string().trim().min(1).max(120),
    sundayHours: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(1).max(60),
    phoneHref: safeHref,
    mapLabel: z.string().trim().min(1).max(100),
    mapArea: z.string().trim().min(1).max(100),
    latitude: z.number().min(-90).max(90).default(13.0067),
    longitude: z.number().min(-180).max(180).default(80.2206),
    zoom: z.number().int().min(1).max(20).default(13),
    directionsUrl: safeHref,
  })
  .strict();

export const aboutSchema = z
  .object({
    eyebrow: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(180),
    description: z.string().trim().min(1).max(500),
    checklist: z.array(z.string().trim().min(1).max(100)).max(10),
    preview: z
      .object({
        appointmentDuration: z.string().trim().min(1).max(40),
        appointmentLabel: z.string().trim().min(1).max(80),
        appointmentTime: z.string().trim().min(1).max(100),
        savedVehicleLabel: z.string().trim().min(1).max(80),
        imageUrl: safeHref,
        imageAlt: z.string().trim().min(1).max(180),
        vehicleName: z.string().trim().min(1).max(100),
        mileageLabel: z.string().trim().min(1).max(40),
        mileage: z.string().trim().min(1).max(40),
        priceLabel: z.string().trim().min(1).max(40),
        price: z.string().trim().min(1).max(40),
        inspectionLabel: z.string().trim().min(1).max(80),
        inspection: z.string().trim().min(1).max(100),
        enquiryLabel: z.string().trim().min(1).max(80),
      })
      .strict(),
    cta: linkSchema,
  })
  .strict();

export const bookingCtaSchema = z
  .object({
    eyebrow: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(180),
    description: z.string().trim().min(1).max(500),
    cta: linkSchema,
  })
  .strict();

export const footerSchema = z
  .object({
    description: z.string().trim().min(1).max(500),
    email: z.string().trim().email().max(320).default('sales@driva.example'),
    phone: z.string().trim().min(1).max(60).default('+91 44 4000 1020'),
    termsHref: safeHref,
    privacyHref: safeHref,
    links: z.array(linkSchema).max(30),
    newsletterTitle: z.string().trim().min(1).max(120),
    newsletterDescription: z.string().trim().min(1).max(300),
    newsletterPlaceholder: z.string().trim().min(1).max(80),
    newsletterButtonLabel: z.string().trim().min(1).max(80),
    copyright: z.string().trim().min(1).max(120),
  })
  .strict();

export const stepSchema = z
  .object({
    id: z.string().trim().min(1).max(80).optional(),
    number: z.string().trim().min(1).max(10),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(500),
    iconKey: homepageIconKeySchema,
    displayOrder: z.number().int().min(0).max(999),
    isActive: z.boolean().default(true),
  })
  .strict();

export const faqSchema = z
  .object({
    id: z.string().trim().min(1).max(80).optional(),
    question: z.string().trim().min(1).max(180),
    answer: z.string().trim().min(1).max(1000),
    displayOrder: z.number().int().min(0).max(999),
    isActive: z.boolean().default(true),
  })
  .strict();

export const benefitSchema = z
  .object({
    id: z.string().trim().min(1).max(80).optional(),
    iconKey: homepageIconKeySchema,
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(500),
    tone: z.enum(['mint', 'rose', 'blue', 'sand']),
    displayOrder: z.number().int().min(0).max(999),
    isActive: z.boolean().default(true),
  })
  .strict();

export const homepageUpdateSchema = z
  .object({
    site: siteSchema,
    hero: heroSchema,
    howItWorks: introSchema,
    faq: introSchema,
    benefitsIntro: introSchema,
    showroom: showroomSchema,
    about: aboutSchema,
    bookingCta: bookingCtaSchema,
    footer: footerSchema,
    steps: z.array(stepSchema).max(20),
    faqs: z.array(faqSchema).max(50),
    benefits: z.array(benefitSchema).max(100),
  })
  .strict();

export const homepageIdentityUpdateSchema = z
  .object({ site: siteSchema, hero: heroSchema })
  .strict();

export const homepageSiteIdentityUpdateSchema = z.object({ site: siteSchema }).strict();

export const homepageBenefitsUpdateSchema = z
  .object({ benefits: z.array(benefitSchema).max(20), benefitsIntro: introSchema.optional() })
  .strict();

export const homepageFaqsUpdateSchema = z
  .object({ faqs: z.array(faqSchema).max(50), faq: introSchema.optional() })
  .strict();

export const homepageHowItWorksUpdateSchema = z
  .object({ howItWorks: introSchema, steps: z.array(stepSchema).max(20) })
  .strict();

export const homepageShowroomUpdateSchema = z.object({ showroom: showroomSchema }).strict();

export const homepageAboutUpdateSchema = z.object({ about: aboutSchema }).strict();

export const homepageBookingCtaUpdateSchema = z.object({ bookingCta: bookingCtaSchema }).strict();

export const homepageFooterUpdateSchema = z.object({ footer: footerSchema }).strict();

export const newsletterSubscriptionSchema = z
  .object({ email: z.string().trim().email().max(320) })
  .strict();

export type HomepageUpdateInput = z.infer<typeof homepageUpdateSchema>;
export type HomepageIdentityUpdateInput = z.infer<typeof homepageIdentityUpdateSchema>;
export type HomepageSiteIdentityUpdateInput = z.infer<typeof homepageSiteIdentityUpdateSchema>;
export type HomepageBenefitsUpdateInput = z.infer<typeof homepageBenefitsUpdateSchema>;
export type HomepageFaqsUpdateInput = z.infer<typeof homepageFaqsUpdateSchema>;
export type HomepageHowItWorksUpdateInput = z.infer<typeof homepageHowItWorksUpdateSchema>;
export type HomepageShowroomUpdateInput = z.infer<typeof homepageShowroomUpdateSchema>;
export type HomepageAboutUpdateInput = z.infer<typeof homepageAboutUpdateSchema>;
export type HomepageBookingCtaUpdateInput = z.infer<typeof homepageBookingCtaUpdateSchema>;
export type HomepageFooterUpdateInput = z.infer<typeof homepageFooterUpdateSchema>;
export type NewsletterSubscriptionInput = z.infer<typeof newsletterSubscriptionSchema>;

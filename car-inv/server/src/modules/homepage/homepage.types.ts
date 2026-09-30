import type { HomepageIconKey } from '../../constants/homepage-icons.js';

export interface HomepageLink {
  label: string;
  href: string;
}

export interface HomepageSiteContent {
  brandName: string;
  title: string;
  brandMark: string;
  navigation: HomepageLink[];
  inventoryCtaLabel: string;
}

export interface HomepageHeroContent {
  eyebrow: string;
  titleLines: string[];
  description: string;
  cta: HomepageLink;
  imageUrl: string;
  imageAlt: string;
}

export interface HomepageIntroContent {
  eyebrow: string;
  title: string;
  description: string;
}

export interface HomepageStepContent {
  id: string;
  number: string;
  title: string;
  description: string;
  iconKey: HomepageIconKey;
}

export interface HomepageShowroomContent {
  eyebrow: string;
  title: string;
  description: string;
  location: string;
  openingHours: string;
  sundayHours: string;
  phone: string;
  phoneHref: string;
  mapLabel: string;
  mapArea: string;
  latitude: number;
  longitude: number;
  zoom: number;
  directionsUrl: string;
}

export interface HomepageAboutContent {
  eyebrow: string;
  title: string;
  description: string;
  checklist: string[];
  preview: {
    appointmentDuration: string;
    appointmentLabel: string;
    appointmentTime: string;
    savedVehicleLabel: string;
    imageUrl: string;
    imageAlt: string;
    vehicleName: string;
    mileageLabel: string;
    mileage: string;
    priceLabel: string;
    price: string;
    inspectionLabel: string;
    inspection: string;
    enquiryLabel: string;
  };
  cta: HomepageLink;
}

export interface HomepageFaqContent {
  id: string;
  question: string;
  answer: string;
}

export interface HomepageBenefitContent {
  id: string;
  iconKey: HomepageIconKey;
  title: string;
  description: string;
  tone: 'mint' | 'rose' | 'blue' | 'sand';
}

export interface HomepageBookingCtaContent {
  eyebrow: string;
  title: string;
  description: string;
  cta: HomepageLink;
}

export interface HomepageFooterContent {
  description: string;
  email: string;
  phone: string;
  termsHref: string;
  privacyHref: string;
  links: HomepageLink[];
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterPlaceholder: string;
  newsletterButtonLabel: string;
  copyright: string;
}

export interface HomepageContentDto {
  site: HomepageSiteContent;
  hero: HomepageHeroContent;
  howItWorks: HomepageIntroContent;
  faq: HomepageIntroContent;
  benefitsIntro: HomepageIntroContent;
  showroom: HomepageShowroomContent;
  about: HomepageAboutContent;
  bookingCta: HomepageBookingCtaContent;
  footer: HomepageFooterContent;
  steps: HomepageStepContent[];
  faqs: HomepageFaqContent[];
  benefits: HomepageBenefitContent[];
}

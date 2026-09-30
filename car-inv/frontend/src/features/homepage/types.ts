export type HomepageIconKey =
  | 'history'
  | 'inspection'
  | 'financing'
  | 'warranty'
  | 'vehicle'
  | 'performance'
  | 'maintenance'
  | 'search'
  | 'documentation'
  | 'price'
  | 'testDrive'
  | 'location'
  | 'contact'
  | 'rating'
  | 'premium'
  | 'keys'
  | 'trust'
  | 'journey'
  | 'electric'
  | 'support';

export type BenefitTone = 'mint' | 'rose' | 'blue' | 'sand';

export interface HomepageLink {
  label: string;
  href: string;
}

export interface HomepageContent {
  site: {
    brandName: string;
    title: string;
    brandMark: string;
    navigation: HomepageLink[];
    inventoryCtaLabel: string;
  };
  hero: {
    eyebrow: string;
    titleLines: string[];
    description: string;
    cta: HomepageLink;
    imageUrl: string;
    imageAlt: string;
  };
  howItWorks: { eyebrow: string; title: string; description: string };
  faq: { eyebrow: string; title: string; description: string };
  benefitsIntro: { eyebrow: string; title: string; description: string };
  showroom: {
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
  };
  about: {
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
  };
  bookingCta: { eyebrow: string; title: string; description: string; cta: HomepageLink };
  footer: {
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
  };
  steps: Array<{
    id: string;
    number: string;
    title: string;
    description: string;
    iconKey: HomepageIconKey;
  }>;
  faqs: Array<{ id: string; question: string; answer: string }>;
  benefits: Array<{
    id: string;
    iconKey: HomepageIconKey;
    title: string;
    description: string;
    tone: BenefitTone;
  }>;
}

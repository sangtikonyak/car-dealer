import type { HomepageContent } from './types';

export const homepageDefaults: HomepageContent = {
  site: {
    brandName: 'Driva',
    title: 'Driva — Premium pre-owned vehicles',
    brandMark: 'D',
    navigation: [
      { label: 'About us', href: '/#about' },
      { label: 'Inventory', href: '/inventory' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Showroom', href: '/#showroom' },
      { label: 'FAQ', href: '/#faq' },
      { label: 'Benefits', href: '/#benefits' },
    ],
    inventoryCtaLabel: 'View inventory',
  },
  hero: {
    eyebrow: 'Curated. Inspected. Ready.',
    titleLines: ['Premium', 'pre-owned', 'cars.'],
    description: 'Exceptional vehicles, independently inspected and prepared for the road ahead.',
    cta: { label: 'Browse inventory', href: '/inventory' },
    imageUrl: '/images/hero-car-cutout.png',
    imageAlt: 'Silver grand touring coupe',
  },
  howItWorks: {
    eyebrow: 'Simple from the start',
    title: 'A clearer way to buy.',
    description:
      'From the first search to the first drive, every step is designed to give you more confidence and less pressure.',
  },
  faq: {
    eyebrow: 'Questions, answered',
    title: 'Everything you need to buy with confidence.',
    description:
      'A few straightforward answers about our vehicles, pricing, financing, and buying process.',
  },
  benefitsIntro: {
    eyebrow: 'Taking care of every buyer',
    title: 'Buy with confidence',
    description:
      'Every Driva vehicle is selected, inspected and presented with the information needed to make a confident decision.',
  },
  showroom: {
    eyebrow: 'Visit us in person',
    title: 'See your next car up close.',
    description:
      'Walk around the vehicle, review its condition with our team, and take a supervised test drive before making your decision.',
    location: '42 Industrial Estate, Guindy, Chennai',
    openingHours: 'Monday–Saturday · 9:00 AM–7:00 PM',
    sundayHours: 'Sunday · 10:00 AM–4:00 PM',
    phone: '+91 44 4000 1020',
    phoneHref: 'tel:+914440001020',
    mapLabel: 'Driva showroom',
    mapArea: 'Guindy, Chennai',
    latitude: 13.0067,
    longitude: 80.2206,
    zoom: 13,
    directionsUrl: 'https://www.google.com/maps/search/?api=1&query=Guindy%2C%20Chennai',
  },
  about: {
    eyebrow: 'Complete confidence',
    title: 'A modern way to buy pre-owned.',
    description:
      'Compare inspected vehicles, review their history and arrange a test drive without pressure. Every detail you need is presented clearly before you visit.',
    checklist: ['Verified history', '142-point check', 'Clear pricing'],
    preview: {
      appointmentDuration: '12 min',
      appointmentLabel: 'Your test drive',
      appointmentTime: 'Saturday · 10:30 AM',
      savedVehicleLabel: 'Saved vehicle',
      imageUrl: '/images/hero-car-cutout.png',
      imageAlt: 'Silver coupe saved in the Driva inventory',
      vehicleName: 'Arcadia H',
      mileageLabel: 'Mileage',
      mileage: '9,600 km',
      priceLabel: 'Price',
      price: '$59,800',
      inspectionLabel: 'Inspection summary',
      inspection: '142 points passed',
      enquiryLabel: 'Make an enquiry',
    },
    cta: { label: 'Explore the collection', href: '/inventory' },
  },
  bookingCta: {
    eyebrow: 'Your next car is here',
    title: 'Find the one worth driving home.',
    description:
      'Tell us what you are looking for and our dealership team will curate the strongest matches in our current stock.',
    cta: { label: 'Speak with our team', href: 'tel:+914440001020' },
  },
  footer: {
    description: 'A clearer, more considered way to buy premium pre-owned vehicles.',
    email: 'sales@driva.example',
    phone: '+91 44 4000 1020',
    termsHref: '/terms',
    privacyHref: '/privacy',
    links: [
      { label: 'About us', href: '/#about' },
      { label: 'Inventory', href: '/inventory' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Showroom', href: '/#showroom' },
      { label: 'FAQ', href: '/#faq' },
      { label: 'Benefits', href: '/#benefits' },
      { label: 'Contact', href: '/#contact' },
    ],
    newsletterTitle: 'New arrivals, occasionally.',
    newsletterDescription: 'Be first to see newly inspected vehicles added to the collection.',
    newsletterPlaceholder: 'Your email',
    newsletterButtonLabel: 'Subscribe to inventory updates',
    copyright: '© 2026 Driva Pre-Owned.',
  },
  steps: [
    {
      id: 'step-1',
      number: '01',
      title: 'Browse inspected vehicles',
      description:
        'Explore the latest pre-owned cars with clear pricing, mileage, photos and specifications.',
      iconKey: 'search',
    },
    {
      id: 'step-2',
      number: '02',
      title: 'Review history and documentation',
      description:
        'Check vehicle history, inspection records, available paperwork and detailed condition information.',
      iconKey: 'documentation',
    },
    {
      id: 'step-3',
      number: '03',
      title: 'Book a viewing or test drive',
      description:
        'Choose a convenient time to see the vehicle in person, ask questions and take it for a drive.',
      iconKey: 'testDrive',
    },
  ],
  faqs: [
    {
      id: 'faq-1',
      question: 'Are the vehicles inspected?',
      answer:
        'Yes. Every vehicle is inspected before it is listed, with key condition details and available documentation shown on its detail page.',
    },
    {
      id: 'faq-2',
      question: 'Is the price negotiable?',
      answer:
        'Pricing status is shown on each vehicle. Where negotiation is available, it will be clearly marked on the listing.',
    },
    {
      id: 'faq-3',
      question: 'Do you offer financing?',
      answer:
        'Financing options can be discussed with our dealership team based on the vehicle and buyer requirements.',
    },
    {
      id: 'faq-4',
      question: 'Can I book a test drive?',
      answer: 'Yes. Contact the showroom team to arrange a convenient viewing or test drive.',
    },
    {
      id: 'faq-5',
      question: 'Are service records available?',
      answer:
        'Available service records are shown in the vehicle documentation section. Additional records can be requested from the showroom team.',
    },
    {
      id: 'faq-6',
      question: 'Do you accept trade-ins?',
      answer:
        'Trade-ins can be discussed with the dealership team after reviewing the current vehicle details.',
    },
  ],
  benefits: [
    {
      id: 'benefit-1',
      iconKey: 'history',
      title: 'Verified vehicle history',
      description: 'Review ownership, service and accident records before you make an offer.',
      tone: 'mint',
    },
    {
      id: 'benefit-2',
      iconKey: 'inspection',
      title: '142-point inspection',
      description:
        'Every vehicle is carefully checked across safety, mechanical and cosmetic details.',
      tone: 'rose',
    },
    {
      id: 'benefit-3',
      iconKey: 'financing',
      title: 'Flexible financing',
      description:
        'Explore payment options that fit your budget with clear, straightforward terms.',
      tone: 'blue',
    },
    {
      id: 'benefit-4',
      iconKey: 'warranty',
      title: 'Warranty included',
      description: 'Drive away with added reassurance and support after your purchase is complete.',
      tone: 'sand',
    },
  ],
};

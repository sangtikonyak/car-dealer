import {
  BadgeCheck,
  CalendarCheck2,
  CarFront,
  CircleDollarSign,
  FileText,
  Gauge,
  HandCoins,
  History,
  KeyRound,
  MapPin,
  Phone,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Wrench,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { HomepageIconKey } from './types';

export const homepageIconRegistry: Record<HomepageIconKey, LucideIcon> = {
  history: History,
  inspection: BadgeCheck,
  financing: HandCoins,
  warranty: ShieldCheck,
  vehicle: CarFront,
  performance: Gauge,
  maintenance: Wrench,
  search: Search,
  documentation: FileText,
  price: CircleDollarSign,
  testDrive: CalendarCheck2,
  location: MapPin,
  contact: Phone,
  rating: Star,
  premium: Sparkles,
  keys: KeyRound,
  trust: ThumbsUp,
  journey: Route,
  electric: Zap,
  support: ShieldCheck,
};

export const getHomepageIcon = (key: string): LucideIcon =>
  homepageIconRegistry[key as HomepageIconKey] ?? ShieldCheck;

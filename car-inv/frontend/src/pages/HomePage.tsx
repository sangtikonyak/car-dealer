import { BenefitsSection } from '../components/BenefitsSection';
import { BookingCta } from '../components/BookingCta';
import { FaqSection } from '../components/FaqSection';
import { Hero } from '../components/Hero';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { LatestListingsSection } from '../components/LatestListingsSection';
import { MobileAppSection } from '../components/MobileAppSection';
import { ShowroomSection } from '../components/ShowroomSection';

export function HomePage() {
  return (
    <main>
      <Hero />
      <LatestListingsSection />
      <HowItWorksSection />
      <ShowroomSection />
      <FaqSection />
      <MobileAppSection />
      <BenefitsSection />
      <BookingCta />
    </main>
  );
}

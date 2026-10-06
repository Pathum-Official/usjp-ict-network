import { HeroSection } from "@/components/public/hero-section";
import { BirthdaySection } from "@/components/public/birthday-section";
import { AboutSection } from "@/components/public/about-section";
import { AchievementsSection } from "@/components/public/achievements-section";
import { EventsSection } from "@/components/public/events-section";
import { CommitteeSection } from "@/components/public/committee-section";
import { GallerySection } from "@/components/public/gallery-section";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <BirthdaySection />
      <AboutSection />
      <AchievementsSection />
      <EventsSection />
      <GallerySection />
      <CommitteeSection />
    </div>
  );
}

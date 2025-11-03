import Header from "@/components/layout/Header";
import HeroSection from "@/components/home/HeroSection";
import CompetitionsSection from "@/components/home/CompetitionsSection";
import VoterOnboardingSection from "@/components/home/VoterOnboardingSection";
import Footer from "@/components/layout/Footer";
import React from "react";


const LazyOnboardingVideo = React.lazy(() => import("@/components/home/OboardingVideo"));
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <VoterOnboardingSection />
        <CompetitionsSection />
        <LazyOnboardingVideo />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

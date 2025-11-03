import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardNotifications } from "@/components/dashboard/DashboardNotifications";
import { EditProfile } from "@/components/dashboard/EditProfile";
import { PublicProfile } from "@/components/dashboard/profile";
// import { DashboardCompetitions } from "@/components/dashboard/DashboardCompetitions";
import { Votes } from "@/components/dashboard/Votes";
import { PrizeHistory } from "@/components/dashboard/PrizeHistory";
import { Settings } from "@/components/dashboard/Settings";
import { Support } from "@/components/dashboard/Support";
import { OfficialRules } from "@/components/dashboard/OfficialRules";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import Header from "@/components/layout/Header";
import { ONBOARDING_REDIRECT } from "@/routes";
import { DashboardSection } from "@/routes/dashboard/$section";
import Leaderboard from "@/pages/Leaderboard";
import { CompetitionsPage } from "@/components/competitions/CompetitionsPage";
import { Gamification } from "@/components/dashboard/Gamification";
import ReferralsTab from "@/components/dashboard/ReferralsTab";
import VotersLeaderboardTab from "@/components/dashboard/VotersLeaderboardTab";

function DashboardLayout({
  activeSection = "profile",
  setActiveSection,
  children,
}: {
  activeSection: DashboardSection;
  setActiveSection: (section: DashboardSection) => void;
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const handleSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSidebarToggle={handleSidebarToggle} />
      <div className="flex pt-16">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block">
          <Sidebar 
            activeSection={activeSection} 
            setActiveSection={setActiveSection} 
            onExpandedChange={setIsSidebarExpanded}
          />
        </aside>

        {/* Mobile Sidebar */}
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} isMobile={true} isOpen={isMobileSidebarOpen} onToggle={() => setIsMobileSidebarOpen(false)} />

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 transition-all duration-300 ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-16'}`}>{children}</main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const params = useParams({ from: "/dashboard/$section", shouldThrow: false });
  const currentSection = params?.section || "profile";

  const { isAuthenticated, isLoading, checkUserNeedsOnboarding } = useAuth();
  const [activeSection, setActiveSection] = useState<DashboardSection>(currentSection || "profile");
  const [isNavigating, setIsNavigating] = useState(false);

  // Auth and onboarding checks
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.navigate({ to: "/auth/$id", params: { id: "sign-in" }, replace: true });
    } else if (checkUserNeedsOnboarding()) {
      console.log("Dashboard: User needs onboarding, redirecting to onboarding (fallback check)");
      router.navigate({ to: ONBOARDING_REDIRECT, replace: true });
    }
    // eslint-disable-next-line
  }, [isAuthenticated, isLoading, checkUserNeedsOnboarding]);

  // Update URL when section changes (only if user changes section)
  const handleSetActiveSection = useCallback((newSection: DashboardSection) => {
    if (newSection === activeSection) return; // Prevent unnecessary updates
    
    setIsNavigating(true);
    setActiveSection(newSection);
    // Always navigate to update the URL, even if currentSection is undefined
    router.navigate({ to: "/dashboard/$section", params: { section: newSection } }).finally(() => {
      setIsNavigating(false);
    });
  }, [activeSection, router]);

  // Sync state with URL param - only when URL changes externally
  useEffect(() => {
    if (currentSection && currentSection !== activeSection && !isNavigating) {
      setActiveSection(currentSection);
    }
  }, [currentSection, activeSection, isNavigating]);

  const renderContent = useMemo(() => {
    // Show loading state during navigation to prevent flickering
    if (isNavigating) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case "edit-profile":
        return <EditProfile />;
      case "notifications":
        return <DashboardNotifications />;
      case "profile":
        return <PublicProfile />;
      case "competitions":
        return <CompetitionsPage />;
      case "votes":
        return <Votes />;
      case "referrals":
        return <ReferralsTab />;
      case "voters-leaderboard":
        return <VotersLeaderboardTab />;
      case "prize-history":
        return <PrizeHistory />;
      case "leaderboard":
        return <Leaderboard />;
      case "gamification":
        return <Gamification />;
      case "settings":
        return <Settings />;
      case "support":
        return <Support />;
      case "official-rules":
        return <OfficialRules />;
      case "privacy":
        return <PrivacyPolicy />;
      default:
        return <DashboardNotifications />;
    }
  }, [activeSection, isNavigating]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || checkUserNeedsOnboarding()) {
    // Don't render dashboard if not authenticated or not onboarded
    return null;
  }

  return (
    <DashboardLayout activeSection={activeSection} setActiveSection={handleSetActiveSection}>
      {renderContent}
    </DashboardLayout>
  );
}

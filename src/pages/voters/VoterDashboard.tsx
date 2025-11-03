import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearch, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { VoterSidebar } from "@/components/voter/VoterSidebar";
import Header from "@/components/layout/Header";
import { VoterOverview } from "@/components/voter/VoterOverview";
import { VoterCompetitions } from "@/components/voter/VoterCompetitions";
import { VoterMilestones } from "@/components/voter/VoterMilestones";
import { VoterAchievements } from "@/components/voter/VoterAchievements";
import { VoterUnlocks } from "@/components/voter/VoterUnlocks";
import { VoterSpinWheel } from "@/components/voter/VoterSpinWheel";
import { VoterBuyVotes } from "@/components/voter/VoterBuyVotes";
import { Settings } from "@/components/dashboard/Settings";
import { Support } from "@/components/dashboard/Support";
import { OfficialRules } from "@/components/dashboard/OfficialRules";
import { useVoterStats } from "@/hooks/api/useVoter";

type VoterSection = 
  | "overview" 
  | "competitions" 
  | "milestones" 
  | "achievements" 
  | "unlocks" 
  | "spin-wheel"
  | "buy-votes"
  | "settings" 
  | "support" 
  | "official-rules";

function VoterDashboardLayout({
  activeSection = "overview",
  setActiveSection,
  children,
}: {
  activeSection: VoterSection;
  setActiveSection: (section: VoterSection) => void;
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
          <VoterSidebar 
            activeSection={activeSection} 
            setActiveSection={setActiveSection} 
            onExpandedChange={setIsSidebarExpanded}
          />
        </aside>

        {/* Mobile Sidebar */}
        <VoterSidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection} 
          isMobile={true} 
          isOpen={isMobileSidebarOpen} 
          onToggle={() => setIsMobileSidebarOpen(false)} 
        />

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 transition-all duration-300 ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-16'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function VoterDashboard() {
  const router = useRouter();
  const navigate = useNavigate();
  const search = useSearch({ strict: false, shouldThrow: false }) as { section?: string; payment?: string };
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<VoterSection>(
    (search?.section as VoterSection) || "overview"
  );
  const [isNavigating, setIsNavigating] = useState(false);

  // Fetch voter stats
  const { data: stats } = useVoterStats(user?.id);

  // Update section from URL param if present
  useEffect(() => {
    if (search?.section) {
      const validSection = search.section as VoterSection;
      if (["overview", "competitions", "milestones", "achievements", "unlocks", "spin-wheel", "buy-votes", "settings", "support", "official-rules"].includes(validSection)) {
        setActiveSection(validSection);
      }
    }
  }, [search?.section]);

  // Handle payment cancellation notification
  useEffect(() => {
    if (search?.payment === "cancelled") {
      toast({
        title: "❌ Purchase Cancelled",
        description: "Your payment was cancelled. No charges were made. You can try again anytime.",
        duration: 5000,
      });
      
      // Clean up URL by removing payment param
      navigate({
        to: "/voters",
        search: { section: search?.section || "buy-votes" },
        replace: true,
      });
    }
  }, [search?.payment, search?.section, toast, navigate]);

  // Auth check - redirect non-voters
  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      router.navigate({ to: "/auth/$id", params: { id: "sign-in" }, replace: true });
      return;
    }

    if (user && user.type !== "VOTER") {
      router.navigate({ to: "/dashboard/profile", replace: true });
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleSetActiveSection = useCallback((newSection: VoterSection) => {
    if (newSection === activeSection) return;
    setIsNavigating(true);
    setActiveSection(newSection);
    setTimeout(() => setIsNavigating(false), 100);
  }, [activeSection]);

  const renderContent = useMemo(() => {
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
      case "overview":
        return <VoterOverview stats={stats} userId={user?.id} />;
      case "competitions":
        return <VoterCompetitions userId={user?.id} />;
      case "milestones":
        return <VoterMilestones userId={user?.id} />;
      case "achievements":
        return <VoterAchievements stats={stats} />;
      case "unlocks":
        return <VoterUnlocks stats={stats} />;
      case "spin-wheel":
        return <VoterSpinWheel userId={user?.id} spinData={stats?.spinWheelData} />;
      case "buy-votes":
        return <VoterBuyVotes userId={user?.id} />;
      case "settings":
        return <Settings />;
      case "support":
        return <Support />;
      case "official-rules":
        return <OfficialRules />;
      default:
        return <VoterOverview stats={stats} userId={user?.id} />;
    }
  }, [activeSection, isNavigating, stats, user?.id]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || (user && user.type !== "VOTER")) {
    return null;
  }

  return (
    <VoterDashboardLayout activeSection={activeSection} setActiveSection={handleSetActiveSection}>
      {renderContent}
    </VoterDashboardLayout>
  );
}

import { Bell, User, Users, Trophy, Vote, Gift, Settings as SettingsIcon, HelpCircle, FileText, Shield, Lock, LogOut, ChevronLeft, ChevronRight, TrendingUp, Share2, Award, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { DashboardSection } from "@/pages/Dashboard";

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardSection } from "@/routes/dashboard/$section";

interface SidebarProps {
  activeSection: DashboardSection;
  setActiveSection: (section: DashboardSection) => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onExpandedChange?: (expanded: boolean) => void;
}

const sidebarItemsMain = [
  { id: "profile" as DashboardSection, label: "Profile", icon: Users },
  { id: "competitions" as DashboardSection, label: "Competitions", icon: Trophy },
  { id: "votes" as DashboardSection, label: "Votes", icon: Vote },
  { id: "referrals" as DashboardSection, label: "Referrals", icon: Share2 },
  { id: "voters-leaderboard" as DashboardSection, label: "Voters Leaderboard", icon: Crown },
  // { id: "prize-history" as DashboardSection, label: "Prize History", icon: Gift },
  // { id: "leaderboard" as DashboardSection, label: "Leaderboard", icon: TrendingUp },
  { id: "settings" as DashboardSection, label: "Settings", icon: SettingsIcon },

  // { id: "notifications" as DashboardSection, label: "Notifications", icon: Bell },
];

const sidebarItemsSecondary = [
  { id: "support" as DashboardSection, label: "Support", icon: HelpCircle },
  { id: "official-rules" as DashboardSection, label: "Official Rules", icon: FileText },
  // { id: "privacy" as DashboardSection, label: "Privacy Policy", icon: Lock },
];

export function Sidebar({ activeSection, setActiveSection, isMobile = false, isOpen = false, onToggle, onExpandedChange }: SidebarProps) {
  const { handleLogout } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogoutClick = async () => {
    await handleLogout();
    navigate({ to: "/auth/$id", params: { id: "sign-in" } });
  };

  const toggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  // Mobile sidebar
  if (isMobile) {
    return (
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onToggle} // Close sidebar when clicking outside
      >
        {/* Sidebar content */}
        <div
          className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-border transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside sidebar
        >
          <div className="w-full h-full flex flex-col bg-white shadow-2xl">
            <div className="p-4 border-b border-border bg-white flex justify-between">
              <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
              <Button variant="ghost" size="sm" onClick={onToggle} className="p-1 h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <nav className="flex-1 p-4 space-y-2 bg-white">
              {sidebarItemsMain.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveSection(item.id);
                      onToggle?.();
                    }}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-border bg-white">
              <nav className="space-y-2 bg-white">
                {sidebarItemsSecondary.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveSection(item.id);
                        onToggle?.();
                      }}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}

                <Button className={`w-full transition-all justify-start duration-200`} variant="ghost" onClick={() => navigate({ to: "/privacy" })}>
                  <Lock className={`mr-3 h-4 w-4`} />
                  Privacy Policy
                </Button>

                <div className="pt-4 border-t border-border">
                  <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogoutClick}>
                    <LogOut className="mr-3 h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <div className={`bg-card border-r border-border h-screen flex flex-col transition-all duration-300 fixed left-0 top-16 z-40 ${isExpanded ? "w-64" : "w-16"} will-change-transform`}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        {isExpanded ? (
          <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        ) : (
          <></>
          // <div className="w-8 h-8 bg-primary flex-shrink-0 rounded rounded-lg flex items-center justify-center">
          //   <span className="text-primary-foreground font-bold text-sm">S</span>
          // </div>
        )}
        <Button variant="ghost" size="sm" onClick={toggleExpand} className="p-1 h-8 w-8">
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {sidebarItemsMain.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={`w-full transition-all duration-200 ${isExpanded ? "justify-start" : "justify-center"}`}
              onClick={() => setActiveSection(item.id)}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon className={`h-4 w-4 ${isExpanded ? "mr-3" : ""}`} />
              {isExpanded && item.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border">
        <nav className="space-y-1">
          {sidebarItemsSecondary.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "default" : "ghost"}
                className={`w-full transition-all duration-200 ${isExpanded ? "justify-start" : "justify-center"}`}
                onClick={() => setActiveSection(item.id)}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon className={`h-4 w-4 ${isExpanded ? "mr-3" : ""}`} />
                {isExpanded && item.label}
              </Button>
            );
          })}
          <Button className={`w-full transition-all duration-200 ${isExpanded ? "justify-start" : "justify-center"}`} variant="ghost" onClick={() => navigate({ to: "/privacy" })}>
            <Lock className={`h-4 w-4 ${isExpanded ? "mr-3" : ""}`} />
            {isExpanded && "Privacy Policy"}
          </Button>
          <div className="pt-2 border-t border-border">
            <Button
              variant="ghost"
              className={`w-full transition-all duration-200 text-destructive hover:text-destructive hover:bg-destructive/10 ${isExpanded ? "justify-start" : "justify-center"}`}
              onClick={handleLogoutClick}
              title={!isExpanded ? "Log Out" : undefined}
            >
              <LogOut className={`h-4 w-4 ${isExpanded ? "mr-3" : ""}`} />
              {isExpanded && "Log Out"}
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
}

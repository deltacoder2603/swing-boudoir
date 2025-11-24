import { 
  Heart, 
  Search,
  Settings as SettingsIcon, 
  HelpCircle, 
  FileText, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

type VoterSection = 
  | "overview" 
  | "competitions"
  | "search-models"
  | "settings" 
  | "support" 
  | "official-rules";

interface VoterSidebarProps {
  activeSection: VoterSection;
  setActiveSection: (section: VoterSection) => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onExpandedChange?: (expanded: boolean) => void;
}

const sidebarItemsMain = [
  { id: "overview" as VoterSection, label: "Overview", icon: Home },
  { id: "competitions" as VoterSection, label: "Vote in Contests", icon: Heart },
  { id: "search-models" as VoterSection, label: "Search Models", icon: Search },
  { id: "settings" as VoterSection, label: "Settings", icon: SettingsIcon },
];

const sidebarItemsSecondary = [
  { id: "support" as VoterSection, label: "Support", icon: HelpCircle },
  { id: "official-rules" as VoterSection, label: "Official Rules", icon: FileText },
];

export function VoterSidebar({ 
  activeSection, 
  setActiveSection, 
  isMobile = false, 
  isOpen = false, 
  onToggle, 
  onExpandedChange 
}: VoterSidebarProps) {
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
        onClick={onToggle}
      >
        <div
          className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-border transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
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
                      variant={activeSection === item.id ? "ghost" : "ghost"}
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
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogoutClick}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <div
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] border-r border-border bg-white transition-all duration-300 ${
        isExpanded ? "w-64" : "w-16"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Toggle button */}
        <div className="p-2 border-b border-border flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpand}
            className="p-1 h-8 w-8"
          >
            {isExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
          {sidebarItemsMain.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "default" : "ghost"}
                className={`w-full ${isExpanded ? "justify-start" : "justify-center p-2"}`}
                onClick={() => setActiveSection(item.id)}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon className={`h-4 w-4 ${isExpanded ? "mr-3" : ""}`} />
                {isExpanded && item.label}
              </Button>
            );
          })}
        </nav>

        {/* Secondary navigation */}
        <div className="p-2 border-t border-border">
          <nav className="space-y-2">
            {sidebarItemsSecondary.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full ${isExpanded ? "justify-start" : "justify-center p-2"}`}
                  onClick={() => setActiveSection(item.id)}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon className={`h-4 w-4 ${isExpanded ? "mr-3" : ""}`} />
                  {isExpanded && item.label}
                </Button>
              );
            })}
            <Button
              variant="ghost"
              className={`w-full text-red-600 hover:text-red-700 hover:bg-red-50 ${
                isExpanded ? "justify-start" : "justify-center p-2"
              }`}
              onClick={handleLogoutClick}
              title={!isExpanded ? "Logout" : undefined}
            >
              <LogOut className={`h-4 w-4 ${isExpanded ? "mr-3" : ""}`} />
              {isExpanded && "Logout"}
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}


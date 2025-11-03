import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import { createFileRoute } from "@tanstack/react-router";

export const dashboardSections = [
  "edit-profile",
  "notifications",
  "profile",
  "competitions",
  "votes",
  "referrals",
  "voters-leaderboard",
  "prize-history",
  "leaderboard",
  "gamification",
  "settings",
  "support",
  "official-rules",
  "privacy",
] as const;

export type DashboardSection = (typeof dashboardSections)[number];

export const Route = createFileRoute("/dashboard/$section")({
  params: {
    parse: (params) => {
      const section =
        (params.section as DashboardSection) ?? "notifications";

      if (!dashboardSections.includes(section)) {
        throw new Error(`Invalid dashboard route: ${params.section}`);
      }

      return { section } as const;
    },
  },
  component: () => (
    <>
      <Dashboard />
    </>
  ),
});


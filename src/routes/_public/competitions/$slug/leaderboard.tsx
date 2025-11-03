import { useContestBySlug, useContestLeaderboard } from "@/hooks/api/useContests";
import { createFileRoute } from "@tanstack/react-router";
import ContestLeaderboard from "@/components/competitions/ContestLeaderboard";

export const Route = createFileRoute("/_public/competitions/$slug/leaderboard")({
  component: ContestLeaderboard,
});

export default ContestLeaderboard;

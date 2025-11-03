import { useContestBySlug, useContestLeaderboard } from "@/hooks/api/useContests";
import { createFileRoute } from "@tanstack/react-router";
import ContestResults from "@/components/competitions/ContestResults";

export const Route = createFileRoute("/_public/competitions/$slug/results")({
  component: ContestResults,
});

export default ContestResults;

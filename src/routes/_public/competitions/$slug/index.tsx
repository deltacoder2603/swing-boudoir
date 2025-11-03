import { CompetitionDetails } from "@/components/competitions/CompetitionDetails";
import NotFound from "@/components/global/NotFound";
import { PageLoader } from "@/components/PageLoader";
import { api } from "@/lib/api";
import { Contest } from "@/types/contest.types";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";

// Dummy data for competitions (same as in CompetitionDetails)
const createContest = (
  id: string,
  name: string,
  description: string,
  slug: string,
  prizePool: number,
  startDate: Date,
  endDate: Date,
  status: "ACTIVE" | "UPCOMING" | "ENDED",
  awards: Array<{ id: string; name: string; icon: string }>,
  imageId: string,
  winnerProfileId: string | null = null
): Contest => ({
  id,
  name,
  description,
  slug,
  prizePool,
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
  registrationDeadline: new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  resultAnnounceDate: new Date(endDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  status,
  visibility: "PUBLIC",
  isFeatured: status === "ACTIVE",
  isVerified: true,
  isVotingEnabled: true,
  rules: `Show your best ${name.toLowerCase()} and get votes from the community!`,
  requirements: "Must be 18+ years old",
  images: [{ url: "/placeholder.svg", id: imageId }],
  awards,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  winnerProfileId
});

const dummyCompetitions: Contest[] = [
  // Active competitions
  createContest(
    "dummy-active-1",
    "Summer Beauty Contest 2024",
    "Showcase your summer beauty and win amazing prizes!",
    "summer-beauty-contest-2024",
    5000,
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    "ACTIVE",
    [
      { id: "award1", name: "First Place", icon: "🥇" },
      { id: "award2", name: "Second Place", icon: "🥈" },
      { id: "award3", name: "Third Place", icon: "🥉" }
    ],
    "img1"
  ),
  createContest(
    "dummy-active-2",
    "Fashion Forward Challenge",
    "Push the boundaries of fashion and style in this exciting competition.",
    "fashion-forward-challenge",
    7500,
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
    "ACTIVE",
    [
      { id: "award4", name: "Fashion Icon", icon: "👗" },
      { id: "award5", name: "Style Star", icon: "⭐" },
      { id: "award6", name: "Trendsetter", icon: "🔥" }
    ],
    "img2"
  ),
  createContest(
    "dummy-active-3",
    "Photography Excellence",
    "Capture the perfect moment and showcase your photography skills.",
    "photography-excellence",
    3000,
    new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    "ACTIVE",
    [
      { id: "award7", name: "Best Shot", icon: "📸" },
      { id: "award8", name: "Artistic Vision", icon: "🎭" }
    ],
    "img3"
  ),
  // Upcoming competitions
  createContest(
    "dummy-upcoming-1",
    "Winter Wonderland Contest",
    "Get ready for the most magical winter competition of the year!",
    "winter-wonderland-contest",
    10000,
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    "UPCOMING",
    [
      { id: "award9", name: "Winter Queen", icon: "❄️" },
      { id: "award10", name: "Snow Princess", icon: "👑" },
      { id: "award11", name: "Ice Beauty", icon: "🧊" }
    ],
    "img4"
  ),
  // Completed competitions
  createContest(
    "dummy-completed-1",
    "Autumn Elegance Contest",
    "A beautiful competition that celebrated the colors and grace of autumn.",
    "autumn-elegance-contest",
    4000,
    new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    "ENDED",
    [
      { id: "award20", name: "Autumn Queen", icon: "🍂" },
      { id: "award21", name: "Elegant Beauty", icon: "👸" },
      { id: "award22", name: "Golden Hour", icon: "🌅" }
    ],
    "img8",
    "winner-profile-1"
  )
];

export const Route = createFileRoute("/_public/competitions/$slug/")({
  component: React.lazy(() => import("@/components/competitions/CompetitionDetails").then(module => ({ default: module.CompetitionDetails }))),
  pendingComponent: () => <PageLoader title="Loading competition..." description="Please wait while we get competition details from the web" />,
  loader: async ({ params }) => {
    try {
      // First try to get from API
      const response = await api.get<Contest>(`/api/v1/contest/slug/${params.slug}`);
      if (response.success) {
        return response.data;
      }
    } catch (apiError) {
      // If API fails, try to find in dummy data
      const dummyContest = dummyCompetitions.find(contest => contest.slug === params.slug);
      if (dummyContest) {
        return dummyContest;
      }
    }
    throw new Error("Competition not found");
  },
  errorComponent: () => <NotFound title="Competition Not Found" description="The competition you're looking for doesn't exist or has been removed." />,
});

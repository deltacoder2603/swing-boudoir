import defaultImage from "@/assets/hot-girl-summer.jpg";
import { ContestJoinButton } from "@/components/global";
import { api } from "@/lib/api";
import { Contest_Status } from "@/lib/validations/contest.schema";
import { Route } from "@/routes/_public/competitions/$slug";
import { Contest } from "@/types/contest.types";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, Clock, DollarSign, Share2, Trophy, Users, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useAuth } from "@/contexts/AuthContext";

const formatDate = (date: string | Date) => {
  return format(new Date(date), "MMM dd, yyyy");
};

// Dummy data for competitions (same as in CompetitionsPage)
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

export function CompetitionDetails() {
  const { slug } = useParams({ from: "/_public/competitions/$slug" });
  const initialData = Route.useLoaderData();
  const { user } = useAuth();

  const {
    data: competition,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["competition", slug],
    queryFn: async (): Promise<Contest> => {
      // First try to get from API
      try {
        const response = await api.get<Contest>(`/api/v1/contest/slug/${slug}`);
        return response.data;
      } catch (apiError) {
        // If API fails, try to find in dummy data
        const dummyContest = dummyCompetitions.find(contest => contest.slug === slug);
        if (dummyContest) {
          return dummyContest;
        }
        throw apiError;
      }
    },
    initialData,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Competition Not Found</h1>
          <p className="text-gray-600">The competition you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const getImageUrl = (images: { url: string }[] | null) => {
    if (images && images.length > 0) {
      return images[0].url;
    }
    return defaultImage;
  };

  const getStatusBadge = (status: keyof typeof Contest_Status) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge className="bg-green-700 text-white">Active</Badge>;
      case "COMPLETED":
      case "BOOKED":
        return <Badge variant="secondary">Completed</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Upcoming</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isCompetitionCompleted = () => {
    const now = new Date();
    const endDate = new Date(competition.endDate);
    return now > endDate || competition.status === "COMPLETED" || competition.status === "BOOKED";
  };

  const shareCompetition = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link Copied!", {
        description: "Competition link has been copied to clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy link:", err);
      toast.error("Copy Failed", {
        description: "Failed to copy link to clipboard.",
      });
    }
  };

  const shareProfile = async () => {
    if (!user?.username) {
      toast.error("Profile not available", {
        description: "Unable to share profile at this time.",
      });
      return;
    }
    
    const url = `${window.location.origin}/profile/${user.username}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Profile Link Copied!", {
        description: "Your profile link has been copied to clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy profile link:", err);
      toast.error("Copy Failed", {
        description: "Failed to copy profile link to clipboard.",
      });
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* Hero Section with Image and Title */}
        <div className="relative">
          <div className="relative h-[520px] rounded-2xl overflow-hidden mb-6">
            <img src={getImageUrl(competition?.images ?? [])} alt={competition.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-0 right-0 py-6 px-8">
              <div className="flex items-center space-x-3 mb-4">{getStatusBadge(competition.status)}</div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 md:p-8">
              <div className="flex items-center space-x-3 md:mb-4">
                <Button
                  onClick={shareCompetition}
                  variant="outline"
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-secondary hover:text-black"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                {user?.username && (
                  <Button
                    onClick={shareProfile}
                    variant="outline"
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-secondary hover:text-black"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Share Profile
                  </Button>
                )}
              </div>
            </div>
            <div className="absolute md:bottom-0 bottom-10 left-0 p-4 pb-6 md:pb-8 md:p-8 md:pr-40">
              <h1 className="text-3xl capitalize font-bold text-white mb-2">{competition.name}</h1>
              <p className="text-white/90 text-sm sentence-case max-w-3xl hidden md:block">{competition.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Competition</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{competition.description}</p>
              </CardContent>
            </Card>

            {/* Rules & Requirements */}
            {competition.rules && (
              <Card>
                <CardHeader>
                  <CardTitle>Rules & Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{competition.rules}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {competition.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{competition.requirements}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Awards */}
            {competition.awards && competition.awards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Awards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {competition.awards.map((award) => (
                      <div key={award.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-2xl">{award.icon}</span>
                        <span className="font-medium">{award.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Competition Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Prize Pool</p>
                    <p className="font-semibold">${competition.prizePool?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold">{formatDate(competition.startDate)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-semibold">{formatDate(competition.endDate)}</p>
                  </div>
                </div>

                {competition.registrationDeadline && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Registration Deadline</p>
                      <p className="font-semibold">{formatDate(competition.registrationDeadline)}</p>
                    </div>
                  </div>
                )}

                {competition.resultAnnounceDate && (
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">Results Announcement</p>
                      <p className="font-semibold">{formatDate(competition.resultAnnounceDate)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Get Involved</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isCompetitionCompleted() && (
                  <ContestJoinButton contest={competition} className="w-full" size="lg" showAuthModal={true} />
                )}
                <Button variant="outline" className="w-full" size="lg" asChild>
                  <Link to={`/competitions/$slug/participants`} params={{ slug: competition.slug }}>
                    View Participants
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" size="lg" asChild>
                  <Link to={`/competitions/$slug/leaderboard`} params={{ slug: competition.slug }}>
                    View Leaderboard
                  </Link>
                </Button>
                {isCompetitionCompleted() && (
                  <Button variant="outline" className="w-full" size="lg" asChild>
                    <Link to={`/competitions/$slug/results`} params={{ slug: competition.slug }}>
                      View Results
                    </Link>
                  </Button>
                )}
                <Button variant="outline" className="w-full" size="lg" onClick={shareCompetition}>
                  Share Competition
                </Button>
                {user?.username && (
                  <Button variant="outline" className="w-full" size="lg" onClick={shareProfile}>
                    Share Profile
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

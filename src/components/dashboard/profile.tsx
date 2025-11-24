import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useJoinedCompetitions } from "@/contexts/JoinedCompetitionsContext";
import { useJoinedContests } from "@/hooks/api/useContests";
import { useProfile } from "@/hooks/api/useProfile";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/image-helper";
import { formatUsdAbbrev } from "@/lib/utils";
import { Award } from "@/types";
import { Contest } from "@/types/contest.types";
import { getSocialMediaUrls } from "@/utils/social-media";
import { Link, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Camera, Clock, Edit, Eye, Gift, Globe, Heart, MapPin, RefreshCw, Share2, TrendingUp, Trophy, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Icons } from "../icons";
import { Lightbox } from "../Lightbox";

export function PublicProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { joinedCompetitions: localJoinedCompetitions } = useJoinedCompetitions();
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption: string } | null>(null);

  // Use the useProfile hook to fetch profile data by username
  const { useProfileByUsername, useProfileStats } = useProfile();
  const { data: userProfile, isLoading: isLoadingProfile, error: profileError, refetch: refetchProfile } = useProfileByUsername(user?.username || "");

  // Use the new profile stats hook
  const { data: profileStats, isLoading: isLoadingStats, error: statsError } = useProfileStats(userProfile?.id || "");

  const { data: joinedContestsData, isLoading: isLoadingJoined } = useJoinedContests(user?.profileId || "", 1, 50);
  
  // Combine API joined contests with local state (for competitions joined but not yet synced)
  const joinedCompetitions = useMemo(() => {
    const apiJoinedContests = joinedContestsData?.data || [];
    
    // Convert local joined competitions from context to Contest format
    const localContests: Contest[] = localJoinedCompetitions.map(comp => ({
      id: comp.id,
      name: comp.name,
      slug: comp.slug,
      prizePool: comp.prizePool,
      endDate: comp.endDate,
      startDate: new Date().toISOString(),
      status: "ACTIVE" as const,
      visibility: "PUBLIC" as const,
      isFeatured: true,
      isVerified: true,
      isVotingEnabled: true,
      rules: `Show your best ${comp.name.toLowerCase()} and get votes from the community!`,
      requirements: "Must be 18+ years old",
      images: comp.coverImage ? [{ url: comp.coverImage, id: "cover" }] : [{ url: "/placeholder.svg", id: "placeholder" }],
      awards: [
        { id: "award1", name: "First Place", icon: "🥇" },
        { id: "award2", name: "Second Place", icon: "🥈" },
        { id: "award3", name: "Third Place", icon: "🥉" }
      ],
      createdAt: comp.joinedAt,
      updatedAt: comp.joinedAt,
      winnerProfileId: null
    }));
    
    return [...apiJoinedContests, ...localContests];
  }, [joinedContestsData?.data, localJoinedCompetitions]);

  // Countdown timer for joined contests
  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: { [key: string]: string } = {};

      (joinedCompetitions || []).forEach((competition: Contest) => {
        const now = new Date().getTime();
        const end = new Date(competition.endDate).getTime();
        const difference = end - now;

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);

          newTimeLeft[competition.id] =
            `${days.toString().padStart(2, "0")} : ${hours.toString().padStart(2, "0")} : ${minutes.toString().padStart(2, "0")} : ${seconds.toString().padStart(2, "0")}`;
        } else {
          newTimeLeft[competition.id] = "Ended";
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [joinedCompetitions]);

  const shareProfile = async () => {
    try {
      const profileUrl = `${window.location.origin}/profile/${user?.username}`;
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Profile link copied!",
        description: "Share this link with your supporters to get more votes.",
      });
    } catch (error) {
      console.error("Error sharing profile:", error);
      toast({
        title: "Error sharing profile",
        description: "Failed to copy profile link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleImageClick = (image: { url: string; caption: string }) => {
    setLightboxImage(image);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const computeStatusForContest = (contest: Contest): "active" | "coming-soon" | "ended" => {
    const now = new Date();
    const start = new Date(contest.startDate);
    const end = new Date(contest.endDate);
    if (now < start) return "coming-soon";
    if (now > end) return "ended";
    return "active";
  };

  const getStatusBadge = (status: "active" | "coming-soon" | "ended") => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 font-medium">Live</Badge>;
      case "ended":
        return (
          <Badge variant="secondary" className="text-xs px-2 py-1 font-medium">
            Completed
          </Badge>
        );
      case "coming-soon":
        return (
          <Badge variant="outline" className="text-xs px-2 py-1 font-medium border-gray-300 text-gray-600">
            Upcoming
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs px-2 py-1 font-medium">
            {status}
          </Badge>
        );
    }
  };

  const activeCompetitions = (joinedCompetitions || []).filter((comp) => computeStatusForContest(comp) === "active");
  const comingSoonCompetitions = (joinedCompetitions || []).filter((comp) => computeStatusForContest(comp) === "coming-soon");
  const endedCompetitions = (joinedCompetitions || []).filter((comp) => computeStatusForContest(comp) === "ended");

  // Show loading state
  if (isLoadingProfile) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-1">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 animate-spin" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Loading profile</h3>
              <p className="text-sm sm:text-base text-gray-600">Getting your profile ready...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (profileError || error) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-1">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Error loading profile</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">{profileError?.message || error}</p>
              <Button onClick={() => refetchProfile()} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:p-4">
      {/* Banner and Profile Header Section */}
      <Card className="border-0 shadow-lg overflow-hidden">
        {/* Banner Image */}
        <div className="relative h-48 sm:h-72 bg-gradient-to-r from-blue-500 to-purple-600">
          {userProfile?.bannerImage?.url ? (
            <img src={getImageUrl(userProfile.bannerImage.url, "banner")} alt="Profile Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Camera className="h-16 w-16 text-white opacity-50" />
            </div>
          )}

          {/* Banner Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>

          {/* Action Buttons on Banner */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button onClick={shareProfile} variant="outline" size="sm" className="bg-white/90 hover:bg-white text-gray-700">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Link
              to="/dashboard/$section"
              params={{ section: "edit-profile" }}
              className="inline-flex items-center px-3 py-2 text-sm bg-white/90 hover:bg-white text-gray-700 rounded-md border border-gray-200 transition-colors"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="relative px-6 pb-6">
          {/* Avatar overlapping banner */}
          <div className="absolute -top-40 left-6">
            <div className="w-32 h-32 rounded-full border-none p-[6px] shadow-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              <div className="w-full h-full bg-white rounded-full p-1">
                {userProfile?.coverImage?.url ? (
                  <img src={getImageUrl(userProfile.coverImage.url, "small")} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-600">{user?.name?.charAt(0) || "U"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* View Public Profile Button - Right side below banner */}
          <div className="absolute -top-16 right-2 md:-top-8 md:right-6">
            <Link
              to="/profile/$username"
              params={{ username: user?.username || "" }}
              className="inline-flex items-center px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Public Profile
            </Link>
          </div>

          {/* Profile Content */}
          <div className="mt-20 sm:mt-24 space-y-4">
            {/* Name and Basic Info */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{user?.name || "User"}</h1>
              <p className="text-gray-600 text-lg">{user?.email}</p>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="mr-1 h-4 w-4" />
                <span>{userProfile?.city && userProfile?.country ? `${userProfile.city}, ${userProfile.country}` : "Location not set"}</span>
                <span className="mx-2">•</span>
                <span>Member since {formatDate(userProfile?.createdAt || "")}</span>
              </div>
            </div>

            {/* Bio */}
            <div className="max-w-2xl">
              <p className="text-gray-700 text-base leading-relaxed">
                {userProfile?.bio || "Welcome to my profile! I love participating in competitions and showcasing my talents."}
              </p>
              {userProfile?.hobbiesAndPassions && (
                <p className="text-gray-600 text-sm mt-2">
                  <span className="font-medium">Passions:</span> {userProfile.hobbiesAndPassions}
                </p>
              )}
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4 pt-2">
              <span className="text-sm font-medium text-gray-700">Connect:</span>
              <div className="flex space-x-3">
                {(() => {
                  const socialUrls = getSocialMediaUrls(userProfile || {});
                  return (
                    <>
                      <Link
                        to={socialUrls.instagram || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors ${!socialUrls.instagram ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
                        onClick={(e) => !socialUrls.instagram && e.preventDefault()}
                      >
                        <Icons.instagram className="h-4 w-4 fill-pink-500" />
                      </Link>
                      <Link
                        to={socialUrls.twitter || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors ${!socialUrls.twitter ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
                        onClick={(e) => !socialUrls.twitter && e.preventDefault()}
                      >
                        <Icons.x className="h-4 w-4 fill-black" />
                      </Link>
                      <Link
                        to={socialUrls.facebook || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors ${!socialUrls.facebook ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
                        onClick={(e) => !socialUrls.facebook && e.preventDefault()}
                      >
                        <Icons.facebook className="h-4 w-4 fill-blue-500" />
                      </Link>
                      <a
                        href={socialUrls.tiktok || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors ${!socialUrls.tiktok ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
                        onClick={(e) => !socialUrls.tiktok && e.preventDefault()}
                      >
                        <Icons.tiktok className="h-4 w-4 fill-black" />
                      </a>
                      <Link
                        to={socialUrls.youtube || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors ${!socialUrls.youtube ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
                        onClick={(e) => !socialUrls.youtube && e.preventDefault()}
                      >
                        <Icons.youtube className="h-4 w-4 fill-red-500 text-red-500" />
                      </Link>
                      {socialUrls.website && (
                        <Link
                          to={socialUrls.website || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors ${!socialUrls.website ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
                          onClick={(e) => !socialUrls.website && e.preventDefault()}
                        >
                          <Globe className="h-4 w-4" />
                        </Link>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Overview Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg sm:text-xl text-gray-800">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-7 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-lg border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{userProfile?.rank}</p>
                    <p className="text-gray-600 text-sm font-medium">Current Rank</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{profileStats?.totalCompetitions || 0}</p>
                    <p className="text-gray-600 text-sm font-medium">Competitions</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{formatUsdAbbrev(profileStats?.totalEarnings || 0)}</p>
                    <p className="text-gray-600 text-sm font-medium">Total Earnings</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Gift className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{profileStats?.activeContests || 0}</p>
                    <p className="text-gray-600 text-sm font-medium">Active Now</p>
                  </div>
                  <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-violet-600" />
                  </div>
                </div>
              </div>

              <Link to="/dashboard/$section" params={{ section: "votes" }} className="p-4 rounded-lg border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{(profileStats?.totalVotesReceived || 0).toLocaleString()}</p>
                    <p className="text-gray-600 text-sm font-medium">Total Votes</p>
                  </div>
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                    <Heart className="h-5 w-5 text-rose-600" />
                  </div>
                </div>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="competitions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="competitions" className="flex items-center space-x-2 text-sm font-medium">
            <Trophy className="h-4 w-4" />
            <span>My Competitions</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center space-x-2 text-sm font-medium">
            <Camera className="h-4 w-4" />
            <span>Photo Gallery</span>
          </TabsTrigger>
        </TabsList>

        {/* Competitions Tab */}
        <TabsContent value="competitions" className="space-y-6">
          {isLoadingJoined ? (
            <div className="space-y-4 py-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-9 w-28 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-9 w-36 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-full lg:w-80">
                      <div className="w-full aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (joinedCompetitions?.length || 0) === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center p-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Compete?</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">You haven't joined any competitions yet. Start your journey and showcase your talents!</p>
                <Link
                  to="/dashboard/$section"
                  params={{ section: "competitions" }}
                  className="inline-flex items-center px-8 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                >
                  Explore Competitions
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Active Competitions */}
              {activeCompetitions.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <CardTitle className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xl font-bold text-gray-800">Active Competitions</span>
                      </CardTitle>
                      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-sm px-3 py-1 w-fit">{activeCompetitions.length} Live Now</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6">
                      {activeCompetitions.map((competition: Contest) => (
                        <Card key={competition.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                              <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                    <Trophy className="mr-2 h-5 w-5 text-gray-600" />
                                    {competition.name}
                                  </h3>
                                  {getStatusBadge("active")}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <p className="text-gray-900 font-semibold">{formatUsdAbbrev(competition.prizePool)} Prize Pool</p>
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Clock className="mr-1 h-4 w-4" />
                                      <span className="font-mono font-bold">{timeLeft[competition.id] || "Loading..."}</span>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="text-sm">
                                      <span className="font-medium text-gray-700">Awards Available:</span>
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {competition.awards &&
                                          competition.awards.slice(0, 2).map((award: Award) => (
                                            <Badge key={award.id} variant="outline" className="text-xs">
                                              {award.icon} {award.name}
                                            </Badge>
                                          ))}
                                        {competition.awards && competition.awards.length > 2 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{competition.awards.length - 2} more
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      const shareUrl = `${window.location.origin}/vote/${competition.id}/${userProfile?.id}`;
                                      navigator.clipboard.writeText(shareUrl).then(() => {
                                        toast({
                                          title: "Share link copied!",
                                          description: "Share this link so people can vote for you in this competition.",
                                        });
                                      }).catch(() => {
                                        toast({
                                          title: "Failed to copy link",
                                          description: "Please try again.",
                                          variant: "destructive",
                                        });
                                      });
                                    }}
                                  >
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share to Vote
                                  </Button>
                                  <Button variant="outline" asChild>
                                    <Link to={`/competitions/$slug`} params={{ slug: competition.slug }}>
                                      View Competition
                                    </Link>
                                  </Button>
                                </div>
                              </div>

                              <div className="w-full lg:w-80">
                                {competition.images && competition.images[0] ? (
                                  <img
                                    src={getImageUrl(competition.images[0].url, "medium")}
                                    alt={competition.name}
                                    className="w-full aspect-video object-cover rounded-lg shadow-sm border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                    <Trophy className="h-12 w-12 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming and Completed in a grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Upcoming Competitions */}
                {comingSoonCompetitions.length > 0 && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-lg font-bold text-gray-800">Upcoming</span>
                        <Badge variant="secondary" className="text-xs">
                          {comingSoonCompetitions.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {comingSoonCompetitions.slice(0, 3).map((competition: Contest) => (
                        <div key={competition.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm">{competition.name}</h4>
                            {getStatusBadge("coming-soon")}
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{formatUsdAbbrev(competition.prizePool)} Prize</p>
                          <p className="text-xs text-gray-600 font-medium">Starts {formatDistanceToNow(new Date(competition.startDate), { addSuffix: true })}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Completed Competitions */}
                {endedCompetitions.length > 0 && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-lg font-bold text-gray-800">Completed</span>
                        <Badge variant="secondary" className="text-xs">
                          {endedCompetitions.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {endedCompetitions.slice(0, 3).map((competition: Contest) => (
                        <div key={competition.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm">{competition.name}</h4>
                            {getStatusBadge("ended")}
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{formatUsdAbbrev(competition.prizePool)} Prize</p>
                          <p className="text-xs text-gray-600">Ended {formatDistanceToNow(new Date(competition.endDate), { addSuffix: true })}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Photo Gallery Tab */}
        <TabsContent value="gallery" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="text-xl font-bold text-gray-800">Photo Gallery</span>
                </div>
                <Link to="/dashboard/$section" params={{ section: "edit-profile" }} className="text-sm text-gray-600 hover:text-gray-700 flex items-center">
                  <Edit className="mr-1 h-4 w-4" />
                  Manage Photos
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <RefreshCw className="h-8 w-8 text-gray-600 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Loading photos...</h3>
                      <p className="text-gray-600">Getting your portfolio ready...</p>
                    </div>
                  </div>
                </div>
              ) : userProfile?.profilePhotos && userProfile.profilePhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {userProfile.profilePhotos.map((photo, index) => (
                    <div key={photo.id} className="relative group aspect-square">
                      <img
                        src={getImageUrl(photo.url, "medium")}
                        alt={photo.caption || `Portfolio photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                        onError={(e) => {
                          console.error("Failed to load photo:", e);
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white text-gray-900 hover:bg-gray-100"
                            onClick={() =>
                              setLightboxImage({
                                url: photo.url,
                                caption: photo?.caption ?? "",
                              })
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Camera className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No Photos Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">Upload some photos to showcase your portfolio and attract more votes in competitions.</p>
                  <Link
                    to="/dashboard/$section"
                    params={{ section: "edit-profile" }}
                    className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Upload Photos
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lightbox */}
      {lightboxImage && <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />}
    </div>
  );
}

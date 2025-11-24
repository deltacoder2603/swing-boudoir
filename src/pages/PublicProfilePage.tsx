import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/api/useProfile";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/image-helper";
import { formatUsdAbbrev } from "@/lib/utils";
import { getSocialMediaUrls } from "@/utils/social-media";
import { useNavigate } from "@tanstack/react-router";
import { Camera, Clock, Gift, Globe, Heart, MapPin, Share2, TrendingUp, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { Lightbox } from "@/components/Lightbox";
import { ContestsParticipationSection } from "@/components/profile/ContestsParticipationSection";
import { PortfolioGallery } from "@/components/profile/PortfolioGallery";
import { BuyVotesModal } from "@/components/profile/BuyVotesModal";
import { Route } from "@/routes/_public/profile.$username";
import { shareProfile } from "@/utils";
import Header from "@/components/layout/Header";
import { VoterSidebar } from "@/components/voter/VoterSidebar";

type VoterSection = 
  | "overview" 
  | "competitions"
  | "search-models"
  | "settings" 
  | "support" 
  | "official-rules";

export default function PublicProfilePage() {
  const {profile: modelProfile} = Route.useRouteContext();
  const participations = Route.useLoaderData();
  const { username } = Route.useParams();
  const search = Route.useSearch();
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption: string } | null>(null);
  const [isBuyVotesModalOpen, setIsBuyVotesModalOpen] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<VoterSection>("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  const { useProfileStats } = useProfile();
  const { data: profileStats, isLoading: isLoadingStats } = useProfileStats(modelProfile?.id || "");

  // Auto-open voting modal if contestId and autoOpenVote are in search params
  useEffect(() => {
    if (search.contestId && search.autoOpenVote && isAuthenticated && !authLoading && participations && participations.length > 0) {
      setIsBuyVotesModalOpen(true);
      // Clean up URL by removing the query params
      navigate({
        to: "/profile/$username",
        params: { username },
        replace: true,
      });
    }
  }, [search.contestId, search.autoOpenVote, isAuthenticated, authLoading, participations, username, navigate]);

  // Handle sidebar navigation
  const handleSidebarNavigation = (section: VoterSection) => {
    setActiveSection(section);
    // Navigate to voter dashboard with the selected section
    navigate({ 
      to: "/voters", 
      search: { section } 
    });
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const returnUrl = `/profile/${username}`;
      navigate({ 
        to: "/auth/$id", 
        params: { id: "sign-in" },
        search: { returnUrl, userType: "VOTER" }
      });
    }
  }, [isAuthenticated, authLoading, username, navigate]);

  const handleImageClick = (image: { url: string; caption: string }) => {
    setLightboxImage(image);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const handleBuyMoreVotesClick = () => {
    setIsBuyVotesModalOpen(true);
  };

  const handleShareProfile = async () => {
    await shareProfile(username);
    toast({
      title: "Profile link copied!",
      description: "Share this link with others to get more votes.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (!modelProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header onSidebarToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <div className="flex pt-16">
          <aside className="hidden md:block">
            <VoterSidebar 
              activeSection={activeSection} 
              setActiveSection={setActiveSection} 
              onExpandedChange={setIsSidebarExpanded}
            />
          </aside>
          <VoterSidebar 
            activeSection={activeSection} 
            setActiveSection={setActiveSection} 
            isMobile={true} 
            isOpen={isMobileSidebarOpen} 
            onToggle={() => setIsMobileSidebarOpen(false)} 
          />
          <main className={`flex-1 overflow-y-auto p-4 sm:p-6 transition-all duration-300 ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-16'}`}>
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Profile Not Found</h3>
                <p className="text-gray-600">This profile could not be loaded.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const activeParticipations = participations?.data || [];
  const socialUrls = getSocialMediaUrls(modelProfile);

  return (
    <div className="min-h-screen bg-background">
      <Header onSidebarToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
      <div className="flex pt-16">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block">
          <VoterSidebar 
            activeSection={activeSection} 
            setActiveSection={handleSidebarNavigation} 
            onExpandedChange={setIsSidebarExpanded}
          />
        </aside>

        {/* Mobile Sidebar */}
        <VoterSidebar 
          activeSection={activeSection} 
          setActiveSection={handleSidebarNavigation} 
          isMobile={true} 
          isOpen={isMobileSidebarOpen} 
          onToggle={() => setIsMobileSidebarOpen(false)} 
        />

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-16'}`}>
          <div className="max-w-6xl mx-auto space-y-6 sm:p-4">
            {/* Banner and Profile Header Section */}
            <Card className="border-0 shadow-lg overflow-hidden">
              {/* Banner Image */}
              <div className="relative h-48 sm:h-72 bg-gradient-to-r from-blue-500 to-purple-600">
                {modelProfile?.bannerImage?.url ? (
                  <img src={getImageUrl(modelProfile.bannerImage.url, "banner")} alt="Profile Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Camera className="h-16 w-16 text-white opacity-50" />
            </div>
                )}

                {/* Banner Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>

                {/* Action Buttons on Banner */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button onClick={handleShareProfile} variant="outline" size="sm" className="bg-white/90 hover:bg-white text-gray-700">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
            </Button>
          </div>
        </div>

              {/* Profile Info Section */}
              <div className="relative px-6 pb-6">
                {/* Avatar overlapping banner */}
                <div className="absolute -top-40 left-6">
                  <div className="w-32 h-32 rounded-full border-none p-[6px] shadow-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                    <div className="w-full h-full bg-white rounded-full p-1">
                      {modelProfile?.coverImage?.url ? (
                        <img src={getImageUrl(modelProfile.coverImage.url, "small")} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-4xl font-bold text-gray-600">{modelProfile.user?.name?.charAt(0) || "U"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Content */}
                <div className="mt-20 sm:mt-24 space-y-4">
                  {/* Name and Basic Info */}
                  <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{modelProfile.user?.name || "User"}</h1>
                    <p className="text-gray-600 text-lg">{modelProfile.user?.email}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="mr-1 h-4 w-4" />
                      <span>{modelProfile?.city && modelProfile?.country ? `${modelProfile.city}, ${modelProfile.country}` : "Location not set"}</span>
                      <span className="mx-2">•</span>
                      <span>Member since {formatDate(modelProfile?.createdAt || "")}</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="max-w-2xl">
                    <p className="text-gray-700 text-base leading-relaxed">
                      {modelProfile?.bio || "Welcome to my profile! I love participating in competitions and showcasing my talents."}
                    </p>
                    {modelProfile?.hobbiesAndPassions && (
                      <p className="text-gray-600 text-sm mt-2">
                        <span className="font-medium">Passions:</span> {modelProfile.hobbiesAndPassions}
                      </p>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center space-x-4 pt-2">
                    <span className="text-sm font-medium text-gray-700">Connect:</span>
                    <div className="flex space-x-3">
                      <a
                        href={socialUrls.instagram || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors ${!socialUrls.instagram ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
                        onClick={(e) => !socialUrls.instagram && e.preventDefault()}
                      >
                        <Icons.instagram className="h-4 w-4 fill-pink-500" />
                      </a>
                      <a
                        href={socialUrls.twitter || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors ${!socialUrls.twitter ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
                        onClick={(e) => !socialUrls.twitter && e.preventDefault()}
                      >
                        <Icons.x className="h-4 w-4 fill-black" />
                      </a>
                      <a
                        href={socialUrls.facebook || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors ${!socialUrls.facebook ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
                        onClick={(e) => !socialUrls.facebook && e.preventDefault()}
                      >
                        <Icons.facebook className="h-4 w-4 fill-blue-500" />
                      </a>
                      <a
                        href={socialUrls.tiktok || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors ${!socialUrls.tiktok ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
                        onClick={(e) => !socialUrls.tiktok && e.preventDefault()}
                      >
                        <Icons.tiktok className="h-4 w-4 fill-black" />
                      </a>
                      <a
                        href={socialUrls.youtube || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors ${!socialUrls.youtube ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
                        onClick={(e) => !socialUrls.youtube && e.preventDefault()}
                      >
                        <Icons.youtube className="h-4 w-4 fill-red-500 text-red-500" />
                      </a>
                      {socialUrls.website && (
                        <a
                          href={socialUrls.website || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors ${!socialUrls.website ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
                          onClick={(e) => !socialUrls.website && e.preventDefault()}
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
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
                          <p className="text-2xl font-bold text-gray-900">{modelProfile?.rank || "N/A"}</p>
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

                    <div className="p-4 rounded-lg border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{(profileStats?.totalVotesReceived || 0).toLocaleString()}</p>
                          <p className="text-gray-600 text-sm font-medium">Total Votes</p>
                        </div>
                        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                          <Heart className="h-5 w-5 text-rose-600" />
                        </div>
                      </div>
          </div>
        </div>
      )}
              </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Tabs defaultValue="competitions" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="competitions" className="flex items-center space-x-2 text-sm font-medium">
                  <Trophy className="h-4 w-4" />
                  <span>Competitions</span>
                </TabsTrigger>
                <TabsTrigger value="gallery" className="flex items-center space-x-2 text-sm font-medium">
                  <Camera className="h-4 w-4" />
                  <span>Photo Gallery</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="competitions" className="mt-6">
                <ContestsParticipationSection 
                  profile={modelProfile} 
                  participations={activeParticipations || []} 
                  onVoteSuccess={() => {}} 
                />
              </TabsContent>

              <TabsContent value="gallery" className="mt-6">
                {modelProfile?.profilePhotos && modelProfile.profilePhotos.length > 0 ? (
                  <PortfolioGallery photos={modelProfile.profilePhotos} onImageClick={handleImageClick} />
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No photos available yet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {lightboxImage && <Lightbox image={lightboxImage} onClose={closeLightbox} />}

      {/* Buy Votes Modal */}
      <BuyVotesModal
        open={isBuyVotesModalOpen}
        onOpenChange={setIsBuyVotesModalOpen}
        preSelectedContestId={search.contestId}
        participations={activeParticipations || []}
        profile={modelProfile}
      />
    </div>
  );
}

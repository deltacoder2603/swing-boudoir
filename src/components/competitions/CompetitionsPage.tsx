import { ContestJoinButton } from "@/components/global";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useJoinedCompetitions } from "@/contexts/JoinedCompetitionsContext";
import { useContests, useJoinedContests } from "@/hooks/api/useContests";
import { useToast } from "@/hooks/use-toast";
import { formatUsdAbbrev } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Calendar, Clock, Gift, RefreshCw, Search, Share, TrendingUp, Trophy, Users } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { getCompetitionStatus, getStatusBadge } from "./utils";
import { Contest } from "@/types/contest.types";

export function CompetitionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { joinedCompetitions } = useJoinedCompetitions();

  // URL state management with nuqs
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [activeTab, setActiveTab] = useQueryState("tab", { defaultValue: "active" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });

  // Local state for debounced search
  const [searchQuery, setSearchQuery] = useState(search || "");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(search || "");

  // Pagination settings
  const ITEMS_PER_PAGE = 6;
  const currentPage = parseInt(page || "1", 10);

  // Use separate hooks for different contest statuses
  const { data: activeContestsData, isLoading: isLoadingActive } = useContests(1, 100, "active");
  const { data: upcomingContestsData, isLoading: isLoadingUpcoming } = useContests(1, 100, "upcoming");
  const { data: endedContestsData, isLoading: isLoadingEnded } = useContests(1, 100, "ended");
  const { data: joinedContestsData, isLoading: isLoadingJoined } = useJoinedContests(user?.profileId || "", 1, 100);

  // Debounce search query and update URL
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      if (searchQuery !== search) {
        setSearch(searchQuery || null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, search, setSearch]);

  // Sync local search state with URL state
  useEffect(() => {
    setSearchQuery(search || "");
  }, [search]);

  // Extract contests from the response
  const apiActiveContests = activeContestsData?.data || [];
  const apiUpcomingContests = upcomingContestsData?.data || [];
  const apiEndedContests = endedContestsData?.data || [];
  
  // Combine all contests from API
  const allContests = [
    ...apiActiveContests,
    ...apiUpcomingContests,
    ...apiEndedContests
  ];
  
  const apiJoinedContests = joinedContestsData?.data || [];
  
  // Combine API joined contests with local dummy joined contests
  const joinedContests = [
    ...apiJoinedContests,
    ...joinedCompetitions.map(comp => ({
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
    }))
  ];

  // Filter contests by status and search
  const filterContestsBySearch = (contests: Contest[]) => {
    if (!debouncedSearchQuery) return contests;

    return contests.filter(
      (contest) => contest.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || contest.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  };

  // Get competitions by status from API data only
  const activeCompetitions = filterContestsBySearch(
    allContests.filter((contest) => getCompetitionStatus(contest) === "active")
  );
  const comingSoonCompetitions = filterContestsBySearch(
    allContests.filter((contest) => getCompetitionStatus(contest) === "coming-soon")
  );
  const endedCompetitions = filterContestsBySearch(
    allContests.filter((contest) => getCompetitionStatus(contest) === "ended")
  );

  const joinedActiveCompetitions = joinedContests.filter((contest) => getCompetitionStatus(contest) === "active");
  const joinedIds = new Set(joinedContests.map((c) => c.id));

  // Pagination calculations
  const getCurrentTabCompetitions = () => {
    switch (activeTab) {
      case "active":
        return activeCompetitions;
      case "upcoming":
        return comingSoonCompetitions;
      case "completed":
        return endedCompetitions;
      default:
        return activeCompetitions;
    }
  };

  const currentTabCompetitions = getCurrentTabCompetitions();
  const totalPages = Math.max(1, Math.ceil(currentTabCompetitions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCompetitions = currentTabCompetitions.slice(startIndex, endIndex);

  // Reset page when tab changes or search changes
  useEffect(() => {
    setPage("1");
  }, [activeTab, debouncedSearchQuery, setPage]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatPrize = (prizePool: number): string => formatUsdAbbrev(prizePool);

  const shareCompetition = async (competitionName: string) => {
    const url = `${window.location.origin}/profile/${user?.username}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied!",
        description: `Your profile link for ${competitionName} has been copied.`,
      });
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const renderCoverImage = (contest: Contest) => {
    const coverUrl = contest.images?.[0]?.url || "/placeholder.svg";
    return <img src={coverUrl} alt={contest.name} className="w-full aspect-video object-cover rounded-md" loading="lazy" />;
  };

  const isLoading = isLoadingActive || isLoadingUpcoming || isLoadingEnded;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Competitions</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading competitions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:p-4 ">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Discover Competitions</h1>
        <p className="text-lg text-gray-600">Join exciting contests and showcase your talent to the world</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search competitions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        {debouncedSearchQuery && <div className="text-center mt-2 text-sm text-gray-600">Searching for "{debouncedSearchQuery}"...</div>}
      </div>

      {/* Stats Overview Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg sm:text-xl text-gray-800">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            Competition Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{activeCompetitions.length}</p>
                  <p className="text-gray-600 text-sm font-medium">Active Now</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{comingSoonCompetitions.length}</p>
                  <p className="text-gray-600 text-sm font-medium">Upcoming</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Gift className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{endedCompetitions.length}</p>
                  <p className="text-gray-600 text-sm font-medium">Completed</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{joinedActiveCompetitions.length}</p>
                  <p className="text-gray-600 text-sm font-medium">Joined</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="active" className="flex items-center space-x-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            <span>Active</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center space-x-2 text-sm font-medium">
            <Gift className="h-4 w-4" />
            <span>Upcoming</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center space-x-2 text-sm font-medium">
            <Trophy className="h-4 w-4" />
            <span>Completed</span>
          </TabsTrigger>
        </TabsList>

        {/* Active Competitions Tab */}
        <TabsContent value="active" className="space-y-6">
          {activeCompetitions.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6">
                {paginatedCompetitions.map((contest) => (
                  <Card key={contest.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                              <Trophy className="mr-2 h-5 w-5 text-gray-600" />
                              {contest.name}
                            </h3>
                            {getStatusBadge(contest)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <p className="text-gray-900 font-semibold">{formatPrize(contest.prizePool)} Prize Pool</p>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="mr-1 h-4 w-4" />
                                <span>Ends {formatDistanceToNow(new Date(contest.endDate), { addSuffix: true })}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="font-medium text-gray-700">Awards Available:</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {contest.awards &&
                                    contest.awards.slice(0, 2).map((award) => (
                                      <Badge key={award.id} variant="outline" className="text-xs">
                                        {award.icon} {award.name}
                                      </Badge>
                                    ))}
                                  {contest.awards && contest.awards.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{contest.awards.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {joinedIds.has(contest.id) ? (
                              <Button variant="outline" onClick={() => shareCompetition(contest.name)}>
                                <Share className="mr-2 h-4 w-4" />
                                Share Profile
                              </Button>
                            ) : (
                              <ContestJoinButton contest={contest} />
                            )}
                            <Button variant="outline" asChild>
                              <Link to="/competitions/$slug" params={{ slug: contest.slug }}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </div>

                        <div className="w-full lg:w-80">{renderCoverImage(contest)}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNum)} className="w-10 h-10">
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center p-8">
                <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Competitions</h3>
                <p className="text-muted-foreground mb-4">There are no active competitions at the moment. Check back soon for new opportunities!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Upcoming Competitions Tab */}
        <TabsContent value="upcoming" className="space-y-6">
          {comingSoonCompetitions.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6">
                {paginatedCompetitions.map((contest) => (
                  <Card key={contest.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                              <Gift className="mr-2 h-5 w-5 text-gray-600" />
                              {contest.name}
                            </h3>
                            {getStatusBadge(contest)}
                          </div>

                          <p className="text-gray-900 font-semibold">{formatPrize(contest.prizePool)} Prize Pool</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="mr-1 h-4 w-4" />
                              <span>Starts {formatDistanceToNow(new Date(contest.startDate), { addSuffix: true })}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="mr-1 h-4 w-4" />
                              <span>Ends {formatDistanceToNow(new Date(contest.endDate), { addSuffix: true })}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Awards:</span>
                              <ul className="mt-1 space-y-1">
                                {contest.awards?.slice(0, 3).map((award) => (
                                  <li key={award.id} className="text-gray-600">
                                    {award.icon} {award.name}
                                  </li>
                                )) || <li className="text-gray-600">No awards specified</li>}
                                {contest.awards && contest.awards.length > 3 && <li className="text-gray-600">+{contest.awards.length - 3} more</li>}
                              </ul>
                            </div>
                          </div>

                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="mr-1 h-4 w-4" />
                            {contest.awards?.length || 0} award{(contest.awards?.length || 0) !== 1 ? "s" : ""} available
                          </div>
                        </div>

                        <div className="w-full lg:w-80 relative">
                          {/* Badge on top right of image */}
                          <div className="absolute top-2 right-2 z-10">
                            <Badge className="bg-blue-500 text-white text-xs px-2 py-1">Upcoming</Badge>
                          </div>
                          {renderCoverImage(contest)}

                          {/* Prebook button on right side */}
                          <div className="mt-4">
                            {joinedIds.has(contest.id) ? (
                              <div className="w-full p-3 bg-green-50 border border-green-200 rounded-md text-center">
                                <div className="flex items-center justify-center space-x-2 text-green-700">
                                  <Trophy className="h-4 w-4" />
                                  <span className="font-medium">Your Slot is Booked!</span>
                                </div>
                                <p className="text-sm text-green-600 mt-1">You're all set for this competition</p>

                                {/* Remove Slot Button */}
                              </div>
                            ) : (
                              <ContestJoinButton contest={contest} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" customButtonText="Prebook Your Slot" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNum)} className="w-10 h-10">
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center p-8">
                <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Competitions</h3>
                <p className="text-muted-foreground">Check back soon for exciting new competitions!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Completed Competitions Tab */}
        <TabsContent value="completed" className="space-y-6">
          {endedCompetitions.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6">
                {paginatedCompetitions.map((contest) => (
                  <Card key={contest.id} className="border relative border-gray-200 hover:shadow-md transition-shadow">
                    <div className="absolute top-1/2 w-full  -translate-y-1/2 right-0 h-4 bg-white/70 backdrop-blur-sm min-h-10 flex items-center justify-center text-xl font-medium text-gray-600" >
                    Completed</div>
                    <CardContent className="p-6 ">

                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                              <Trophy className="mr-2 h-5 w-5 text-gray-600" />
                              {contest.name}
                            </h3>
                            {getStatusBadge(contest)}
                          </div>

                          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-900 font-semibold">{formatPrize(contest.prizePool)} Prize Pool</p>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="mr-1 h-4 w-4" />
                                <span>Ended {formatDistanceToNow(new Date(contest.endDate), { addSuffix: true })}</span>
                              </div>
                              {contest.winnerProfileId && (
                                <div className="flex items-center text-sm text-gray-600 mt-1">
                                  <Trophy className="mr-1 h-4 w-4" />
                                  Winner announced
                                </div>
                              )}
                            </div>
                            {/* <div className="text-center p-4 bg-primary/10 rounded-lg">
                              <Trophy className="mx-auto h-8 w-8 text-primary mb-2" />
                              <p className="font-semibold">Competition Completed</p>
                              <p className="text-sm text-muted-foreground">Final results available</p>
                            </div> */}
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" asChild>
                              <Link to="/competitions/$slug" params={{ slug: contest.slug }}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </div>

                        <div className="w-full lg:w-80">{renderCoverImage(contest)}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNum)} className="w-10 h-10">
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center p-8">
                <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Completed Competitions</h3>
                <p className="text-muted-foreground">No competitions have been completed yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

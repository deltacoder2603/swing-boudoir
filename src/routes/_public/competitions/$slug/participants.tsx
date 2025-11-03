import { useContestBySlug } from "@/hooks/api/useContests";
import { useContestParticipants } from "@/hooks/api/useContestParticipation";
import { ContestParticipant } from "@/types/contest.types";
import { createFileRoute } from "@tanstack/react-router";
import { parseAsInteger, useQueryState } from "nuqs";

export const Route = createFileRoute("/_public/competitions/$slug/participants")({
  component: ContestParticipants,
});

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageHelper } from "@/lib/image-helper";
import { Link, useParams } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Eye, Loader2, Search, Trophy, User, Users, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import VoteButton from "@/components/competitions/VoteButton";

const limit = 50;

export default function ContestParticipants() {
  const { slug } = Route.useParams();

  // URL state management with nuqs
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const currentPage = page;

  // Local search state for debouncing
  const [searchQuery, setSearchQuery] = useState(search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search || "");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      if (searchQuery !== search) {
        setSearch(searchQuery || null);
        setPage(1); // Reset to first page when searching
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, search, setSearch, setPage]);

  // Sync local search state with URL state
  useEffect(() => {
    setSearchQuery(search || "");
  }, [search]);
  // Fetch contest by slug with SWR
  const { data: contest, isLoading: isLoadingContest, error: contestError} = useContestBySlug(slug);

  // Fetch participants using contest ID with SWR
  const {
    data: participantsData,
    isLoading: isLoadingParticipants,
    error: participantsError,
    isRefetching: isParticipantsFetching,
    refetch: refetchParticipants,
  } = useContestParticipants({ contestId: contest?.id || "", page: currentPage, limit, search: debouncedSearch });

  const allParticipants = React.useMemo(() => participantsData?.data || [], [participantsData?.data]);
  const pagination = participantsData?.pagination;

  // Client-side search fallback if backend doesn't support search
  const participants = React.useMemo(() => {
    if (!debouncedSearch || !debouncedSearch.trim()) {
      return allParticipants;
    }
    
    const searchTerm = debouncedSearch.toLowerCase().trim();
    return allParticipants.filter((participant) => {
      const name = participant.profile?.user?.name?.toLowerCase() || '';
      const username = participant.profile?.user?.username?.toLowerCase() || '';
      const bio = participant.profile?.bio?.toLowerCase() || '';
      
      return name.includes(searchTerm) || 
             username.includes(searchTerm) || 
             bio.includes(searchTerm);
    });
  }, [allParticipants, debouncedSearch]);

  const [selectedParticipant, setSelectedParticipant] = useState<ContestParticipant | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});

  const handlePageChange = async (newPage: number) => {
    if (isNavigating) return;

    setIsNavigating(true);
    try {
      setPage(newPage);
    } finally {
      setIsNavigating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getApprovalStatus = (isApproved: boolean) => {
    return isApproved ? (
      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm font-semibold px-2 py-0.5 text-xs">✓ Approved</Badge>
    ) : (
      <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50/50 font-semibold px-2 py-0.5 text-xs">
        ⏳ Pending
      </Badge>
    );
  };

  // Function to highlight search terms in text
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const openLightbox = (participant: ContestParticipant) => {
    setSelectedParticipant(participant);
    setCurrentImageIndex(0);
    setLightboxOpen(true);
    setImageLoading({});
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedParticipant(null);
    setCurrentImageIndex(0);
  };

  const nextImage = useCallback(() => {
    if (!selectedParticipant) return;
    const allImages = getAllImages(selectedParticipant);
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [selectedParticipant]);

  const prevImage = useCallback(() => {
    if (!selectedParticipant) return;
    const allImages = getAllImages(selectedParticipant);
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [selectedParticipant]);

  const getAllImages = (participant: ContestParticipant) => {
    const images: Array<{ id: string; key: string; caption?: string; url: string }> = [];

    // Add cover image if exists
    if (participant.coverImage) {
      images.push({
        id: participant.coverImage.id,
        key: participant.coverImage.key,
        url: participant.coverImage.url,
        caption: participant.coverImage.caption || undefined,
      });
    }

    return images;
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!lightboxOpen) return;

      switch (event.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          prevImage();
          break;
        case "ArrowRight":
          nextImage();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, prevImage, nextImage]);

  // Loading states
  const isLoading = isLoadingContest || isLoadingParticipants;
  const error = contestError || participantsError;

  // Show loading state only for initial load (not during search)
  if (isLoading && !searchQuery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex pt-16 min-h-screen">
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-4 p-4">
              {/* Back Navigation Skeleton */}
              <div className="flex items-center justify-between mb-1">
                <Skeleton className="h-9 w-40" />
                <div className="text-center">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              </div>

              {/* Contest Info Header Skeleton */}
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="space-y-1">
                        <Skeleton className="h-8 w-80" />
                        <Skeleton className="h-4 w-96" />
                      </div>
                      <Skeleton className="h-4 w-96" />
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-2">
                      <Skeleton className="w-8 h-8 rounded" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participants Table Skeleton */}
              <Card className="!mt-8">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center text-lg font-bold">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      Contest Participants
                    </CardTitle>
                    <Skeleton className="w-full sm:w-80 h-10" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 p-0">
                  <div className="space-y-4">
                    {/* Desktop Table Skeleton */}
                    <div className="hidden md:block overflow-x-auto rounded-lg border border-border/50">
                      <table className="w-full">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Participant</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Cover Image</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Joined</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <tr key={index} className="border-b border-border">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <Skeleton className="w-8 h-8 rounded-full" />
                                  <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <Skeleton className="size-16 rounded-lg" />
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Skeleton className="h-6 w-16 rounded-full" />
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Skeleton className="h-8 w-24" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards Skeleton */}
                    <div className="md:hidden space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex flex-col items-start gap-3">
                            <div className="flex items-start space-x-3 w-full">
                              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                  </div>
                                  <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                              </div>
                            </div>
                            <Skeleton className="w-full aspect-square rounded-lg" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Pagination Skeleton */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <Skeleton className="h-4 w-32" />
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex pt-16 min-h-screen">
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8 p-6">
              {/* Back Navigation */}
              <div className="flex items-center justify-between">
                <Link to="/competitions">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Competitions
                  </Button>
                </Link>
              </div>

              {/* Error Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Users className="w-5 h-5 mr-3 text-primary" />
                    Contest Participants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="text-red-500 mb-4">
                      <X className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Participants</h3>
                    <p className="text-muted-foreground mb-6">{error instanceof Error ? error.message : "An unexpected error occurred"}</p>
                    <div className="flex justify-center space-x-4">
                      <Button onClick={() => window.location.reload()} variant="outline">
                        Try Again
                      </Button>
                      <Link to="/competitions">
                        <Button>Back to Competitions</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show main content
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex pt-16 min-h-screen">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-4 p-4">
            {/* Back Navigation */}
            <div className="flex items-center justify-between mb-1">
              <Link to="/competitions/$slug" params={{ slug: contest?.slug || slug }}>
                <Button variant="outline" size="sm" className="flex items-center hover:bg-primary/5 transition-all duration-200 group text-xs">
                  <ArrowLeft className="w-3 h-3 mr-1 group-hover:-translate-x-1 transition-transform duration-200" />
                  Back to Competition
                </Button>
              </Link>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => refetchParticipants()} disabled={isLoadingParticipants} className="text-xs px-3 py-1">
                    {isLoadingParticipants ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Users className="w-3 h-3 mr-1" />}
                    Refresh Participants
                  </Button>
                </div>

                <div className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg px-4 py-2 border border-primary/20">
                  <div className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">{pagination?.total || 0}</div>
                  <div className="text-xs text-muted-foreground font-medium">Total Participants</div>
                </div>

              </div>
            </div>

            {/* Contest Info Header */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/8 to-primary/10 shadow-lg shadow-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{contest?.name || "Loading..."}</h1>
                       
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-muted-foreground">Participants</span>
                        {isParticipantsFetching && !searchQuery && (
                          <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span>Refreshing...</span>
                          </div>
                        )}
                        {isLoadingParticipants && searchQuery && (
                          <div className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Searching...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{contest?.description || ""}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 px-3 py-1 rounded-full border border-yellow-500/20">
                        <Trophy className="w-3 h-3 text-yellow-600" />
                        <span className="font-semibold text-yellow-700">Prize: ${contest?.prizePool?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-500/10 to-blue-600/10 px-3 py-1 rounded-full border border-blue-500/20">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span className="font-semibold text-blue-700">
                          {contest?.startDate && formatDate(contest.startDate)} - {contest?.endDate && formatDate(contest.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center space-x-3 ml-6">
                    <div className="text-center">
                      <Users className="w-8 h-8 text-primary/60 mx-auto mb-1" />
                      <Badge variant="outline" className="text-sm px-4 py-1 bg-primary/5 border-primary/30 font-semibold">
                        {contest?.status || "Loading"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants Table */}
            <Card className="shadow-lg border bg-card/50 backdrop-blur-sm !mt-8">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center text-lg font-bold">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    Contest Participants
                  </CardTitle>
                  
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search participants..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 text-sm border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setSearch(null);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/50"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-0">
                {/* Show loading skeleton only in table area when searching */}
                {isLoadingParticipants && searchQuery ? (
                  <div className="space-y-4">
                    {/* Search Results Info */}
                    <div className="px-4 py-2 bg-muted/30 border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Searching for "{searchQuery}"...</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("");
                            setSearch(null);
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    
                    {/* Desktop Table Skeleton */}
                    <div className="hidden md:block overflow-x-auto rounded-lg border border-border/50">
                      <table className="w-full">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Participant</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Cover Image</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Joined</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {Array.from({ length: 3 }).map((_, index) => (
                            <tr key={index} className="border-b border-border">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <Skeleton className="w-8 h-8 rounded-full" />
                                  <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <Skeleton className="size-16 rounded-lg" />
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Skeleton className="h-6 w-16 rounded-full" />
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Skeleton className="h-8 w-24" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards Skeleton */}
                    <div className="md:hidden space-y-3">
                      {Array.from({ length: 2 }).map((_, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex flex-col items-start gap-3">
                            <div className="flex items-start space-x-3 w-full">
                              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                  </div>
                                  <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                              </div>
                            </div>
                            <Skeleton className="w-full aspect-square rounded-lg" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                      {debouncedSearch ? (
                        <Search className="w-8 h-8 text-muted-foreground/60" />
                      ) : (
                        <Users className="w-8 h-8 text-muted-foreground/60" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {debouncedSearch ? "No Participants Found" : "No Participants Yet"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {debouncedSearch 
                        ? `No participants match "${debouncedSearch}". Try a different search term.`
                        : "Be the first to join this competition!"
                      }
                    </p>
                    {debouncedSearch && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setSearch(null);
                        }}
                        className="mt-4"
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search Results Info */}
                    {debouncedSearch && (
                      <div className="px-4 py-2 bg-muted/30 border-b border-border/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Search className="w-4 h-4" />
                            <span>
                              {participants.length} participant{participants.length !== 1 ? 's' : ''} found for "{debouncedSearch}"
                              {participants.length !== allParticipants.length && (
                                <span className="text-xs text-muted-foreground/70 ml-1">
                                  (filtered from {allParticipants.length})
                                </span>
                              )}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setSearch(null);
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto rounded-lg border border-border/50">
                      <table className="w-full">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Participant</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Cover Image</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Joined</th>
                            <th className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {participants.map((participant, index) => (
                            <tr
                              key={participant.id}
                              className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-300 group"
                              onMouseEnter={() => setHoveredParticipant(participant.id)}
                              onMouseLeave={() => setHoveredParticipant(null)}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                                      {participant.profile?.user?.image ? (
                                        (() => {
                                          const optimizedAvatarImage = ImageHelper.avatar(participant.profile.user.image, "thumbnail");
                                          return <img src={optimizedAvatarImage} alt={participant.profile.user.name} className="w-8 h-8 rounded-full object-cover" />;
                                        })()
                                      ) : (
                                        <User className="w-4 h-4 text-primary" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors duration-200">
                                      {highlightSearchTerm(participant.profile?.user?.name || "Unknown User", debouncedSearch)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      @{highlightSearchTerm(participant.profile?.user?.username || "", debouncedSearch)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  {/* Show cover image */}
                                  {participant.coverImage ? (
                                    (() => {
                                      const optimizedCoverImage = ImageHelper.cover(participant.coverImage.url, "small");
                                      return (
                                        <div className="relative group/image">
                                          <div className="size-16 rounded-lg overflow-hidden border border-border/50 group-hover:border-primary/50 transition-all duration-300 shadow-sm">
                                            <img
                                              src={optimizedCoverImage}
                                              alt="Cover"
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                          </div>
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-lg flex items-center justify-center">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => openLightbox(participant)}
                                              className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 hover:bg-white text-black border-white/50 text-xs px-2 py-1"
                                            >
                                              <Eye className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <div className="size-16 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
                                      <span className="text-xs text-muted-foreground font-medium">No Image</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex justify-start">{getApprovalStatus(participant.isApproved)}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-0.5">
                                  <p className="text-xs font-medium text-foreground">{formatDate(participant.createdAt)}</p>
                                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(participant.createdAt), { addSuffix: true })}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <VoteButton 
                                    participant={{
                                      profileId: participant.profileId,
                                      username: participant.profile?.user?.username || "",
                                      displayUsername: participant.profile?.user?.name || "",
                                      avatarUrl: participant.profile?.user?.image || null,
                                      bio: participant.profile?.bio || null,
                                      totalVotes: 0,
                                      freeVotes: 0,
                                      paidVotes: 0,
                                      isParticipating: participant.isParticipating || false,
                                      coverImage: participant.coverImage?.url || null,
                                      isApproved: participant.isApproved || false,
                                      rank: 0
                                    }}
                                    contestId={contest?.id || ""}
                                    compact={true}
                                  />
                                  <Link to="/profile/$username" params={{ username: participant.profile?.user?.username || "" }}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="group/btn hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-primary/20 hover:border-primary text-xs px-3 py-1"
                                    >
                                      <Eye className="w-3 h-3 mr-1 group-hover/btn:scale-110 transition-transform duration-200" />
                                      View Profile
                                    </Button>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                      {participants.map((participant) => (
                        <Card
                          key={participant.id}
                          className="p-4 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group"
                        >
                          <div className="flex flex-col items-start gap-3">
                            <div className="flex items-start space-x-3 w-full">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                                  {participant.profile?.user?.image ? (
                                    <img src={participant.profile.user.image} alt={participant.profile.user.name} className="w-10 h-10 rounded-full object-cover" />
                                  ) : (
                                    <User className="w-5 h-5 text-primary" />
                                  )}
                                </div>
                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-background"></div>
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors duration-200">
                                      {highlightSearchTerm(participant.profile?.user?.name || "Unknown User", debouncedSearch)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      @{highlightSearchTerm(participant.profile?.user?.username || "", debouncedSearch)}
                                    </p>
                                  </div>
                                  {getApprovalStatus(participant.isApproved)}
                                </div>
                              </div>
                            </div>

                            {/* Show cover image */}
                            {participant.coverImage && (
                              <div
                                className="w-full aspect-square rounded-lg overflow-hidden border border-border/50 group-hover:border-primary/50 transition-all duration-300 shadow-sm group-hover:shadow-md cursor-pointer relative"
                                onClick={() => openLightbox(participant)}
                              >
                                <img src={participant.coverImage.url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-lg flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 rounded-full p-1.5">
                                    <Eye className="w-4 h-4 text-black" />
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between w-full pt-1 border-t border-border/30">
                              <div className="text-xs text-muted-foreground">Joined {formatDistanceToNow(new Date(participant.createdAt), { addSuffix: true })}</div>
                              <div className="flex items-center space-x-2">
                                <VoteButton 
                                  participant={{
                                    profileId: participant.profileId,
                                    username: participant.profile?.user?.username || "",
                                    displayUsername: participant.profile?.user?.name || "",
                                    avatarUrl: participant.profile?.user?.image || null,
                                    bio: participant.profile?.bio || null,
                                    totalVotes: 0,
                                    freeVotes: 0,
                                    paidVotes: 0,
                                    isParticipating: participant.isParticipating || false,
                                    coverImage: participant.coverImage?.url || null,
                                    isApproved: participant.isApproved || false,
                                    rank: 0
                                  }}
                                  contestId={contest?.id || ""}
                                  compact={true}
                                />
                                <Link to="/profile/$username" params={{ username: participant.profile?.user?.username || "" }}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="group/btn hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-primary/20 hover:border-primary text-xs px-3 py-1"
                                  >
                                    <Eye className="w-3 h-3 mr-1 group-hover/btn:scale-110 transition-transform duration-200" />
                                    View Profile
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="text-xs text-muted-foreground font-medium">
                          Showing page <span className="font-bold text-foreground">{currentPage}</span> of{" "}
                          <span className="font-bold text-foreground">{pagination.totalPages}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!pagination?.hasPreviousPage || isNavigating}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="flex items-center hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-primary/20 hover:border-primary disabled:opacity-50 text-xs px-3 py-1"
                          >
                            {isNavigating && currentPage > 1 ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ChevronLeft className="w-3 h-3 mr-1" />}
                            Previous
                          </Button>
                          <div className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-md border border-primary/20">{currentPage}</div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!pagination?.hasNextPage || isNavigating}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="flex items-center hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-primary/20 hover:border-primary disabled:opacity-50 text-xs px-3 py-1"
                          >
                            Next
                            {isNavigating && currentPage < (pagination?.totalPages || 1) ? (
                              <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                            ) : (
                              <ChevronRight className="w-3 h-3 ml-1" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && selectedParticipant && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-20 p-3 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all duration-200 hover:scale-110 backdrop-blur-sm"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation buttons */}
            {getAllImages(selectedParticipant).length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-6 z-20 p-3 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-6 z-20 p-3 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image display */}
            <div className="max-w-6xl max-h-full w-full">
              {(() => {
                const allImages = getAllImages(selectedParticipant);
                const currentImage = allImages[currentImageIndex];

                if (!currentImage) {
                  return (
                    <div className="text-center text-white py-20">
                      <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                        <X className="w-12 h-12 text-white/60" />
                      </div>
                      <p className="text-xl font-medium">No images available</p>
                    </div>
                  );
                }

                // Initialize loading state for current image
                if (imageLoading[currentImage.id] === undefined) {
                  setImageLoading((prev) => ({ ...prev, [currentImage.id]: true }));
                }

                return (
                  <div className="space-y-6">
                    {/* Main image container */}
                    <div className="relative bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                      {imageLoading[currentImage.id] && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                      )}
                      <img
                        src={currentImage.url}
                        alt={currentImage.caption || `Image ${currentImageIndex + 1}`}
                        className="max-w-full max-h-[60vh] object-contain mx-auto rounded-xl shadow-2xl transition-opacity duration-300"
                        onLoad={() => setImageLoading((prev) => ({ ...prev, [currentImage.id]: false }))}
                        onLoadStart={() => setImageLoading((prev) => ({ ...prev, [currentImage.id]: true }))}
                        style={{ opacity: imageLoading[currentImage.id] ? 0.5 : 1 }}
                      />
                    </div>

                    {/* Image info */}
                    <div className="text-center text-white space-y-3">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xl font-semibold">{selectedParticipant.profile?.user?.name || "Unknown User"}</p>
                      </div>
                      <p className="text-sm text-gray-300 bg-black/30 px-4 py-2 rounded-full inline-block">
                        Image {currentImageIndex + 1} of {allImages.length}
                      </p>
                      {currentImage.caption && <p className="text-sm text-gray-300 max-w-md mx-auto bg-black/20 px-4 py-2 rounded-lg">{currentImage.caption}</p>}
                    </div>

                    {/* Thumbnail navigation */}
                    {allImages.length > 1 && (
                      <div className="flex justify-center space-x-3 mt-6">
                        {allImages.map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                              index === currentImageIndex ? "border-primary ring-2 ring-primary/50 shadow-lg shadow-primary/25" : "border-white/30 hover:border-white/60"
                            }`}
                          >
                            <img src={image.url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

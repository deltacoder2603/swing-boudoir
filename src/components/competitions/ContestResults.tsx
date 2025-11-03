import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageHelper } from "@/lib/image-helper";
import { Link, useParams } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Calendar, Crown, Trophy, User, Users, Award, Star } from "lucide-react";
import React from "react";
import { useContestBySlug, useContestLeaderboard } from "@/hooks/api/useContests";

export default function ContestResults() {
  const { slug } = useParams({ from: "/_public/competitions/$slug/results" });

  // Fetch contest by slug
  const { data: contest, isLoading: isLoadingContest, error: contestError } = useContestBySlug(slug);

  // Fetch leaderboard using contest ID
  const {
    data: leaderboardData,
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
  } = useContestLeaderboard(contest?.id || "", 1, 10); // Get top 10

  const winners = React.useMemo(() => leaderboardData?.data || [], [leaderboardData?.data]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Trophy className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Trophy className="w-8 h-8 text-orange-500" />;
      default:
        return <span className="font-bold text-2xl w-8 text-center">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-sm font-bold px-4 py-2 text-lg">🥇 1st Place</Badge>;
      case 2:
        return <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 shadow-sm font-bold px-4 py-2 text-lg">🥈 2nd Place</Badge>;
      case 3:
        return <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-sm font-bold px-4 py-2 text-lg">🥉 3rd Place</Badge>;
      default:
        return <Badge variant="outline" className="font-bold px-4 py-2 text-lg">#{rank}</Badge>;
    }
  };

  const getPrizeAmount = (rank: number) => {
    if (!contest?.prizePool) return 0;
    
    // Simple prize distribution - can be made more sophisticated
    switch (rank) {
      case 1:
        return Math.floor(contest.prizePool * 0.5); // 50% for 1st place
      case 2:
        return Math.floor(contest.prizePool * 0.3); // 30% for 2nd place
      case 3:
        return Math.floor(contest.prizePool * 0.2); // 20% for 3rd place
      default:
        return 0;
    }
  };

  // Loading states
  const isLoading = isLoadingContest || isLoadingLeaderboard;
  const error = contestError || leaderboardError;

  // Show loading state
  if (isLoading) {
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

              {/* Winners Skeleton */}
              <Card className="!mt-8">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg font-bold">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <Trophy className="w-4 h-4 text-primary" />
                    </div>
                    Competition Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 p-0">
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Card key={index} className="p-6">
                        <div className="flex flex-col items-center gap-4">
                          <Skeleton className="w-16 h-16 rounded-full" />
                          <div className="text-center space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-8 w-24" />
                          </div>
                          <Skeleton className="h-12 w-32" />
                        </div>
                      </Card>
                    ))}
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
                    <Trophy className="w-5 h-5 mr-3 text-primary" />
                    Competition Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="text-red-500 mb-4">
                      <Trophy className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Results</h3>
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

              <div className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg px-4 py-2 border border-primary/20">
                <div className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">{winners.length}</div>
                <div className="text-xs text-muted-foreground font-medium">Total Winners</div>
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
                        <Badge className="bg-green-600 text-white">Completed</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-muted-foreground">Final Results</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{contest?.description || ""}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 px-3 py-1 rounded-full border border-yellow-500/20">
                        <Trophy className="w-3 h-3 text-yellow-600" />
                        <span className="font-semibold text-yellow-700">Total Prize: ${contest?.prizePool?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-500/10 to-blue-600/10 px-3 py-1 rounded-full border border-blue-500/20">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span className="font-semibold text-blue-700">
                          Ended: {contest?.endDate && formatDate(contest.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center space-x-3 ml-6">
                    <div className="text-center">
                      <Trophy className="w-8 h-8 text-primary/60 mx-auto mb-1" />
                      <Badge variant="outline" className="text-sm px-4 py-1 bg-primary/5 border-primary/30 font-semibold">
                        Results Final
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Winners Podium */}
            <Card className="shadow-lg border bg-card/50 backdrop-blur-sm !mt-8">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-bold">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <Trophy className="w-4 h-4 text-primary" />
                  </div>
                  Competition Winners
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 p-0">
                {winners.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Winners Yet</h3>
                    <p className="text-muted-foreground text-sm">
                      This competition hasn't been completed yet or no participants were found.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 p-6">
                    {/* Top 3 Winners */}
                    {winners.slice(0, 3).map((winner, index) => (
                      <Card key={winner.profileId} className={`p-6 ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200' : index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200' : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                              {getRankIcon(winner.rank)}
                              <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                                  {winner.avatarUrl ? (
                                    <img src={ImageHelper.avatar(winner.avatarUrl, "medium")} alt={winner.username} className="w-16 h-16 rounded-full object-cover" />
                                  ) : (
                                    <User className="w-8 h-8 text-primary" />
                                  )}
                                </div>
                                {index < 3 && (
                                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <Star className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-xl font-bold text-foreground">
                                {winner.displayUsername || winner.username || "Unknown User"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                @{winner.username}
                              </p>
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="text-primary font-semibold">{winner.totalVotes} total votes</span>
                                <span className="text-green-600">{winner.freeVotes} free</span>
                                <span className="text-blue-600">{winner.paidVotes} paid</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            {getRankBadge(winner.rank)}
                            {getPrizeAmount(winner.rank) > 0 && (
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Prize</p>
                                <p className="text-2xl font-bold text-green-600">${getPrizeAmount(winner.rank).toLocaleString()}</p>
                              </div>
                            )}
                            <Link to="/profile/$username" params={{ username: winner.username || "" }}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="group/btn hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-primary/20 hover:border-primary"
                              >
                                <User className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-200" />
                                View Profile
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {/* Other Winners */}
                    {winners.length > 3 && (
                      <div className="space-y-3">
                        <h4 className="text-lg font-semibold text-center text-muted-foreground">Other Participants</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {winners.slice(3).map((winner) => (
                            <Card key={winner.profileId} className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                                    {winner.avatarUrl ? (
                                      <img src={ImageHelper.avatar(winner.avatarUrl, "small")} alt={winner.username} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                      <User className="w-5 h-5 text-primary" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm">{winner.displayUsername || winner.username}</p>
                                    <p className="text-xs text-muted-foreground">@{winner.username}</p>
                                    <p className="text-xs text-primary font-semibold">{winner.totalVotes} votes</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="font-semibold">#{winner.rank}</Badge>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Competition Awards */}
            {contest?.awards && contest.awards.length > 0 && (
              <Card className="shadow-lg border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-bold">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <Award className="w-4 h-4 text-primary" />
                    </div>
                    Competition Awards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contest.awards.map((award, index) => (
                      <div key={award.id} className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                        <span className="text-3xl">{award.icon}</span>
                        <div>
                          <span className="font-semibold text-lg">{award.name}</span>
                          <p className="text-sm text-muted-foreground">
                            {index < 3 ? `$${getPrizeAmount(index + 1).toLocaleString()}` : "Recognition Award"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

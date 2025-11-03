import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useVoterLeaderboard } from "@/hooks/api/useGamification";
import { Users, Trophy, Medal, Award, Heart, TrendingUp, Crown } from "lucide-react";
import { ImageHelper } from "@/lib/image-helper";
import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const VotersLeaderboardTab = () => {
  const { user } = useAuth();
  const { data: voterLeaderboard, isLoading, error } = useVoterLeaderboard(user?.profileId);

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                  <Skeleton className="w-8 h-6" />
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error loading voter leaderboard:</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Profile ID: {user?.profileId || "Not found"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get rank badge/icon
  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: "from-yellow-400 to-amber-500", text: "text-yellow-900", bg: "bg-gradient-to-br from-yellow-50 to-amber-50" };
    if (rank === 2) return { icon: Trophy, color: "from-gray-300 to-gray-400", text: "text-gray-700", bg: "bg-gradient-to-br from-gray-50 to-slate-50" };
    if (rank === 3) return { icon: Medal, color: "from-orange-400 to-amber-600", text: "text-orange-900", bg: "bg-gradient-to-br from-orange-50 to-amber-50" };
    return { icon: Award, color: "from-blue-400 to-indigo-500", text: "text-blue-900", bg: "bg-white" };
  };

  const totalVotes = voterLeaderboard?.data.reduce((sum, voter) => sum + voter.totalVotesGiven, 0) || 0;
  const totalPaidVotes = voterLeaderboard?.data.reduce((sum, voter) => sum + voter.paidVotesGiven, 0) || 0;
  const totalFreeVotes = voterLeaderboard?.data.reduce((sum, voter) => sum + voter.freeVotesGiven, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {voterLeaderboard?.data && voterLeaderboard.data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Supporters</p>
                  <p className="text-3xl font-bold text-purple-900">{voterLeaderboard.data.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Votes Received</p>
                  <p className="text-3xl font-bold text-blue-900">{formatNumber(totalVotes)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Paid Votes</p>
                  <p className="text-3xl font-bold text-green-900">{formatNumber(totalPaidVotes)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Free Votes</p>
                  <p className="text-3xl font-bold text-orange-900">{formatNumber(totalFreeVotes)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> 
            Top Supporters
          </CardTitle>
          <CardDescription>Your most dedicated voters ranked by total support</CardDescription>
        </CardHeader>
        <CardContent>
          {voterLeaderboard?.data && voterLeaderboard.data.length > 0 ? (
            <div className="space-y-3">
              {voterLeaderboard.data.map((voter) => {
                const rankInfo = getRankBadge(voter.rank);
                const RankIcon = rankInfo.icon;
                
                return (
                  <Card 
                    key={voter.profileId} 
                    className={cn(
                      "transition-all duration-300 hover:shadow-md border",
                      voter.rank <= 3 ? rankInfo.bg : "bg-white hover:bg-gray-50"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div className="flex flex-col items-center min-w-[60px]">
                          <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center mb-1",
                            voter.rank <= 3 ? `bg-gradient-to-br ${rankInfo.color}` : "bg-gray-100"
                          )}>
                            {voter.rank <= 3 ? (
                              <RankIcon className="h-6 w-6 text-white" />
                            ) : (
                              <span className="font-bold text-gray-600">#{voter.rank}</span>
                            )}
                          </div>
                          {voter.rank <= 3 && (
                            <Badge variant="secondary" className="text-xs px-2">
                              Top {voter.rank}
                            </Badge>
                          )}
                        </div>

                        {/* Avatar */}
                        <Link to="/profile/$username" params={{ username: voter.username || "" }}>
                          <div className="relative">
                            <img
                              src={ImageHelper.avatar(voter.profileImage || "", "small")}
                              alt={voter.name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md hover:scale-110 transition-transform duration-200"
                            />
                            {voter.rank === 1 && (
                              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center">
                                <Crown className="h-3 w-3 text-yellow-900" />
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <Link to="/profile/$username" params={{ username: voter.username || "" }}>
                            <p className="font-bold text-lg hover:text-primary transition-colors truncate">
                              {voter.name}
                            </p>
                          </Link>
                          <p className="text-sm text-muted-foreground">@{voter.username}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last voted: {new Date(voter.lastVoteAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Vote Stats */}
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-2 justify-end">
                            <Heart className="h-4 w-4 text-pink-500" />
                            <p className="font-bold text-2xl text-primary">
                              {formatNumber(voter.totalVotesGiven)}
                            </p>
                          </div>
                          <div className="flex gap-2 justify-end">
                            {voter.paidVotesGiven > 0 && (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
                                💎 {formatNumber(voter.paidVotesGiven)} Paid
                              </Badge>
                            )}
                            {voter.freeVotesGiven > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                ⭐ {formatNumber(voter.freeVotesGiven)} Free
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-600 mb-2">No supporters yet</p>
              <p className="text-sm text-muted-foreground">
                Share your profile to start receiving votes from supporters!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VotersLeaderboardTab;

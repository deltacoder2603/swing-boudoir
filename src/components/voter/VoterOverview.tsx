import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Trophy, Star, Gift, TrendingUp } from "lucide-react";
import type { VoterStats } from "@/hooks/api/useVoter";

interface VoterOverviewProps {
  stats: VoterStats | undefined;
  userId: string | undefined;
}

export function VoterOverview({ stats }: VoterOverviewProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your stats...</p>
        </div>
      </div>
    );
  }

  const unlockedAchievements = stats.achievements?.filter((a) => a.isUnlocked).length || 0;
  const totalAchievements = stats.achievements?.length || 0;
  const unlockedRewardsCount = stats.unlockedRewards?.length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Voter Dashboard</h1>
        <p className="text-muted-foreground">
          Track your voting activity, milestones, and exclusive rewards
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Votes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVotes || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.freeVotes || 0} free · {stats.paidVotes || 0} paid
            </p>
          </CardContent>
        </Card>

        {/* Contests Voted In */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contests Voted</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contestsVotedIn || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active competitions
            </p>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Star className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {unlockedAchievements} / {totalAchievements}
            </div>
            <p className="text-xs text-muted-foreground">
              Badges & Achievements
            </p>
          </CardContent>
        </Card>

        {/* Unlocked Rewards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards</CardTitle>
            <Gift className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unlockedRewardsCount}</div>
            <p className="text-xs text-muted-foreground">
              Exclusive content unlocked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Milestone Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Current Progress
          </CardTitle>
          <CardDescription>
            Your journey to the next milestone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.currentMilestone && stats.nextMilestone && (
            <>
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  Current: {stats.currentMilestone.name} ({stats.currentMilestone.votesRequired} votes)
                </span>
                <span className="text-muted-foreground">
                  Next: {stats.nextMilestone.name} ({stats.nextMilestone.votesRequired} votes)
                </span>
              </div>
              <Progress 
                value={stats.nextMilestone.progress || 0} 
                className="h-3" 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stats.totalVotes} votes cast</span>
                <span>{stats.nextMilestone.votesRemaining} votes to go</span>
              </div>
            </>
          )}

          {/* Milestone Info */}
          {stats.currentMilestone && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge 
                variant="default"
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                ✅ {stats.currentMilestone.name}
              </Badge>
              {stats.nextMilestone && (
                <Badge variant="outline">
                  🎯 Next: {stats.nextMilestone.name}
                </Badge>
              )}
            </div>
          )}

          {/* Spin Wheel Badges */}
          {stats.activeBadges && stats.activeBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {stats.activeBadges.map((badge) => (
                <Badge 
                  key={badge.id}
                  variant="default"
                  className="bg-gradient-to-r from-yellow-400 to-orange-500"
                >
                  🪩 Swing VIP Voter
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Favorite Models */}
      {stats.favoriteModels && stats.favoriteModels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Top Models</CardTitle>
            <CardDescription>
              Models you've supported the most
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.favoriteModels.map((model, index) => (
                <div key={model.profileId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{model.modelName}</p>
                      <p className="text-xs text-muted-foreground">{model.voteCount} votes</p>
                    </div>
                  </div>
                  <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle>Ready to Vote?</CardTitle>
          <CardDescription>
            Support your favorite models in active competitions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Navigate to <span className="font-semibold text-purple-600">"Vote in Contests"</span> to start voting and earning milestones!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


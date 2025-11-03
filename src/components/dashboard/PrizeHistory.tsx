import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Gift, Award, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActivePrizes } from "@/hooks/api/useVoter";
import { useProfileAchievements, useProfileUnlocks } from "@/hooks/api/useGamification";
import { formatDistanceToNow } from "date-fns";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "delivered":
    case "CLAIMED":
      return <Badge className="bg-green-500">Claimed</Badge>;
    case "shipped":
      return <Badge className="bg-blue-500">Shipped</Badge>;
    case "pending":
    case "PENDING":
      return <Badge variant="outline">Pending</Badge>;
    case "processing":
      return <Badge className="bg-yellow-500">Processing</Badge>;
    case "ACTIVE":
      return <Badge className="bg-blue-500">Active</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "BONUS_VOTES":
      return <Gift className="h-5 w-5 text-blue-500" />;
    case "VOTE_MULTIPLIER":
      return <Award className="h-5 w-5 text-purple-500" />;
    case "VOTE_MULTIPLIER_TOKEN":
      return <Award className="h-5 w-5 text-purple-500" />;
    case "EXCLUSIVE_BADGE":
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    default:
      return <Trophy className="h-5 w-5 text-primary" />;
  }
};

export function PrizeHistory() {
  const { user } = useAuth();
  const profileId = user?.profileId;

  // Fetch real data from APIs
  const { data: activePrizes, isLoading: isLoadingPrizes } = useActivePrizes(profileId, true); // Include expired for history
  const { data: achievementsData, isLoading: isLoadingAchievements } = useProfileAchievements(profileId, 1, 100);
  const { data: unlocksData, isLoading: isLoadingUnlocks } = useProfileUnlocks(profileId, 1, 100);

  const isLoading = isLoadingPrizes || isLoadingAchievements || isLoadingUnlocks;

  // Process active prizes from spin wheel (claimed prizes)
  const claimedPrizes = (activePrizes || []).filter(prize => prize.isClaimed);
  
  // Process achievements (unlocked achievements)
  const unlockedAchievements = achievementsData?.data?.filter(achievement => achievement.isUnlocked && achievement.unlockedAt) || [];
  
  // Process unlocks (exclusive content unlocked)
  const unlocks = unlocksData?.data || [];

  // Combine all prize data
  const allPrizes = [
    ...claimedPrizes.map(prize => ({
      id: prize.id,
      title: prize.prizeName || `Spin Wheel Prize: ${prize.prizeType}`,
      date: prize.claimedAt ? new Date(prize.claimedAt).toLocaleDateString() : new Date(prize.createdAt).toLocaleDateString(),
      prize: prize.prizeName || prize.prizeType,
      status: prize.isClaimed ? "CLAIMED" : "PENDING",
      description: `You won this prize from the spin wheel${prize.prizeType === "EXCLUSIVE_BADGE" ? " - Exclusive Badge!" : ""}`,
      value: prize.prizeValue ? `$${prize.prizeValue.toLocaleString()}` : "N/A",
      type: prize.prizeType.toLowerCase().replace(/_/g, "_"),
    })),
    ...unlockedAchievements.map(achievement => ({
      id: achievement.id,
      title: achievement.name,
      date: achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : "",
      prize: achievement.description || achievement.name,
      status: "delivered",
      description: achievement.description || `Achievement unlocked: ${achievement.name}`,
      value: "Achievement",
      type: "achievement",
    })),
    ...unlocks.map(unlock => ({
      id: unlock.id,
      title: unlock.title || "Exclusive Content Unlocked",
      date: unlock.unlockedAt ? new Date(unlock.unlockedAt).toLocaleDateString() : "",
      prize: unlock.title || "Exclusive Content",
      status: "delivered",
      description: unlock.description || "You've unlocked exclusive content!",
      value: "Unlocked",
      type: "unlock",
    })),
  ];

  // Sort by date (most recent first)
  allPrizes.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  // Calculate total prize value (from spin wheel prizes with values)
  const totalPrizeValue = claimedPrizes.reduce((sum, prize) => {
    return sum + (prize.prizeValue || 0);
  }, 0);

  // Active/pending prizes (not yet claimed)
  const pendingPrizes = (activePrizes || []).filter(prize => !prize.isClaimed && prize.isActive);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading prize history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Prize History</h1>
        {totalPrizeValue > 0 && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Prize Value</p>
            <p className="text-xl font-bold text-primary">${totalPrizeValue.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Prize Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Prizes Won</p>
                <p className="text-2xl font-bold">{allPrizes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Claimed Prizes</p>
                <p className="text-2xl font-bold">
                  {claimedPrizes.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Prizes</p>
                <p className="text-2xl font-bold">{pendingPrizes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prize History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Prize History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allPrizes.length > 0 ? (
            <div className="space-y-4">
              {allPrizes.map((prize) => (
                <div key={prize.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(prize.type)}
                      <div>
                        <h3 className="font-semibold text-lg">{prize.title}</h3>
                        <p className="text-muted-foreground">{prize.description}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {getStatusBadge(prize.status)}
                      {prize.value !== "N/A" && prize.value !== "Achievement" && prize.value !== "Unlocked" && (
                        <p className="text-sm font-semibold text-primary">{prize.value}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-muted/50 rounded p-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-4 w-4" />
                      Date: {prize.date}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Gift className="mr-1 h-4 w-4" />
                      Prize: {prize.prize}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Prizes Won Yet</h3>
              <p className="text-muted-foreground">
                Keep participating in competitions and spinning the wheel to win amazing prizes!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming/Pending Prizes */}
      {pendingPrizes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5" />
              Active Prize Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPrizes.map((prize) => (
                <div key={prize.id} className="border rounded-lg p-4 space-y-3 bg-primary/5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Trophy className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-lg">{prize.prizeName || prize.prizeType}</h3>
                        <p className="text-muted-foreground">
                          {prize.prizeType === "EXCLUSIVE_BADGE" 
                            ? "Claim your exclusive badge to display it on your profile!"
                            : prize.prizeType === "BONUS_VOTES"
                            ? `${prize.prizeValue || 0} bonus votes ready to use!`
                            : "Prize available to claim"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {getStatusBadge(prize.isClaimed ? "CLAIMED" : "PENDING")}
                      {prize.prizeValue && (
                        <p className="text-sm font-semibold text-primary">Value: {prize.prizeValue}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-background rounded p-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                      Won: {new Date(prize.createdAt).toLocaleDateString()}
                    </div>
                    {prize.expiresAt && (
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                        Expires: {formatDistanceToNow(new Date(prize.expiresAt), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Gift, Target, Lock, Users, Share2, Copy, Check, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useReferralStats,
  useProfileAchievements,
  useUnlockProgress,
  useVoterLeaderboard,
  useReferralLeaderboard
} from "@/hooks/api/useGamification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { ImageHelper } from "@/lib/image-helper";
import { Link } from "@tanstack/react-router";

export function Gamification() {
  const { profile, user } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  
  const { data: referralStats, isLoading: loadingReferrals } = useReferralStats(user?.id);
  const { data: achievementsData, isLoading: loadingAchievements } = useProfileAchievements(profile?.id, 1, 50);
  const { data: unlockProgress, isLoading: loadingUnlocks } = useUnlockProgress(profile?.id);
  const { data: voterLeaderboard, isLoading: loadingVoters } = useVoterLeaderboard(profile?.id, 1, 10);
  const { data: referralLeaderboard, isLoading: loadingRefLeaderboard } = useReferralLeaderboard(1, 10);

  const copyReferralLink = () => {
    if (referralStats?.referralLink) {
      navigator.clipboard.writeText(referralStats.referralLink);
      setCopiedLink(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getTierColor = (tierName: string) => {
    const colors: Record<string, string> = {
      Bronze: "bg-orange-100 text-orange-800 border-orange-300",
      Silver: "bg-gray-100 text-gray-800 border-gray-300",
      Gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
      Platinum: "bg-blue-100 text-blue-800 border-blue-300",
      Diamond: "bg-purple-100 text-purple-800 border-purple-300",
    };
    return colors[tierName] || "bg-gray-100 text-gray-800";
  };

  const getUnlockIcon = (type: string) => {
    const icons: Record<string, string> = {
      EXCLUSIVE_PHOTO: "🖼️",
      VIDEO_MESSAGE: "🎥",
      AUDIO_MESSAGE: "🎵",
      PRIVATE_CALL: "📞",
      SIGNED_MERCH: "👕",
      MAGAZINE_FEATURE: "📰",
    };
    return icons[type] || "🎁";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gamification Hub</h1>
        <p className="text-muted-foreground">
          Track your progress, achievements, and rewards
        </p>
      </div>

      <Tabs defaultValue="referrals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="referrals">
            <Share2 className="w-4 h-4 mr-2" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="unlocks">
            <Lock className="w-4 h-4 mr-2" />
            Unlocks
          </TabsTrigger>
          <TabsTrigger value="voter-leaderboard">
            <Users className="w-4 h-4 mr-2" />
            Top Voters
          </TabsTrigger>
          <TabsTrigger value="ref-leaderboard">
            <Trophy className="w-4 h-4 mr-2" />
            Ref Leaders
          </TabsTrigger>
        </TabsList>

        {/* REFERRALS TAB */}
        <TabsContent value="referrals" className="space-y-4">
          {loadingReferrals ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Referral Link */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Your Referral Link
                  </CardTitle>
                  <CardDescription>Share this link to invite new models</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={referralStats?.referralLink || "Generate your code first"}
                      className="flex-1 p-3 border rounded-md bg-muted text-sm"
                    />
                    <Button onClick={copyReferralLink} variant="outline">
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  {referralStats?.referralCode && (
                    <div className="p-4 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium">Referral Code: <span className="font-bold text-blue-600">{referralStats.referralCode}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">New models get bonus votes • You get +50 bonus votes per referral</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Referral Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{referralStats?.totalReferrals || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {referralStats?.currentTier ? (
                      <Badge className={getTierColor(referralStats.currentTier.name)}>
                        {referralStats.currentTier.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No tier yet</span>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bonus Votes Earned</CardTitle>
                    <Gift className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(referralStats?.totalReferrals || 0) * 50}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress to Next Tier */}
              {referralStats?.nextTier && referralStats?.progress && (
                <Card>
                  <CardHeader>
                    <CardTitle>Progress to {referralStats.nextTier.name} Tier</CardTitle>
                    <CardDescription>
                      {referralStats.progress.remaining} more referrals needed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={referralStats.progress.percentage} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {referralStats.progress.current} / {referralStats.progress.needed} referrals
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Referral List */}
              {referralStats?.referrals && referralStats.referrals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Referrals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {referralStats.referrals.map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <p className="font-medium">{referral.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(referral.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary">+50 votes</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ACHIEVEMENTS TAB */}
        <TabsContent value="achievements" className="space-y-4">
          {loadingAchievements ? (
            <Skeleton className="h-64 w-full" />
          ) : achievementsData?.data && achievementsData.data.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {achievementsData.data.map((achievement) => (
                <Card key={achievement.id} className={achievement.isUnlocked ? "border-green-200 bg-green-50" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-4xl">{achievement.icon}</div>
                      {achievement.isUnlocked && (
                        <Badge className="bg-green-600">Unlocked</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{achievement.name}</CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge className={getTierColor(achievement.tier)}>
                        {achievement.tier}
                      </Badge>
                      {!achievement.isUnlocked && achievement.requirement && (
                        <>
                          <Progress value={achievement.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {achievement.progress}% complete
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No achievements available yet</p>
                <p className="text-sm text-muted-foreground">Check back soon for new achievements!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* UNLOCKS TAB */}
        <TabsContent value="unlocks" className="space-y-4">
          {loadingUnlocks ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Exclusive Content Unlocks</CardTitle>
                  <CardDescription>
                    Current Votes: <span className="font-bold">{unlockProgress?.totalVotes || 0}</span>
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {unlockProgress?.unlocks.map((unlock) => (
                  <Card key={unlock.type} className={unlock.isUnlocked ? "border-green-200 bg-gradient-to-br from-green-50 to-white" : "border-gray-200"}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl">{getUnlockIcon(unlock.type)}</div>
                        {unlock.isUnlocked ? (
                          <Badge className="bg-green-600">
                            <Check className="w-3 h-3 mr-1" />
                            Unlocked
                          </Badge>
                        ) : (
                          <Badge variant="outline">Locked</Badge>
                        )}
                      </div>
                      <CardTitle>{unlock.title}</CardTitle>
                      <CardDescription>{unlock.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Required Votes</span>
                          <span className="font-medium">{unlock.voteThreshold}</span>
                        </div>
                        {!unlock.isUnlocked && (
                          <>
                            <Progress value={unlock.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {unlock.progress}% complete • {unlock.voteThreshold - (unlockProgress?.totalVotes || 0)} votes needed
                            </p>
                          </>
                        )}
                        {unlock.isUnlocked && unlock.contentUrl && (
                          <Button className="w-full mt-2" asChild>
                            <a href={unlock.contentUrl} target="_blank" rel="noopener noreferrer">
                              View Content <ExternalLink className="w-4 h-4 ml-2" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* VOTER LEADERBOARD TAB */}
        <TabsContent value="voter-leaderboard" className="space-y-4">
          {loadingVoters ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Top Voters for You</CardTitle>
                <CardDescription>See who's supporting you the most</CardDescription>
              </CardHeader>
              <CardContent>
                {voterLeaderboard?.data && voterLeaderboard.data.length > 0 ? (
                  <div className="space-y-3">
                    {voterLeaderboard.data.map((voter, index) => (
                      <div key={voter.profileId} className="flex items-center gap-4 p-3 border rounded-md hover:bg-gray-50">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold">
                          {voter.rank}
                        </div>
                        <img
                          src={voter.profileImage ? ImageHelper.avatar(voter.profileImage, "small") : `https://ui-avatars.com/api/?name=${voter.name}&size=40`}
                          alt={voter.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{voter.name}</p>
                          <p className="text-xs text-muted-foreground">@{voter.username}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{voter.totalVotesGiven}</p>
                          <p className="text-xs text-muted-foreground">votes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No voters yet</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* REFERRAL LEADERBOARD TAB */}
        <TabsContent value="ref-leaderboard" className="space-y-4">
          {loadingRefLeaderboard ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Referral Leaderboard</CardTitle>
                <CardDescription>Top models by referral count</CardDescription>
              </CardHeader>
              <CardContent>
                {referralLeaderboard?.data && referralLeaderboard.data.length > 0 ? (
                  <div className="space-y-3">
                    {referralLeaderboard.data.map((model) => (
                      <div key={model.userId} className={`flex items-center gap-4 p-3 border rounded-md ${model.rank <= 3 ? "bg-gradient-to-r from-yellow-50 to-orange-50" : ""}`}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${model.rank === 1 ? "bg-yellow-400" : model.rank === 2 ? "bg-gray-300" : model.rank === 3 ? "bg-orange-300" : "bg-gray-100"}`}>
                          {model.rank}
                        </div>
                        <img
                          src={model.profileImage ? ImageHelper.avatar(model.profileImage, "small") : `https://ui-avatars.com/api/?name=${model.name}&size=40`}
                          alt={model.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{model.name}</p>
                          {model.username && <p className="text-xs text-muted-foreground">@{model.username}</p>}
                        </div>
                        <div className="text-right">
                          {model.currentTier && (
                            <Badge className={getTierColor(model.currentTier.name) + " mb-1"}>
                              {model.currentTier.name}
                            </Badge>
                          )}
                          <p className="font-bold">{model.totalReferrals} referrals</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


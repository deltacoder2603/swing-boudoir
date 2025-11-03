import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useReferralStats, useReferralLeaderboard, useGenerateReferralCode } from "@/hooks/api/useGamification";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, TrendingUp, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ImageHelper } from "@/lib/image-helper";
import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import SocialSharing from "./SocialSharing";

// Helper to get tier color
const getTierColor = (tier: string) => {
  switch (tier) {
    case "Bronze": return "bg-orange-100 text-orange-800";
    case "Silver": return "bg-gray-100 text-gray-800";
    case "Gold": return "bg-yellow-100 text-yellow-800";
    case "Platinum": return "bg-blue-100 text-blue-800";
    case "Diamond": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const ReferralsTab = () => {
  const { user } = useAuth();
  const { data: referralStats, isLoading: isLoadingStats, error: referralStatsError, refetch: refetchStats } = useReferralStats(user?.id);
  const { data: referralLeaderboard, isLoading: isLoadingLeaderboard } = useReferralLeaderboard();
  const { data: generatedCode, isLoading: isGeneratingCode, refetch: generateCode } = useGenerateReferralCode(user?.id);
  const [copied, setCopied] = useState(false);


  const handleCopy = () => {
    const linkToCopy = referralStats?.referralLink || generatedCode?.referralLink;
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateCode = async () => {
    try {
      await generateCode();
      await refetchStats(); // Refresh stats to get the new code
      toast.success("Referral code generated successfully!");
    } catch (error) {
      toast.error("Failed to generate referral code");
    }
  };

  // Determine which referral data to use
  const currentReferralCode = referralStats?.referralCode || generatedCode?.referralCode;
  const currentReferralLink = referralStats?.referralLink || generatedCode?.referralLink;

  if (isLoadingStats || isLoadingLeaderboard) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Referral Card - Link Generator, Social Sharing, and Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" /> Your Referrals
            <Badge variant="secondary" className="ml-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              Earn Rewards
            </Badge>
          </CardTitle>
          <CardDescription>Generate your referral link, share it, and track your performance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Link Generation Section */}
          <div className="space-y-4">
            {currentReferralCode ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Your Referral Link</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      readOnly
                      value={currentReferralLink || ""}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <Button onClick={handleCopy} variant="outline" size="icon">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Share this link to invite new users!</p>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Sparkles className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-900 mb-1">Generate Your Referral Code</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Create your unique referral link to start earning rewards!
                  </p>
                  <Button 
                    onClick={handleGenerateCode} 
                    disabled={isGeneratingCode}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {isGeneratingCode ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Referral Code
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Social Sharing Section */}
          {currentReferralCode && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share on Social Media
                </h4>
                <SocialSharing 
                  referralCode={currentReferralCode} 
                  referralLink={currentReferralLink}
                  compact={true}
                />
              </div>
            </div>
          )}

          {/* Referral Stats Section */}
          {referralStats && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Your Referral Performance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                    <p className="text-2xl font-bold">{referralStats.totalReferrals}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Current Tier</p>
                    {referralStats.currentTier ? (
                      <Badge className={`${getTierColor(referralStats.currentTier.name)} mt-1`}>
                        {referralStats.currentTier.name}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="mt-1">None</Badge>
                    )}
                  </div>
                </div>

                {referralStats.nextTier && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Progress to {referralStats.nextTier.name} Tier ({referralStats.progress?.remaining} more needed)
                    </p>
                    <Progress value={referralStats.progress?.percentage || 0} className="h-2" />
                  </div>
                )}

                {/* Recent Referrals */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Recent Referrals</h5>
                  {referralStatsError ? (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      <p className="font-medium">Error loading referrals:</p>
                      <p>{referralStatsError.message}</p>
                    </div>
                  ) : referralStats.referrals && referralStats.referrals.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {referralStats.referrals.slice(0, 5).map((ref) => (
                        <div key={ref.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                          <span className="font-medium">{ref.name}</span>
                          <span className="text-muted-foreground">{new Date(ref.joinedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                      {referralStats.referrals.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{referralStats.referrals.length - 5} more referrals
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No referrals yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Leaderboard Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Referral Leaderboard
          </CardTitle>
          <CardDescription>Top models by successful referrals.</CardDescription>
        </CardHeader>
        <CardContent>
          {referralLeaderboard?.data && referralLeaderboard.data.length > 0 ? (
            <div className="space-y-3">
              {referralLeaderboard.data.map((entry, index) => (
                <div key={entry.userId} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="font-bold text-lg w-8 text-center">{entry.rank}.</span>
                  <Link to="/profile/$username" params={{ username: entry.username || "" }}>
                    <img
                      src={ImageHelper.avatar(entry.profileImage || "", "small")}
                      alt={entry.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </Link>
                  <div className="flex-1">
                    <p className="font-semibold">{entry.name}</p>
                    <p className="text-sm text-muted-foreground">@{entry.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{entry.totalReferrals} Referrals</p>
                    {entry.currentTier && (
                      <Badge className={getTierColor(entry.currentTier.name)}>{entry.currentTier.name}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No models on the referral leaderboard yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralsTab;

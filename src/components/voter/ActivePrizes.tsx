import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles, Trophy, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActivePrizes, useClaimPrize, useMultiplierToken, type ActivePrize } from "@/hooks/api/useVoter";
import { useAuth } from "@/contexts/AuthContext";

interface ActivePrizesProps {
  profileId: string | undefined;
}

const PRIZE_ICONS: Record<string, string> = {
  BONUS_VOTES: "💞",
  VOTE_MULTIPLIER: "🔁",
  VOTE_MULTIPLIER_TOKEN: "💎",
  PERSONAL_MESSAGE: "💌",
  INSTAGRAM_FEATURE: "📸",
  EXCLUSIVE_BADGE: "🪩",
  MAGAZINE_FOLLOW_BACK: "💖",
  DIGITAL_BOUDOIR_ACCESS: "🌟",
  BTS_VIDEO_LINK: "💬",
  FREE_RETRY_SPIN: "🎁",
  MEET_GREET_DISCOUNT: "🎉",
};

const PRIZE_NAMES: Record<string, string> = {
  BONUS_VOTES: "Bonus Votes",
  VOTE_MULTIPLIER: "Vote Multiplier",
  VOTE_MULTIPLIER_TOKEN: "Vote Multiplier Token",
  PERSONAL_MESSAGE: "Personal Message",
  INSTAGRAM_FEATURE: "Instagram Feature",
  EXCLUSIVE_BADGE: "Exclusive Badge",
  MAGAZINE_FOLLOW_BACK: "Magazine Follow Back",
  DIGITAL_BOUDOIR_ACCESS: "Digital Boudoir Access",
  BTS_VIDEO_LINK: "BTS Video Link",
  FREE_RETRY_SPIN: "Free Retry Spin",
  MEET_GREET_DISCOUNT: "Meet & Greet Discount",
};

export function ActivePrizes({ profileId }: ActivePrizesProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: prizes, isLoading } = useActivePrizes(profileId, false);
  const claimPrize = useClaimPrize();
  const useToken = useMultiplierToken();
  const [usingToken, setUsingToken] = useState<string | null>(null);

  const handleClaimPrize = async (prize: ActivePrize) => {
    try {
      await claimPrize.mutateAsync(prize.id);
      toast({
        title: "🎉 Prize Claimed!",
        description: "Your prize has been claimed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim prize",
        variant: "destructive",
      });
    }
  };

  const handleUseToken = async (prize: ActivePrize) => {
    if (!profileId) return;
    
    setUsingToken(prize.id);
    try {
      const result = await useToken.mutateAsync({
        tokenId: prize.id,
        profileId,
      });
      toast({
        title: "💎 Token Activated!",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: "Token Activation Failed",
        description: error.message || "Failed to activate token",
        variant: "destructive",
      });
    } finally {
      setUsingToken(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (prize: ActivePrize) => {
    if (!prize.expiresAt) return false;
    return new Date(prize.expiresAt) < new Date();
  };

  const getPrizeStatus = (prize: ActivePrize) => {
    if (prize.isClaimed) return "claimed";
    if (isExpired(prize)) return "expired";
    return "active";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading prizes...</p>
        </CardContent>
      </Card>
    );
  }

  if (!prizes || prizes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Active Prizes
          </CardTitle>
          <CardDescription>Prizes you've won from spinning the wheel</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No active prizes yet. Spin the wheel to win amazing rewards!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Active Prizes ({prizes.length})
        </CardTitle>
        <CardDescription>Prizes you've won from spinning the wheel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {prizes.map((prize) => {
          const status = getPrizeStatus(prize);
          const icon = PRIZE_ICONS[prize.prizeType] || "🎁";
          const name = PRIZE_NAMES[prize.prizeType] || prize.prizeType;

          return (
            <div
              key={prize.id}
              className="border rounded-lg p-4 flex items-center justify-between gap-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="text-4xl">{icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{name}</h3>
                    {status === "claimed" && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Claimed
                      </Badge>
                    )}
                    {status === "expired" && (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                    {status === "active" && prize.expiresAt && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Expires: {formatDate(prize.expiresAt)}
                      </Badge>
                    )}
                  </div>
                  {prize.prizeValue && (
                    <p className="text-sm text-muted-foreground">
                      Value: {prize.prizeValue}
                    </p>
                  )}
                  {prize.claimedAt && (
                    <p className="text-xs text-muted-foreground">
                      Claimed: {formatDate(prize.claimedAt)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {prize.prizeType === "VOTE_MULTIPLIER_TOKEN" && !prize.isClaimed && status === "active" && (
                  <Button
                    size="sm"
                    onClick={() => handleUseToken(prize)}
                    disabled={usingToken === prize.id}
                  >
                    {usingToken === prize.id ? "Activating..." : "Use Token (10x)"}
                  </Button>
                )}
                {prize.prizeType !== "VOTE_MULTIPLIER_TOKEN" &&
                  !prize.isClaimed &&
                  status === "active" &&
                  prize.prizeType !== "BONUS_VOTES" &&
                  prize.prizeType !== "VOTE_MULTIPLIER" &&
                  prize.prizeType !== "FREE_RETRY_SPIN" && (
                    <Button
                      size="sm"
                      onClick={() => handleClaimPrize(prize)}
                      disabled={claimPrize.isPending}
                    >
                      {claimPrize.isPending ? "Claiming..." : "Claim"}
                    </Button>
                  )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}


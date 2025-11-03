import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image, Video, Phone, Package, ExternalLink, Copy, Check, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import type { VoterStats } from "@/hooks/api/useVoter";

interface VoterUnlocksProps {
  stats: VoterStats | undefined;
}

const UNLOCK_TIERS = [
  { votes: 100, name: "Exclusive Photo", icon: Image, type: "PHOTO" as const },
  { votes: 200, name: "Video/Audio Message", icon: Video, type: "VIDEO" as const },
  { votes: 500, name: "Private Call", icon: Phone, type: "CALL" as const },
  { votes: 1000, name: "Signed Merch/Magazine", icon: Package, type: "MERCH" as const },
];

export function VoterUnlocks({ stats }: VoterUnlocksProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const unlockedRewards = stats?.unlockedRewards || [];
  const totalVotes = stats?.totalVotes || 0;

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({
      title: "Code Copied!",
      description: "Access code copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getUnlockStatus = (votes: number) => {
    if (totalVotes >= votes) return "unlocked";
    return "locked";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Exclusive Content Unlocks</h1>
        <p className="text-muted-foreground">
          Cast votes to unlock exclusive content and rewards
        </p>
      </div>

      {/* Unlock Tiers */}
      <div className="space-y-3">
        {UNLOCK_TIERS.map((tier) => {
          const Icon = tier.icon;
          const status = getUnlockStatus(tier.votes);
          const isUnlocked = status === "unlocked";
          const reward = unlockedRewards?.find((r) => r.type === tier.type);

          return (
            <motion.div
              key={tier.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`relative rounded-lg border-2 p-4 ${
                isUnlocked
                  ? "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-full ${
                  isUnlocked 
                    ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white" 
                    : "bg-gray-300 text-gray-600"
                }`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{tier.name}</h3>
                    <Badge variant={isUnlocked ? "default" : "secondary"}>
                      {tier.votes} votes
                    </Badge>
                  </div>

                  {isUnlocked && reward ? (
                    <div className="space-y-3 mt-3">
                      <div className="p-3 rounded-lg bg-white border border-purple-200">
                        <p className="text-sm font-semibold mb-2">{reward.name}</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          {reward.description}
                        </p>

                        <div className="flex gap-2">
                          {reward.accessCode && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyCode(reward.accessCode!, reward.id)}
                            >
                              {copiedId === reward.id ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy Code
                                </>
                              )}
                            </Button>
                          )}

                          {reward.accessLink && (
                            <Button
                              size="sm"
                              onClick={() => window.open(reward.accessLink, "_blank")}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Access Content
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        {isUnlocked 
                          ? "Unlocked! Reward will be delivered soon." 
                          : `Vote ${tier.votes - totalVotes} more times to unlock this reward.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Unlocked Badge */}
              {isUnlocked && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-500">
                    <Check className="w-3 h-3 mr-1" />
                    Unlocked
                  </Badge>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-blue-500" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Cast votes for your favorite models to unlock exclusive content</p>
          <p>• Rewards are delivered automatically once you reach each tier</p>
          <p>• Access codes and links will appear here when unlocked</p>
          <p>• Keep voting to unlock all 4 tiers of exclusive content!</p>
        </CardContent>
      </Card>
    </div>
  );
}


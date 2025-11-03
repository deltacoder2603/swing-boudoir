import { motion } from "framer-motion";
import { Image, Video, Phone, Package, ExternalLink, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { VoterStats } from "@/hooks/api/useVoter";

interface ExclusiveUnlocksProps {
  unlockedRewards: VoterStats["unlockedRewards"];
  totalVotes: number;
}

const UNLOCK_TIERS = [
  { votes: 100, name: "Exclusive Photo", icon: Image, type: "PHOTO" as const },
  { votes: 200, name: "Video/Audio Message", icon: Video, type: "VIDEO" as const },
  { votes: 500, name: "Private Call", icon: Phone, type: "CALL" as const },
  { votes: 1000, name: "Signed Merch/Magazine", icon: Package, type: "MERCH" as const },
];

export function ExclusiveUnlocks({ unlockedRewards, totalVotes }: ExclusiveUnlocksProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎁 Exclusive Content Unlocks
        </CardTitle>
        <CardDescription>
          Cast votes to unlock exclusive content and rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isUnlocked
                        ? "bg-gradient-to-br from-purple-500 to-pink-500"
                        : "bg-gray-300"
                    }`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{tier.name}</h3>
                      {isUnlocked && (
                        <Badge className="bg-green-500 text-white">
                          Unlocked
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      Unlock at {tier.votes.toLocaleString()} votes
                    </p>

                    {isUnlocked ? (
                      <div className="space-y-2">
                        {reward?.accessUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => window.open(reward.accessUrl!, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Access Content
                          </Button>
                        )}

                        {reward?.accessCode && (
                          <div className="flex items-center gap-2">
                            <code className="px-3 py-1 bg-white rounded border text-sm font-mono">
                              {reward.accessCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCopyCode(reward.accessCode!, reward.id)
                              }
                            >
                              {copiedId === reward.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}

                        <p className="text-xs text-gray-500">
                          Unlocked on{" "}
                          {new Date(reward?.unlockedAt || "").toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((totalVotes / tier.votes) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                          {tier.votes - totalVotes} to go
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>💡 Tip:</strong> Keep voting to unlock exclusive content and
            rewards. The more you vote, the more you unlock!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

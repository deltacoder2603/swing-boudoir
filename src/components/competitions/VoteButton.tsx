import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCastPaidVote, useCastFreeVote, useCheckFreeVoteAvailability } from "@/hooks/api/useVotes";
import { ContestLeaderboardEntry } from "@/types/contest.types";
import { CreditCard, Gift, Star, Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import CountdownTimer from "../profile/CountdownTimer";

type VoteButtonProps = {
  participant: ContestLeaderboardEntry;
  contestId: string;
  onVoteSuccess?: () => void;
  compact?: boolean;
};

export const VoteButton = ({ participant, contestId, onVoteSuccess, compact = false }: VoteButtonProps) => {
  const { user } = useAuth();
  const [selectedVoteType, setSelectedVoteType] = useState<"free" | "50" | "100" | "150" | "200" | "custom" | null>(null);
  const [customVoteCount, setCustomVoteCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);

  const { mutateAsync: castPaidVote, isPending: isPaidVoting } = useCastPaidVote();
  const { mutateAsync: castFreeVote, isPending: isFreeVoting } = useCastFreeVote();

  // Check free vote availability
  const { data: freeVoteAvailability, isLoading: isLoadingAvailability } = useCheckFreeVoteAvailability({
    profileId: user?.profileId || "",
    contestId: contestId,
  });

  const isFreeVoteAvailable = freeVoteAvailability?.isAvailable || false;

  const voteOptions = useMemo(
    () => {
      return [
        { id: "free", title: "Free Vote", description: "Daily free vote", votes: 1, price: 0, icon: Gift, available: isFreeVoteAvailable },
        { id: "50", title: "50 Votes", description: "50 votes", votes: 50, price: 50, icon: Star },
        {
          id: "100",
          title: "100 Votes",
          popular: true,
          description: "100 votes",
          votes: 100,
          price: 100,
          icon: Star,
        },
        {
          id: "150",
          title: "150 Votes",
          description: "150 votes",
          votes: 150,
          price: 150,
          icon: Star,
        },
        {
          id: "200",
          title: "200 Votes",
          description: "200 votes",
          votes: 200,
          price: 200,
          icon: Star,
        },
        {
          id: "custom",
          title: "Custom Votes",
          description: "Choose your own number of votes",
          votes: customVoteCount,
          price: customVoteCount * 1.0, // $1.00 per vote
          icon: Star,
          isCustom: true,
        },
      ];
    },
    [customVoteCount, isFreeVoteAvailable]
  );

  const handleVoteClick = async () => {
    if (!selectedVoteType || !user?.profileId) {
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedVoteType === "free") {
        // Free vote logic - handle directly
        const freeVoteData = {
          contestId: contestId,
          voteeId: participant.profileId,
          voterId: user.profileId,
          comment: "", // Add required comment field
        };

        await castFreeVote(freeVoteData);
        
        toast.success("Free vote cast successfully!", {
          description: `You've voted for ${participant.displayUsername || participant.username}`,
        });

        // Close modal after successful vote
        setShowVoteModal(false);
        onVoteSuccess?.();
        return;
      } else {
        // Paid vote logic
        const voteCount =
          selectedVoteType === "50" ? 50 : 
          selectedVoteType === "100" ? 100 : 
          selectedVoteType === "150" ? 150 : 
          selectedVoteType === "200" ? 200 : 
          selectedVoteType === "custom" ? customVoteCount : 0;

        const voteData = {
          contestId: contestId,
          voteeId: participant.profileId,
          voterId: user.profileId,
          voteCount: voteCount,
        };

        const result = await castPaidVote(voteData);

        if (result && result.url) {
          // Redirect to payment URL
          window.location.href = result.url;
        } else {
          toast.error("Failed to initiate payment", {
            description: "Unable to create payment session. Please try again.",
          });
        }
      }
    } catch (error) {
      console.error("Error processing vote:", error);
      toast.error("Failed to process vote", {
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowVoteModal(true)}
          className="text-xs px-3 py-1"
        >
          <Heart className="w-3 h-3 mr-1" />
          Vote
        </Button>
        
        {/* Compact Vote Modal */}
        {showVoteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Vote for {participant.displayUsername || participant.username}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoteModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-3 mb-4">
                {voteOptions.map((option) => {
                  const Icon = option.icon;
                  const isDisabled = option.id === "free" && !option.available;

                  return (
                    <div
                      key={option.id}
                      className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all duration-300 ${
                        selectedVoteType === option.id
                          ? "border-blue-500 bg-blue-50"
                          : isDisabled
                            ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-25"
                      }`}
                      onClick={() => !isDisabled && setSelectedVoteType(option.id as "free" | "50" | "100" | "150" | "200" | "custom")}
                    >
                      {option.popular && <Badge className="absolute -top-2 left-3 bg-orange-500 text-white text-xs">Most Popular</Badge>}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${option.id === "free" ? "bg-green-100" : "bg-purple-100"}`}>
                            <Icon className={`w-4 h-4 ${option.id === "free" ? "text-green-600" : "text-purple-600"}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{option.title}</h4>
                            <p className="text-gray-600 text-xs">{option.description}</p>
                            {isDisabled && option.id === "free" && freeVoteAvailability?.lastVoteAt && (
                              <CountdownTimer 
                                lastVoteAt={freeVoteAvailability.lastVoteAt} 
                                onAvailabilityChange={() => {}} 
                              />
                            )}
                            {option.isCustom && selectedVoteType === "custom" && (
                              <div className="mt-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="1000"
                                  value={customVoteCount}
                                  onChange={(e) => setCustomVoteCount(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="1"
                                />
                                <span className="text-xs text-gray-500 ml-1">votes</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{option.price === 0 ? "FREE" : option.isCustom ? `$${option.price.toFixed(2)}` : `$${option.price}`}</div>
                          <div className="text-xs text-gray-500">
                            {option.votes} vote{option.votes > 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowVoteModal(false)} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleVoteClick} disabled={!selectedVoteType || isProcessing || isPaidVoting || isFreeVoting}>
                  {isProcessing || isPaidVoting || isFreeVoting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {selectedVoteType === "free" ? "Processing..." : "Redirecting..."}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {selectedVoteType === "free" ? <Gift className="w-4 h-4 mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                      {selectedVoteType === "free" ? "Cast Free Vote" : "Purchase & Vote"}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowVoteModal(true)}
      className="text-xs px-3 py-1"
    >
      <Heart className="w-3 h-3 mr-1" />
      Vote
    </Button>
  );
};

export default VoteButton;

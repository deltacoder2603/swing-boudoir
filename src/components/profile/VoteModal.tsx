import { Button } from "@/components/ui/button";

import { useAuth } from "@/contexts/AuthContext";
import { Profile } from "@/types/profile.types";
import { useCastPaidVote, useCastFreeVote } from "@/hooks/api/useVotes";
import { ContestParticipation } from "@/types/competitions.types";
import { CreditCard, Gift, Star, Wallet, ShoppingBag } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal, ModalBody, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "../global/modal";
import { Badge } from "../ui/badge";
import CountdownTimer from "./CountdownTimer";
import { voteApi } from "@/lib/api";
import { useRouter } from "@tanstack/react-router";

type VoteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participation: ContestParticipation;
  profile: Profile;
  voterProfile?: Profile; // Pass voter profile from parent
  isFreeVoteAvailable: boolean; // Pass availability from parent
  onAvailabilityChange?: (available: boolean) => void; // Callback to update parent
  onFreeVoteRequest: (participation: ContestParticipation) => void; // Callback for free vote requests
};

const VoteModal = ({ open, onOpenChange, participation, profile, voterProfile, isFreeVoteAvailable, onAvailabilityChange, onFreeVoteRequest }: VoteModalProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedVoteType, setSelectedVoteType] = useState<"free" | "credits" | "single" | "pack5" | "pack10" | "pack25" | "custom" | null>(null);
  const [customVoteCount, setCustomVoteCount] = useState<number>(1);
  const [creditsVoteCount, setCreditsVoteCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableVotes, setAvailableVotes] = useState<number>(0);
  const [loadingVotes, setLoadingVotes] = useState(true);
  const { mutateAsync: castPaidVote, isPending: isPaidVoting } = useCastPaidVote();
  const { mutateAsync: castFreeVote, isPending: isFreeVoting } = useCastFreeVote();

  // Fetch available vote credits
  useEffect(() => {
    const fetchAvailableVotes = async () => {
      if (!user?.profileId) return;
      
      setLoadingVotes(true);
      try {
        const response = await voteApi.getAvailableVotes<{
          profileId: string;
          availableVotes: number;
          lastFreeVoteAt: string | null;
          freeVoteAvailable: boolean;
        }>(user.profileId);
        
        if (response.success && response.data) {
          setAvailableVotes(response.data.availableVotes);
        }
      } catch (error) {
        console.error("Failed to fetch available votes:", error);
      } finally {
        setLoadingVotes(false);
      }
    };

    if (open) {
      fetchAvailableVotes();
    }
  }, [user?.profileId, open]);

  const voteOptions = useMemo(
    () => {
      const options = [
        { id: "free", title: "Free Vote", description: "Daily free vote", votes: 1, price: 0, icon: Gift, available: isFreeVoteAvailable },
      ];

      // Add "Use Credits" option if user has credits
      if (availableVotes > 0) {
        options.push({
          id: "credits",
          title: "Use Vote Credits",
          description: `You have ${availableVotes} votes available`,
          votes: creditsVoteCount,
          price: 0,
          icon: Wallet,
          available: true,
          isCredits: true,
        } as any);
      }

      // Add purchase options
      options.push(
        { id: "single", title: "Buy 5 Votes", description: "5 votes for $1", votes: 5, price: 1, icon: ShoppingBag },
        {
          id: "pack5",
          title: "Buy 25 Votes",
          description: "25 votes for $5",
          votes: 25,
          price: 5,
          icon: ShoppingBag,
        },
        {
          id: "pack10",
          title: "Buy 50 Votes",
          popular: true,
          description: "50 votes for $10",
          votes: 50,
          price: 10,
          icon: ShoppingBag,
        },
        {
          id: "custom",
          title: "Custom Amount",
          description: "Choose your own number",
          votes: customVoteCount,
          price: customVoteCount * 0.2,
          icon: ShoppingBag,
          isCustom: true,
        }
      );

      return options;
    },
    [customVoteCount, creditsVoteCount, isFreeVoteAvailable, availableVotes]
  );

  const handleVoteClick = async () => {
    if (!selectedVoteType || !user?.profileId) {
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedVoteType === "free") {
        // Free vote logic
        const freeVoteData = {
          contestId: participation.contest.id,
          voteeId: profile.id,
          voterId: user.profileId,
          comment: "",
        };

        await castFreeVote(freeVoteData);
        
        toast.success("Free vote cast successfully!", {
          description: `You've voted for ${profile.user.name}`,
        });

        onOpenChange(false);
        return;
      } else if (selectedVoteType === "credits") {
        // Use pre-purchased credits
        if (creditsVoteCount > availableVotes) {
          toast.error("Insufficient votes", {
            description: `You have ${availableVotes} votes available, but tried to cast ${creditsVoteCount} votes.`,
            action: {
              label: "Buy More Votes",
              onClick: () => {
                onOpenChange(false);
                router.navigate({ to: "/voters", search: { section: "buy-votes" } });
              },
            },
          });
          return;
        }

        const response = await voteApi.castVoteWithCredits<{
          id: string;
          remainingCredits: number;
        }>({
          voterId: user.profileId,
          voteeId: profile.id,
          contestId: participation.contest.id,
          count: creditsVoteCount,
          comment: "",
        });

        if (response.success && response.data) {
          setAvailableVotes(response.data.remainingCredits);
          toast.success("Vote cast successfully!", {
            description: `You used ${creditsVoteCount} vote${creditsVoteCount > 1 ? 's' : ''}. ${response.data.remainingCredits} votes remaining.`,
          });
          onOpenChange(false);
        } else {
          throw new Error(response.error || "Failed to cast vote");
        }
        return;
      } else {
        // Buy votes logic (redirect to Stripe)
        const voteCount =
          selectedVoteType === "single" ? 5 : selectedVoteType === "pack5" ? 25 : selectedVoteType === "pack10" ? 50 : selectedVoteType === "custom" ? customVoteCount : 0;

        const voteData = {
          contestId: participation.contest.id,
          voteeId: profile.id,
          voterId: user.profileId,
          voteCount: voteCount,
        };

        const result = await castPaidVote(voteData);

        if (result && result.url) {
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

  // If modal is not open, don't render anything to avoid DOM conflicts
  if (!open) {
    return null;
  }

  return (
    <Modal 
      open={open} 
      onOpenChange={onOpenChange} 
      backdrop="opaque" 
      size="lg" 
      classNames={{ content: "max-h-[95%] min-h-[95%] md:max-h-full md:min-h-auto notranslate" }}
    >
      <ModalContent className="md:overflow-y-auto notranslate">
        <ModalHeader>
          <ModalTitle>Vote for {profile.user.name}</ModalTitle>
          <ModalDescription>
            <span className="text-muted-foreground flex flex-wrap justify-between items-center gap-2">
              <span>please select the number of votes you want to buy.</span>
            </span>
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="grid gap-3">
            {voteOptions.map((option) => {
              const Icon = option.icon;
              const isDisabled = option.id === "free" && !option.available;

               return (
                 <div
                   key={option.id}
                   className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                     selectedVoteType === option.id
                       ? "border-blue-500 bg-blue-50"
                       : isDisabled
                         ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                         : "border-gray-200 hover:border-blue-300 hover:bg-blue-25"
                   }`}
                   onClick={() => !isDisabled && setSelectedVoteType(option.id as "free" | "single" | "pack5" | "pack10" | "pack25" | "custom")}
                   role="button"
                   tabIndex={0}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' || e.key === ' ') {
                       e.preventDefault();
                       if (!isDisabled) {
                         setSelectedVoteType(option.id as "free" | "single" | "pack5" | "pack10" | "pack25" | "custom");
                       }
                     }
                   }}
                 >
                  {option.popular && <Badge className="absolute -top-2 left-4 bg-orange-500 text-white">Most Popular</Badge>}

                    <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        option.id === "free" ? "bg-green-100" : 
                        option.id === "credits" ? "bg-blue-100" : 
                        "bg-purple-100"
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          option.id === "free" ? "text-green-600" : 
                          option.id === "credits" ? "text-blue-600" : 
                          "text-purple-600"
                        }`} />
                      </div>

                      <div>
                        <h4 className="font-semibold text-lg">{option.title}</h4>
                        <p className="text-gray-600 text-sm">{option.description}</p>
                        {isDisabled && option.id === "free" && voterProfile?.lastFreeVoteAt && (
                          <CountdownTimer 
                            lastVoteAt={voterProfile.lastFreeVoteAt} 
                            onAvailabilityChange={onAvailabilityChange || ((canVote: boolean) => {})} 
                          />
                        )}
                        {isDisabled && option.id === "free" && !voterProfile?.lastFreeVoteAt && <p className="text-gray-500 text-sm">Free vote not available</p>}
                        {(option as any).isCredits && selectedVoteType === "credits" && (
                          <div className="mt-2">
                            <input
                              type="number"
                              min="1"
                              max={availableVotes}
                              value={creditsVoteCount}
                              onChange={(e) => setCreditsVoteCount(Math.max(1, Math.min(availableVotes, parseInt(e.target.value) || 1)))}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="1"
                            />
                            <span className="text-xs text-gray-500 ml-2">votes (max: {availableVotes})</span>
                          </div>
                        )}
                        {option.isCustom && selectedVoteType === "custom" && (
                          <div className="mt-2">
                            <input
                              type="number"
                              min="1"
                              max="1000"
                              value={customVoteCount}
                              onChange={(e) => setCustomVoteCount(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="1"
                            />
                            <span className="text-xs text-gray-500 ml-2">votes</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold">{option.price === 0 ? "FREE" : option.isCustom ? `$${option.price.toFixed(2)}` : `$${option.price}`}</div>
                      <div className="text-sm text-gray-500">
                        {option.votes} vote{option.votes > 1 ? "s" : ""}
                      </div>
                    </div>
                   </div>
                 </div>
               );
            })}
          </div>
          <ModalFooter className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex space-x-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleVoteClick} disabled={!selectedVoteType || isProcessing || isPaidVoting || isFreeVoting}>
                  {isProcessing || isPaidVoting || isFreeVoting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {selectedVoteType === "free" ? "Processing..." : selectedVoteType === "credits" ? "Casting vote..." : "Redirecting to payment..."}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {selectedVoteType === "free" ? <Gift className="w-4 h-4 mr-2" /> : selectedVoteType === "credits" ? <Wallet className="w-4 h-4 mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                      {selectedVoteType === "free" ? "Cast Free Vote" : selectedVoteType === "credits" ? "Use Credits to Vote" : "Purchase & Vote"}
                    </div>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">By voting, you agree to our terms of service and privacy policy</p>
            </div>
          </ModalFooter>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default VoteModal;

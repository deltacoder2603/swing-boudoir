import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalBody, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "../global/modal";
import { ContestParticipation } from "@/types/competitions.types";
import { Profile } from "@/types/profile.types";
import { Calendar, Eye, Gift, Trophy, Users } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { formatUsdAbbrev } from "@/lib/utils";
import { Contest_Status } from "@/lib/validations/contest.schema";
import { getImageUrl } from "@/lib/image-helper";
import VoteModal from "./VoteModal";
import { VoterAuthModal } from "@/components/auth/VoterAuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/api/useProfile";
import { useCheckFreeVoteAvailability } from "@/hooks/api/useVotes";

interface BuyVotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participations: ContestParticipation[];
  profile: Profile;
  preSelectedContestId?: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

  const getStatusBadge = (status: keyof typeof Contest_Status) => {
    switch (status) {
      case "ACTIVE":
      case "PUBLISHED":
      case "VOTING":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs px-3 py-1 font-medium">Active</Badge>;
      case "COMPLETED":
      case "BOOKED":
        return (
          <Badge variant="secondary" className="hover:bg-gray-100 text-xs px-3 py-1 font-medium">
            Ended
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge variant="outline" className="text-xs px-3 py-1 border-blue-200 text-blue-600 hover:bg-blue-50 font-medium">
            Upcoming
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="hover:bg-gray-100 text-xs px-3 py-1 font-medium">
            {status}
          </Badge>
        );
    }
  };

export function BuyVotesModal({ open, onOpenChange, participations, profile, preSelectedContestId }: BuyVotesModalProps) {
  const [selectedParticipation, setSelectedParticipation] = useState<ContestParticipation | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Auth and profile hooks
  const { user, isAuthenticated } = useAuth();
  const { useProfileByUserId } = useProfile();
  const { data: voterProfile } = useProfileByUserId(user?.id || "");
  const { data: freeVoteAvailability } = useCheckFreeVoteAvailability({
    profileId: voterProfile?.id || "",
  });

  // Determine free vote availability based on API data
  const isFreeVoteAvailable = useMemo(() => {
    if (freeVoteAvailability?.available) {
      return true;
    } else if (voterProfile?.lastFreeVoteAt) {
      // Simple check - if lastFreeVoteAt exists, assume can't vote (24h cooldown)
      const lastVote = new Date(voterProfile.lastFreeVoteAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastVote.getTime()) / (1000 * 60 * 60);
      return hoursDiff >= 24;
    }
    return false;
  }, [freeVoteAvailability?.available, voterProfile?.lastFreeVoteAt]);

  // Auto-select participation when modal opens with preSelectedContestId
  useEffect(() => {
    if (open && preSelectedContestId && participations.length > 0 && isAuthenticated) {
      const participation = participations.find(p => p.contest?.id === preSelectedContestId);
      if (participation) {
        setSelectedParticipation(participation);
        setIsVoteModalOpen(true);
      }
    }
  }, [open, preSelectedContestId, participations, isAuthenticated]);

  const handleParticipationSelect = (participation: ContestParticipation) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedParticipation(participation);
    setIsVoteModalOpen(true);
  };

  const handleVoteModalClose = () => {
    setIsVoteModalOpen(false);
    setSelectedParticipation(null);
  };

  const handleBuyVotesModalClose = () => {
    onOpenChange(false);
    setSelectedParticipation(null);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    // After successful authentication, if there was a selected participation, open vote modal
    if (selectedParticipation) {
      setIsVoteModalOpen(true);
    }
  };

  return (
    <>
      <Modal open={open} onOpenChange={handleBuyVotesModalClose} backdrop="opaque" size="lg">
        <ModalContent className="max-h-[90vh] overflow-hidden [&_[data-radix-scroll-area-viewport]>*]:!block">
          <ModalHeader>
            <ModalTitle>Buy Votes for {profile.user.name}</ModalTitle>
            <ModalDescription>
              Select a contest to vote for {profile.user.name}
            </ModalDescription>
          </ModalHeader>
          
          <ModalBody className="overflow-y-auto">
            {participations.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Contests</h3>
                <p className="text-gray-600">This model hasn't joined any active contests yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {participations.map((participation) => (
                  <Card key={participation.id} className="border border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 hover:border-gray-300 transition-all duration-200 cursor-pointer" onClick={() => handleParticipationSelect(participation)}>
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Contest Image */}
                        <div className="flex-shrink-0">
                          {participation.coverImage ? (
                            <img
                              src={getImageUrl(participation.coverImage.url, "gallery", { w: 120, h: 80, q: 80 })}
                              alt="Contest Photo"
                              className="w-20 h-20 md:w-20 md:h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 md:w-20 md:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Contest Info */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">{participation.contest?.name || "Contest"}</h3>
                            <div className="flex-shrink-0">
                              {getStatusBadge(participation.contest?.status || "")}
                            </div>
                          </div>
                          
                          {participation.contest?.description && (
                            <p className="text-gray-600 text-xs md:text-sm mb-2 truncate w-[60%] md:w-[70%]">
                              {participation.contest.description}
                            </p>
                          )}

                          {/* Prize Pool and End Date */}
                          <div className="flex flex-row md:items-center justify-between gap-1 md:gap-0">
                            <div className="flex items-center space-x-1">
                              <Gift className="w-3 h-3 text-green-600 flex-shrink-0" />
                              <span className="text-xs text-gray-500">Prize:</span>
                              <span className="text-xs font-semibold text-green-600 truncate">
                                {participation.contest?.prizePool ? formatUsdAbbrev(participation.contest.prizePool) : "TBA"}
                              </span>
                            </div>
                            {participation.contest?.endDate && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(participation.contest.endDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" onClick={handleBuyVotesModalClose} className="w-full text-black">
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Vote Modal */}
      {selectedParticipation && (
        <VoteModal
          open={isVoteModalOpen}
          onOpenChange={handleVoteModalClose}
          participation={selectedParticipation}
          profile={profile}
          voterProfile={voterProfile}
          isFreeVoteAvailable={isFreeVoteAvailable}
          onFreeVoteRequest={() => {
            // Handle free vote request - close both modals
            setIsVoteModalOpen(false);
            handleBuyVotesModalClose();
          }}
        />
      )}

      {/* Voter Authentication Modal */}
      <VoterAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess} 
        callbackURL={window.location.pathname} 
      />
    </>
  );
}

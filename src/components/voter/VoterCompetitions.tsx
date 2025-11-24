import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, Search, Trophy, Users } from "lucide-react";
import { useAvailableContests, useContestParticipants } from "@/hooks/api/useVoter";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "@tanstack/react-router";
import { useCastPaidVote } from "@/hooks/api/useVotes";
import { useAuth } from "@/contexts/AuthContext";

interface VoterCompetitionsProps {
  profileId: string | undefined;
}

export function VoterCompetitions({ profileId }: VoterCompetitionsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [voteAmounts, setVoteAmounts] = useState<Record<string, number>>({});
  const [isVoting, setIsVoting] = useState<Record<string, boolean>>({});
  
  const { mutateAsync: castPaidVote } = useCastPaidVote();

  const handleProfileClick = (username: string | null) => {
    if (username) {
      navigate({ to: "/profile/$username", params: { username } });
    }
  };

  const { data: contestsData, isLoading: contestsLoading } = useAvailableContests(user?.id);
  const { data: participantsData, isLoading: participantsLoading } = useContestParticipants(selectedContestId || "", user?.id);

  const handleVote = async (contestId: string, voteeId: string, modelName: string) => {
    if (!profileId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to vote",
        variant: "destructive",
      });
      return;
    }

    const voteCount = voteAmounts[voteeId] || 1;
    
    setIsVoting(prev => ({ ...prev, [voteeId]: true }));

    try {
      const voteData = {
        contestId,
        voteeId,
        voterId: profileId,
        voteCount,
      };

      const result = await castPaidVote(voteData);

      if (result && result.url) {
        // Redirect to Stripe checkout
        window.location.href = result.url;
      } else {
        console.error("Payment result:", result);
        toast({
          title: "Failed to initiate payment",
          description: result?.error || "Unable to create payment session. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error processing vote:", error);
      toast({
        title: "Failed to process vote",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVoting(prev => ({ ...prev, [voteeId]: false }));
    }
  };

  if (contestsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contests...</p>
        </div>
      </div>
    );
  }

  const contests = contestsData?.contests || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Vote in Contests</h1>
        <p className="text-muted-foreground">
          Support your favorite models and earn milestones
        </p>
      </div>

      {/* Contest Selection */}
      {!selectedContestId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests.map((contest: any) => (
            <Card 
              key={contest.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedContestId(contest.id)}
            >
              {contest.images && contest.images.length > 0 && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg">
                  <img 
                    src={contest.images[0].url} 
                    alt={contest.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-1">{contest.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  Prize Pool: ${contest.prizePool.toLocaleString()} • {contest.participantCount} participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      <Trophy className="w-3 h-3 mr-1" />
                      ${contest.prizePool.toLocaleString()}
                    </Badge>
                    <Badge variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      {contest.participantCount} models
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Your votes: {contest.userVoteCount}</span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      {contest.status}
                    </Badge>
                  </div>
                  <Button size="sm" className="w-full">
                    View Models & Vote
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {contests.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Contests</h3>
                <p className="text-muted-foreground text-center">
                  Check back soon for new competitions to participate in!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Model Voting Interface */}
      {selectedContestId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Vote for Models</h2>
            <Button variant="outline" onClick={() => setSelectedContestId(null)}>
              ← Back to Contests
            </Button>
          </div>

          {participantsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading models...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participantsData?.participants?.map((participant: any) => (
                <Card key={participant.profileId}>
                  {participant.avatarUrl && (
                    <div className="w-full h-64 overflow-hidden rounded-t-lg bg-gray-100">
                      <img 
                        src={participant.avatarUrl} 
                        alt={participant.modelName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {!participant.avatarUrl && (
                    <div className="w-full h-64 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center rounded-t-lg">
                      <div className="text-6xl font-bold text-purple-300">
                        {participant.modelName.charAt(0)}
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span 
                        className={participant.username ? "cursor-pointer hover:text-primary transition-colors" : ""}
                        onClick={() => handleProfileClick(participant.username)}
                      >
                        {participant.modelName}
                      </span>
                      <Badge variant="secondary">Rank #{participant.rank}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {participant.username && (
                        <p 
                          className="text-sm cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleProfileClick(participant.username)}
                        >
                          @{participant.username}
                        </p>
                      )}
                      {participant.bio && <p className="text-sm mt-1 line-clamp-2">{participant.bio}</p>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                        <span className="font-semibold">{participant.totalVotes}</span>
                        <span className="text-muted-foreground">total votes</span>
                      </div>
                      {participant.userVoteCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          You: {participant.userVoteCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={voteAmounts[participant.profileId] || 1}
                        onChange={(e) => setVoteAmounts(prev => ({
                          ...prev,
                          [participant.profileId]: Math.max(1, parseInt(e.target.value) || 1)
                        }))}
                        className="w-20"
                      />
                      <Button
                        className="flex-1"
                        onClick={() => handleVote(
                          selectedContestId, 
                          participant.profileId, 
                          participant.modelName
                        )}
                        disabled={isVoting[participant.profileId]}
                      >
                        {isVoting[participant.profileId] ? (
                          "Processing..."
                        ) : (
                          <>
                            <Heart className="w-4 h-4 mr-2" />
                            Vote
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {participantsData?.participants?.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Models Yet</h3>
                    <p className="text-muted-foreground text-center">
                      This contest doesn't have any participants yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


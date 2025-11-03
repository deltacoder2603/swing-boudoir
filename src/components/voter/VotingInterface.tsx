import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, TrendingUp, Trophy, User, Vote as VoteIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { ContestParticipant } from "@/hooks/api/useVoter";

interface VotingInterfaceProps {
  participants: ContestParticipant[];
  contestName: string;
  onVote: (participantId: string, voteCount: number) => Promise<void>;
  isVoting?: boolean;
}

export function VotingInterface({
  participants,
  contestName,
  onVote,
  isVoting = false,
}: VotingInterfaceProps) {
  const [sortBy, setSortBy] = useState<"votes" | "recent" | "name">("votes");
  const { toast } = useToast();

  const sortedParticipants = [...participants].sort((a, b) => {
    if (sortBy === "votes") return b.totalVotes - a.totalVotes;
    if (sortBy === "recent")
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    if (sortBy === "name") return a.modelName.localeCompare(b.modelName);
    return 0;
  });

  const handleVote = async (participant: ContestParticipant) => {
    try {
      await onVote(participant.contestParticipationId, 1);
      toast({
        title: "Vote Cast! 🎉",
        description: `You voted for ${participant.modelName}`,
      });
    } catch (error: any) {
      toast({
        title: "Vote Failed",
        description: error.message || "Failed to cast vote",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{contestName}</h2>
          <p className="text-gray-600">Vote for your favorite models</p>
        </div>

        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="votes">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Most Votes
              </div>
            </SelectItem>
            <SelectItem value="recent">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Recently Joined
              </div>
            </SelectItem>
            <SelectItem value="name">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Name (A-Z)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Participants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedParticipants.map((participant, index) => {
          const rankColor =
            participant.rank === 1
              ? "bg-yellow-500"
              : participant.rank === 2
              ? "bg-gray-400"
              : participant.rank === 3
              ? "bg-orange-600"
              : "bg-gray-300";

          return (
            <motion.div
              key={participant.profileId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Cover Image */}
                <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
                  {participant.coverImageUrl || participant.avatarUrl ? (
                    <img
                      src={participant.coverImageUrl || participant.avatarUrl || ""}
                      alt={participant.modelName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-300" />
                    </div>
                  )}

                  {/* Rank Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className={`${rankColor} text-white font-bold`}>
                      #{participant.rank}
                    </Badge>
                  </div>

                  {/* Your Votes Badge */}
                  {participant.userVoteCount > 0 && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-blue-500 text-white">
                        <Heart className="w-3 h-3 mr-1 fill-current" />
                        {participant.userVoteCount}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Model Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={participant.avatarUrl || ""} />
                      <AvatarFallback>
                        {participant.modelName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">
                        {participant.modelName}
                      </h3>
                      {participant.username && (
                        <p className="text-sm text-gray-600 truncate">
                          @{participant.username}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {participant.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {participant.bio}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-purple-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-bold">
                        {participant.totalVotes.toLocaleString()}
                      </span>
                      <span className="text-gray-600">votes</span>
                    </div>
                  </div>

                  {/* Vote Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
                    onClick={() => handleVote(participant)}
                    disabled={isVoting}
                  >
                    <VoteIcon className="w-4 h-4 mr-2" />
                    Vote Now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {participants.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No participants yet</p>
          <p className="text-gray-500 text-sm">Check back soon!</p>
        </div>
      )}
    </div>
  );
}

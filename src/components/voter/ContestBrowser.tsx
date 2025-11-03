import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, TrendingUp, ArrowRight, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "@tanstack/react-router";
import type { VoterContest } from "@/hooks/api/useVoter";

interface ContestBrowserProps {
  contests: VoterContest[];
  onSelectContest: (contestId: string) => void;
}

export function ContestBrowser({ contests, onSelectContest }: ContestBrowserProps) {
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSelectContest = (contest: VoterContest) => {
    setSelectedContestId(contest.id);
    onSelectContest(contest.id);
  };

  const handleViewDetails = (contest: VoterContest) => {
    navigate({ to: `/competitions/${contest.slug}` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Active Contests</h2>
          <p className="text-gray-600">Choose a contest and vote for your favorite models</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {contests.length} Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contests.map((contest, index) => {
          const isSelected = selectedContestId === contest.id;
          const coverImage = contest.images[0]?.url;

          return (
            <motion.div
              key={contest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`overflow-hidden cursor-pointer transition-all hover:shadow-xl ${
                  isSelected ? "ring-4 ring-purple-500 shadow-xl" : ""
                }`}
                onClick={() => handleSelectContest(contest)}
              >
                {/* Cover Image */}
                <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={contest.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-300" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500 text-white">
                      {contest.status}
                    </Badge>
                  </div>

                  {/* Your Votes Badge */}
                  {contest.userVoteCount > 0 && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-blue-500 text-white">
                        Your Votes: {contest.userVoteCount}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Contest Name */}
                  <h3 className="font-bold text-lg line-clamp-2">{contest.name}</h3>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="space-y-1">
                      <Trophy className="w-5 h-5 text-yellow-500 mx-auto" />
                      <p className="text-xs text-gray-600">Prize Pool</p>
                      <p className="font-bold text-sm">${contest.prizePool.toLocaleString()}</p>
                    </div>

                    <div className="space-y-1">
                      <Users className="w-5 h-5 text-blue-500 mx-auto" />
                      <p className="text-xs text-gray-600">Models</p>
                      <p className="font-bold text-sm">{contest.participantCount}</p>
                    </div>

                    <div className="space-y-1">
                      <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
                      <p className="text-xs text-gray-600">Total Votes</p>
                      <p className="font-bold text-sm">{contest.totalVotes.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectContest(contest);
                      }}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(contest);
                      }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {contests.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No active contests available</p>
          <p className="text-gray-500 text-sm">Check back soon for new contests!</p>
        </div>
      )}
    </div>
  );
}

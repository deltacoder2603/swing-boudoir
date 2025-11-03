import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, Trophy } from "lucide-react";
import { useVoterProgress } from "@/hooks/api/useVoter";
import { motion } from "framer-motion";

interface VoterMilestonesProps {
  userId: string | undefined;
}

export function VoterMilestones({ userId }: VoterMilestonesProps) {
  const { data: progressData, isLoading } = useVoterProgress(userId || "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading milestones...</p>
        </div>
      </div>
    );
  }

  const { totalVotes = 0, milestones = [], progressToNext } = progressData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Your Milestones</h1>
        <p className="text-muted-foreground">
          Track your voting progress and unlock exclusive rewards
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Current Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Total Votes: {totalVotes}</span>
            <span className="text-muted-foreground">
              Next: {progressToNext?.votesNeeded || 0} more votes
            </span>
          </div>
          <Progress value={progressToNext?.percentComplete || 0} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {(progressToNext?.percentComplete || 0).toFixed(1)}% to {progressToNext?.nextMilestone || 0} votes
          </p>
        </CardContent>
      </Card>

      {/* Milestones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {milestones.map((milestone: any, index: number) => {
          const isUnlocked = milestone.isUnlocked;
          const isCurrent = !isUnlocked && totalVotes < milestone.votesRequired;

          return (
            <motion.div
              key={milestone.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden ${
                isUnlocked 
                  ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300" 
                  : isCurrent 
                  ? "border-blue-300 bg-blue-50" 
                  : "opacity-60"
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{milestone.name}</CardTitle>
                    {isUnlocked ? (
                      <div className="p-2 rounded-full bg-green-500">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-gray-300">
                        <Lock className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <CardDescription>{milestone.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{milestone.votesRequired} votes</span>
                      {isUnlocked && milestone.unlockedAt && (
                        <Badge variant="secondary" className="text-xs">
                          Unlocked!
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    
                    {!isUnlocked && (
                      <>
                        <Progress 
                          value={(totalVotes / milestone.votesRequired) * 100} 
                          className="h-2" 
                        />
                        <p className="text-xs text-muted-foreground">
                          {milestone.votesRequired - totalVotes} votes to go
                        </p>
                      </>
                    )}
                  </div>

                  {/* Reward Preview */}
                  {milestone.reward && (
                    <div className="mt-3 p-3 rounded-lg bg-white/50 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-700 mb-1">Reward:</p>
                      <p className="text-sm">{milestone.reward.name}</p>
                    </div>
                  )}
                </CardContent>

                {/* Decorative element for unlocked milestones */}
                {isUnlocked && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-200/30 to-transparent rounded-bl-full" />
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {milestones.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Milestones Yet</h3>
            <p className="text-muted-foreground text-center">
              Start voting to unlock your first milestone!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


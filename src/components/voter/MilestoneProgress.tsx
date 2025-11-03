import { motion } from "framer-motion";
import { Check, Lock, Trophy, Gift, Image, Video, Phone, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { VoterProgress } from "@/hooks/api/useVoter";

interface MilestoneProgressProps {
  progress: VoterProgress;
}

const MILESTONE_ICONS: Record<number, any> = {
  1: Trophy,
  2: Trophy,
  3: Image,
  4: Video,
  5: Phone,
  6: Package,
};

const MILESTONE_COLORS: Record<number, string> = {
  1: "bg-gray-400",
  2: "bg-blue-500",
  3: "bg-purple-500",
  4: "bg-pink-500",
  5: "bg-orange-500",
  6: "bg-yellow-500",
};

export function MilestoneProgress({ progress }: MilestoneProgressProps) {
  const { totalVotes, milestones = [], progressToNext } = progress;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Your Milestones
        </CardTitle>
        <CardDescription>
          Track your voting progress and unlock exclusive rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Total Votes: {totalVotes}</span>
            <span className="text-gray-600">
              Next: {progressToNext?.votesNeeded || 0} more votes
            </span>
          </div>
          <Progress value={progressToNext?.percentComplete || 0} className="h-3" />
          <p className="text-xs text-gray-600 text-center">
            {(progressToNext?.percentComplete || 0).toFixed(1)}% to {progressToNext?.nextMilestone || 0} votes
          </p>
        </div>

        {/* Milestones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones.map((milestone) => {
            const Icon = MILESTONE_ICONS[milestone.level] || Gift;
            const colorClass = MILESTONE_COLORS[milestone.level] || "bg-gray-400";
            const isUnlocked = milestone.isUnlocked;
            const isCurrent = !isUnlocked && totalVotes < milestone.votesRequired;

            return (
              <motion.div
                key={milestone.level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: milestone.level * 0.1 }}
                className={`relative rounded-lg border-2 p-4 ${
                  isUnlocked
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300"
                    : isCurrent
                    ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                {/* Level Badge */}
                <div className="absolute -top-3 -right-3">
                  <Badge
                    className={`${colorClass} text-white font-bold px-3 py-1`}
                  >
                    Level {milestone.level}
                  </Badge>
                </div>

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-full ${
                    isUnlocked ? colorClass : "bg-gray-300"
                  } flex items-center justify-center mb-3`}
                >
                  {isUnlocked ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <Lock className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* Milestone Info */}
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">{milestone.name}</h3>
                  <p className="text-sm text-gray-600">
                    {milestone.votesRequired} votes required
                  </p>

                  {/* Reward */}
                  <div
                    className={`flex items-center gap-2 p-2 rounded-md ${
                      isUnlocked ? "bg-white" : "bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">{milestone.reward}</span>
                  </div>

                  {/* Status */}
                  {isUnlocked ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Unlocked
                    </div>
                  ) : isCurrent ? (
                    <div className="text-blue-600 text-sm font-medium">
                      {milestone.votesRequired - totalVotes} votes to go
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Locked
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

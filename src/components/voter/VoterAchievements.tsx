import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { VoterStats } from "@/hooks/api/useVoter";

interface VoterAchievementsProps {
  stats: VoterStats | undefined;
}

export function VoterAchievements({ stats }: VoterAchievementsProps) {
  const achievements = stats?.achievements || [];
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Achievements & Badges</h1>
        <p className="text-muted-foreground">
          Unlock unique achievements by voting and participating
        </p>
        <div className="pt-4">
          <Badge variant="secondary" className="text-sm">
            {unlockedCount} / {achievements.length} Unlocked
          </Badge>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`relative aspect-square rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 transition-all ${
              achievement.isUnlocked
                ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-md hover:shadow-lg"
                : "bg-gray-100 border-2 border-gray-200 opacity-60"
            }`}
          >
            {/* Badge Icon */}
            <div
              className={`text-5xl ${
                achievement.isUnlocked ? "animate-bounce-slow" : "grayscale"
              }`}
            >
              {achievement.icon}
            </div>

            {/* Badge Name */}
            <h3 className="font-bold text-sm leading-tight">
              {achievement.name}
            </h3>

            {/* Description - Show on hover */}
            <div className="absolute inset-0 bg-black/90 rounded-xl opacity-0 hover:opacity-100 transition-opacity p-3 flex flex-col items-center justify-center">
              <div className="text-2xl mb-2">{achievement.icon}</div>
              <p className="text-white text-xs font-medium mb-1">
                {achievement.name}
              </p>
              <p className="text-gray-300 text-xs">{achievement.description}</p>
              {achievement.isUnlocked && achievement.unlockedAt && (
                <p className="text-yellow-400 text-xs mt-2">
                  Unlocked!
                </p>
              )}
            </div>

            {/* Lock Overlay */}
            {!achievement.isUnlocked && (
              <div className="absolute top-2 right-2">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Progress Message */}
      {unlockedCount < achievements.length && (
        <div className="mt-6 text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          Keep voting to unlock {achievements.length - unlockedCount} more
          achievement{achievements.length - unlockedCount !== 1 ? "s" : ""}!
        </div>
      )}

      {unlockedCount === achievements.length && achievements.length > 0 && (
        <div className="mt-6 text-center text-sm bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg">
          <span className="text-2xl mb-2 block">🎉</span>
          <p className="font-bold text-lg">All Achievements Unlocked!</p>
          <p className="text-gray-700">You're a legendary voter!</p>
        </div>
      )}

      {/* Empty State */}
      {achievements.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Achievements Yet</h3>
            <p className="text-muted-foreground text-center">
              Start voting to unlock your first achievement!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


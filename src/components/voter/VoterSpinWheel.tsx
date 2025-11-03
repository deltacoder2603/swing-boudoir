import { Card, CardContent } from "@/components/ui/card";
import { SpinWheel } from "./SpinWheel";
import { ActivePrizes } from "./ActivePrizes";
import { SpinHistory } from "./SpinHistory";
import { useSpinWheelRewards } from "@/hooks/api/useVoter";

interface VoterSpinWheelProps {
  userId: string | undefined;
  spinData: any;
}

export function VoterSpinWheel({ userId, spinData }: VoterSpinWheelProps) {
  const { data: rewards, isLoading: rewardsLoading } = useSpinWheelRewards();
  
  if (!userId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Please sign in to spin the wheel</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Prize Wheel</h1>
        <p className="text-muted-foreground">
          Spin once every 24 hours to win amazing prizes!
        </p>
      </div>

      {/* Spin Wheel Component */}
      <SpinWheel profileId={userId} />

      {/* Active Prizes */}
      <ActivePrizes profileId={userId} />

      {/* Spin History */}
      <SpinHistory profileId={userId} />

      {/* Available Prizes Info */}
      {rewards && !rewardsLoading && (
        <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 border-purple-200">
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
              🎁 Available Rewards
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-2 sm:p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-all border border-gray-100"
                >
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2 text-center">{reward.icon}</div>
                  <p className="text-[10px] sm:text-xs font-semibold text-center mb-1 line-clamp-2">
                    {reward.name}
                  </p>
                  <p className="text-[8px] sm:text-[10px] text-muted-foreground text-center line-clamp-2">
                    {reward.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

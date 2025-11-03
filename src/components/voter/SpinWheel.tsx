import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSpinWheel, useSpinWheelRewards, useCanSpinToday, type SpinWheelReward } from "@/hooks/api/useVoter";

interface SpinWheelProps {
  profileId: string;
}

// Colors for wheel segments
const SEGMENT_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
  "#FFEAA7", "#DFE6E9", "#A29BFE", "#FD79A8",
  "#74B9FF", "#A29BFE", "#FD79A8", "#FF6B6B"
];

export function SpinWheel({ profileId }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prizeWon, setPrizeWon] = useState<SpinWheelReward | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const { toast } = useToast();
  
  const { data: rewards, isLoading: rewardsLoading, error: rewardsError } = useSpinWheelRewards();
  const { data: canSpinData, refetch: refetchCanSpin, error: canSpinError } = useCanSpinToday(profileId);
  const spinMutation = useSpinWheel(profileId);
  
  const wheelSegments = rewards?.map((reward, index) => ({
    label: reward.name,
    icon: reward.icon,
    color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
    angle: (360 / (rewards.length || 11)) * index,
  })) || [];

  // Update countdown timer every second
  useEffect(() => {
    if (!canSpinData?.nextSpinAt || canSpinData?.canSpin) {
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const next = new Date(canSpinData.nextSpinAt).getTime();
      const diff = next - now;

      if (diff <= 0) {
        setTimeRemaining("Ready to spin!");
        refetchCanSpin();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [canSpinData?.nextSpinAt, canSpinData?.canSpin, refetchCanSpin]);

  useEffect(() => {
    refetchCanSpin();
  }, [isSpinning, refetchCanSpin]);

  const handleSpin = async () => {
    if (!canSpinData?.canSpin || isSpinning || rewardsLoading) return;

    setIsSpinning(true);
    setPrizeWon(null);

    try {
      const result = await spinMutation.mutateAsync();

      // Calculate target rotation based on prize
      const baseRotation = rotation;
      const spins = 5; // Number of full rotations
      const randomOffset = Math.random() * (360 / wheelSegments.length); // Random position within segment
      const targetRotation = baseRotation + (360 * spins) + randomOffset;

      setRotation(targetRotation);

      // Wait for animation to complete
      setTimeout(() => {
        setPrizeWon(result.reward);
        setIsSpinning(false);

        toast({
          title: "🎉 " + result.reward.icon + " Congratulations!",
          description: result.message,
          duration: 8000,
        });
      }, 4000);
    } catch (error: any) {
      setIsSpinning(false);
      toast({
        title: "Spin Failed",
        description: error.message || "Failed to spin the wheel. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show error if API calls fail
  if (rewardsError) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-500 mb-4">Failed to load rewards. Please check if the server is running.</p>
          <p className="text-sm text-gray-600">Error: {rewardsError.message}</p>
          <p className="text-xs text-gray-500 mt-2">Make sure the API server is running on port 8787</p>
        </CardContent>
      </Card>
    );
  }

  // Show minimal loading only for initial load
  if (rewardsLoading && !rewards) {
    return (
      <Card>
        <CardContent className="p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-sm text-gray-600">Loading prize wheel...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Prize Wheel
        </CardTitle>
        <CardDescription className="text-purple-100">
          {canSpinError ? (
            "Unable to check spin status"
          ) : canSpinData?.hasRetryPrize ? (
            "🎁 Free retry spin available!"
          ) : canSpinData?.canSpin ? (
            "Spin to win amazing prizes!"
          ) : canSpinData?.nextSpinAt ? (
            `Next spin: ${new Date(canSpinData.nextSpinAt).toLocaleTimeString()}`
          ) : (
            "Checking availability..."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
          {/* Wheel Container */}
          <div className="relative w-full max-w-md mx-auto aspect-square">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 -translate-y-3">
              <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[28px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg" />
            </div>

            {/* Wheel */}
            <motion.div
              className="w-full h-full rounded-full relative shadow-2xl border-4 border-white bg-white"
              animate={{ rotate: rotation }}
              transition={{
                duration: 4,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              style={{ 
                overflow: 'hidden',
                isolation: 'isolate',
              }}
            >
              {wheelSegments.map((segment, index) => {
                const segmentAngle = 360 / wheelSegments.length;
                const startAngle = segment.angle;
                const endAngle = segment.angle + segmentAngle;
                
                // Calculate polygon points for segment
                const startRad = (startAngle - 90) * (Math.PI / 180);
                const endRad = (endAngle - 90) * (Math.PI / 180);
                
                return (
                  <div
                    key={index}
                    className="absolute inset-0"
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(startRad)}% ${50 + 50 * Math.sin(startRad)}%, ${50 + 50 * Math.cos(endRad)}% ${50 + 50 * Math.sin(endRad)}%)`,
                      backgroundColor: segment.color,
                    }}
                  >
                    {/* Icon positioned in the segment */}
                    <div
                      className="absolute w-full h-full flex items-center justify-center"
                      style={{
                        transform: `rotate(${startAngle + segmentAngle / 2}deg)`,
                        transformOrigin: 'center',
                      }}
                    >
                      <div 
                        className="absolute flex items-center justify-center"
                        style={{
                          top: '25%',
                          transform: `rotate(90deg)`,
                        }}
                      >
                        <span className="text-3xl filter drop-shadow-lg">
                          {segment.icon}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Center Circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-white shadow-xl flex items-center justify-center z-10">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </motion.div>
          </div>

          {/* Spin Button */}
          <Button
            onClick={handleSpin}
            disabled={!canSpinData?.canSpin || isSpinning}
            size="lg"
            className="w-full max-w-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSpinning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Spinning...
              </>
            ) : canSpinData?.hasRetryPrize ? (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Spin Again (Free)!
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Spin Now!
              </>
            )}
          </Button>

          {/* Prize Display */}
          <AnimatePresence>
            {prizeWon && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="w-full max-w-md px-2"
              >
                <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-5xl mb-3">{prizeWon.icon}</div>
                    <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                    <h3 className="font-bold text-lg mb-2">{prizeWon.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{prizeWon.popupMessage}</p>
                    <p className="text-xs text-gray-500">{prizeWon.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next Spin Timer */}
          {!canSpinData?.canSpin && canSpinData?.nextSpinAt && timeRemaining && (
            <div className="text-center">
              <div className="inline-block px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 shadow-lg">
                <p className="font-semibold text-gray-700 mb-2">⏰ Come back later!</p>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-mono">
                  {timeRemaining}
                </div>
                <p className="text-xs text-gray-500 mt-2">Until next spin</p>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {canSpinError && (
            <div className="text-center text-sm text-red-500">
              <p className="font-medium">Unable to check spin availability</p>
              <p className="text-xs mt-1">Please make sure the server is running</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

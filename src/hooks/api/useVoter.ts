import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface VoterStats {
  totalVotes: number;
  freeVotes: number;
  paidVotes: number;
  contestsVotedIn: number;
  favoriteModels: Array<{
    profileId: string;
    modelName: string;
    voteCount: number;
    avatarUrl: string | null;
  }>;
  currentMilestone: {
    level: number;
    name: string;
    votesRequired: number;
    isUnlocked: boolean;
  } | null;
  nextMilestone: {
    level: number;
    name: string;
    votesRequired: number;
    votesRemaining: number;
    progress: number;
  } | null;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string | null;
    isUnlocked: boolean;
  }>;
  unlockedRewards: Array<{
    id: string;
    name: string;
    description: string;
    type: "PHOTO" | "VIDEO" | "AUDIO" | "CALL" | "MERCH";
    unlockedAt: string;
    accessUrl: string | null;
    accessCode: string | null;
  }>;
  activeBadges?: Array<{
    id: string;
    type: string;
    createdAt: string;
  }>;
  spinWheelData: {
    availableSpins: number;
    lastSpinAt: string | null;
    totalSpins: number;
  };
}

export interface VoterContest {
  id: string;
  name: string;
  slug: string;
  prizePool: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  images: Array<{
    url: string;
    caption: string | null;
  }>;
  participantCount: number;
  totalVotes: number;
  userVoteCount: number;
}

export interface ContestParticipant {
  profileId: string;
  contestParticipationId: string;
  modelName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  totalVotes: number;
  rank: number;
  userVoteCount: number;
  joinedAt: string;
}

export interface VoterProgress {
  totalVotes: number;
  milestones: Array<{
    level: number;
    name: string;
    votesRequired: number;
    reward: string;
    isUnlocked: boolean;
    unlockedAt: string | null;
  }>;
  progressToNext: {
    currentVotes: number;
    nextMilestone: number;
    votesNeeded: number;
    percentComplete: number;
  };
  votingHistory: Array<{
    date: string;
    voteCount: number;
    contestName: string;
  }>;
}

export interface SpinWheelReward {
  id: string;
  name: string;
  description: string;
  icon: string;
  probability: number;
  popupMessage: string;
  rewardType: string;
  rewardValue: number | null;
  isActive: boolean;
  sortOrder: number;
}

export interface SpinResult {
  reward: SpinWheelReward;
  prizeId?: string;
  message: string;
}

export interface CanSpinResponse {
  canSpin: boolean;
  nextSpinAt: string | null;
  hasRetryPrize?: boolean;
  retryPrizeId?: string;
}

/**
 * Get available spin wheel rewards
 */
export function useSpinWheelRewards() {
  return useQuery({
    queryKey: ["spin-wheel-rewards"],
    queryFn: async () => {
      const response = await api.get<{ rewards: SpinWheelReward[] }>("/spin-wheel/rewards");
      if (response.success) {
        return response.data.rewards;
      }
      throw new Error(response.error || "Failed to fetch rewards");
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Check if user can spin today
 */
export function useCanSpinToday(profileId: string | undefined) {
  return useQuery({
    queryKey: ["can-spin", profileId],
    queryFn: async () => {
      if (!profileId) throw new Error("Profile ID required");
      const response = await api.get<CanSpinResponse>(`/spin-wheel/can-spin/${profileId}`);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || "Failed to check spin availability");
    },
    enabled: !!profileId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get voter statistics
 */
export function useVoterStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["voter-stats", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      const response = await api.get<VoterStats>(`/voter/${userId}/stats`);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || "Failed to fetch voter stats");
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Get available contests for voting
 */
export function useAvailableContests(userId: string | undefined) {
  return useQuery({
    queryKey: ["voter-contests", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      const response = await api.get<{ contests: VoterContest[] }>(`/voter/${userId}/contests`);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || "Failed to fetch available contests");
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get contest participants
 */
export function useContestParticipants(
  contestId: string | undefined,
  userId?: string,
  sortBy: "votes" | "recent" | "name" = "votes"
) {
  return useQuery({
    queryKey: ["contest-participants", contestId, userId, sortBy],
    queryFn: async () => {
      if (!contestId) throw new Error("Contest ID required");
      const params = new URLSearchParams({ sortBy });
      if (userId) params.append("userId", userId);
      const response = await api.get<{ participants: ContestParticipant[] }>(
        `/voter/contest/${contestId}/participants?${params.toString()}`
      );
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || "Failed to fetch contest participants");
    },
    enabled: !!contestId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get voter progress
 */
export function useVoterProgress(userId: string | undefined) {
  return useQuery({
    queryKey: ["voter-progress", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      const response = await api.get<VoterProgress>(`/voter/${userId}/progress`);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || "Failed to fetch voter progress");
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Spin the wheel
 */
export function useSpinWheel(profileId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("Profile ID required");
      const response = await api.post<SpinResult>("/spin-wheel/spin", {
        profileId,
      });
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || "Failed to spin wheel");
    },
    onSuccess: () => {
      // Invalidate relevant queries after spinning
      queryClient.invalidateQueries({ queryKey: ["voter-stats", profileId] });
      queryClient.invalidateQueries({ queryKey: ["voter-progress", profileId] });
      queryClient.invalidateQueries({ queryKey: ["can-spin", profileId] });
      queryClient.invalidateQueries({ queryKey: ["available-votes"] });
      queryClient.invalidateQueries({ queryKey: ["spin-wheel-prizes", profileId] });
      queryClient.invalidateQueries({ queryKey: ["spin-wheel-history", profileId] });
    },
  });
}

/**
 * Get active prizes for a user
 */
export interface ActivePrize {
  id: string;
  prizeType: string;
  prizeValue: number | null;
  isActive: boolean;
  isClaimed: boolean;
  claimedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function useActivePrizes(profileId: string | undefined, includeExpired: boolean = false) {
  return useQuery({
    queryKey: ["spin-wheel-prizes", profileId, includeExpired],
    queryFn: async () => {
      if (!profileId) throw new Error("Profile ID required");
      const response = await api.get<{ prizes: ActivePrize[] }>(
        `/spin-wheel/prizes/${profileId}?includeExpired=${includeExpired}`
      );
      if (response.success) {
        return response.data.prizes;
      }
      throw new Error(response.error || "Failed to fetch active prizes");
    },
    enabled: !!profileId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get spin history for a user
 */
export interface SpinHistoryItem {
  id: string;
  rewardName: string;
  rewardType: string;
  spunAt: string;
}

export function useSpinHistory(profileId: string | undefined, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["spin-wheel-history", profileId, page, limit],
    queryFn: async () => {
      if (!profileId) throw new Error("Profile ID required");
      const response = await api.get<{ data: SpinHistoryItem[]; pagination: any }>(
        `/spin-wheel/history/${profileId}?page=${page}&limit=${limit}`
      );
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || "Failed to fetch spin history");
    },
    enabled: !!profileId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Claim a prize
 */
export function useClaimPrize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prizeId: string) => {
      const response = await api.post<{ success: boolean; message: string }>("/spin-wheel/claim", {
        prizeId,
      });
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || "Failed to claim prize");
    },
    onSuccess: (_, prizeId) => {
      // Invalidate prizes queries
      queryClient.invalidateQueries({ queryKey: ["spin-wheel-prizes"] });
    },
  });
}

/**
 * Use a multiplier token
 */
export function useMultiplierToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tokenId, profileId }: { tokenId: string; profileId: string }) => {
      const response = await api.post<{ success: boolean; message: string; multiplier: number }>(
        "/spin-wheel/use-token",
        { tokenId, profileId }
      );
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || "Failed to use multiplier token");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spin-wheel-prizes"] });
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ReferralStats,
  ReferralLeaderboardEntry,
  MilestoneProgress,
  Milestone,
  Achievement,
  UnlockProgress,
  UnlockedContent,
  VoterLeaderboardEntry,
} from "@/types/gamification.types";

// Referral Hooks
export function useReferralStats(userId: string | undefined) {
  return useQuery<ReferralStats>({
    queryKey: ["referral-stats", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      const response = await api.get(`/referrals/${userId}/stats`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30000, // Consider data stale after 30 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
  });
}

export function useGenerateReferralCode(userId: string | undefined) {
  return useQuery<{ referralCode: string; referralLink: string }>({
    queryKey: ["referral-code", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      const response = await api.post(`/referrals/${userId}/code`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 300000, // Consider data stale after 5 minutes
    cacheTime: 600000, // Keep in cache for 10 minutes
  });
}

export function useGenerateSocialSharingUrls(userId: string | undefined, customMessage?: string, platform?: string) {
  return useQuery<{
    referralCode: string;
    referralLink: string;
    sharingUrls: {
      twitter?: string;
      facebook?: string;
      instagram?: string;
      whatsapp?: string;
      telegram?: string;
      linkedin?: string;
      email?: string;
    };
    defaultMessage: string;
  }>({
    queryKey: ["social-sharing-urls", userId, customMessage, platform],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      const response = await api.post(`/referrals/${userId}/social-sharing`, {
        customMessage,
        platform,
      });
      return response.data;
    },
    enabled: !!userId,
    staleTime: 300000, // Consider data stale after 5 minutes
    cacheTime: 600000, // Keep in cache for 10 minutes
  });
}

export function useReferralLeaderboard(page = 1, limit = 20) {
  return useQuery<{ data: ReferralLeaderboardEntry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ["referral-leaderboard", page, limit],
    queryFn: async () => {
      const response = await api.get(`/referrals/leaderboard?page=${page}&limit=${limit}`);
      return response.data;
    },
  });
}

// Milestone Hooks
export function useMilestoneProgress(profileId: string | undefined) {
  return useQuery<MilestoneProgress>({
    queryKey: ["milestone-progress", profileId],
    queryFn: async () => {
      if (!profileId) throw new Error("Profile ID required");
      const response = await api.get(`/milestones/${profileId}/progress`);
      // API client wraps response in { success: true, data: ... }
      return response.data;
    },
    enabled: !!profileId,
  });
}

export function useProfileMilestones(profileId: string | undefined, page = 1, limit = 20) {
  return useQuery<{ data: Milestone[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ["profile-milestones", profileId, page, limit],
    queryFn: async () => {
      if (!profileId) throw new Error("Profile ID required");
      const response = await api.get(`/milestones/${profileId}?page=${page}&limit=${limit}`);
      return response.data;
    },
    enabled: !!profileId,
  });
}

// Achievement Hooks
export function useProfileAchievements(profileId: string | undefined, page = 1, limit = 20, category?: string) {
  return useQuery<{ data: Achievement[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ["profile-achievements", profileId, page, limit, category],
    queryFn: async () => {
      if (!profileId) throw new Error("Profile ID required");
      const categoryParam = category ? `&category=${category}` : "";
      const response = await api.get(`/achievements/${profileId}?page=${page}&limit=${limit}${categoryParam}`);
      return response.data;
    },
    enabled: !!profileId,
  });
}

export function useAllAchievements(page = 1, limit = 50) {
  return useQuery<{ data: Achievement[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ["all-achievements", page, limit],
    queryFn: async () => {
      const response = await api.get(`/achievements?page=${page}&limit=${limit}`);
      return response.data;
    },
  });
}

// Unlock Hooks
export function useUnlockProgress(profileId: string | undefined) {
  return useQuery<UnlockProgress>({
    queryKey: ["unlock-progress", profileId],
    queryFn: async () => {
      if (!profileId) throw new Error("Profile ID required");
      const response = await api.get(`/unlocks/${profileId}/progress`);
      return response.data;
    },
    enabled: !!profileId,
  });
}

export function useProfileUnlocks(profileId: string | undefined, page = 1, limit = 20) {
  return useQuery<{ data: UnlockedContent[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ["profile-unlocks", profileId, page, limit],
    queryFn: async () => {
      if (!profileId) throw new Error("Profile ID required");
      const response = await api.get(`/unlocks/${profileId}?page=${page}&limit=${limit}`);
      return response.data;
    },
    enabled: !!profileId,
  });
}

// Voter Leaderboard Hook
export function useVoterLeaderboard(profileId: string | undefined, page = 1, limit = 20) {
  return useQuery<{ data: VoterLeaderboardEntry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ["voter-leaderboard", profileId, page, limit],
    queryFn: async () => {
      if (!profileId) throw new Error("Profile ID required");
      const response = await api.get(`/votes/${profileId}/voter-leaderboard?page=${page}&limit=${limit}`);
      return response.data;
    },
    enabled: !!profileId,
  });
}


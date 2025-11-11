import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
      const response = await api.get<ReferralStats>(`/referrals/${userId}/stats`);
      if (response.success !== true) {
        throw new Error(response.error || "Failed to load referral stats");
      }
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30000, // Consider data stale after 30 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
  });
}

export function useGenerateReferralCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!userId) throw new Error("User ID required");
      const response = await api.post<{ referralCode: string; referralLink: string }>(`/referrals/${userId}/code`);
      if (response.success !== true) {
        throw new Error(response.error || "Failed to generate referral code");
      }
      return response.data;
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ["referral-stats", userId] });
    },
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
      const response = await api.post<{
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
      }>(`/referrals/${userId}/social-sharing`, {
        customMessage,
        platform,
      });
      if (response.success !== true) {
        throw new Error(response.error || "Failed to generate sharing URLs");
      }
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
      const response = await api.get<{ data: ReferralLeaderboardEntry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/referrals/leaderboard?page=${page}&limit=${limit}`);
      if (response.success !== true) {
        throw new Error(response.error || "Failed to load referral leaderboard");
      }
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
      const response = await api.get<MilestoneProgress>(`/milestones/${profileId}/progress`);
      if (response.success !== true) {
        throw new Error(response.error || "Failed to load milestone progress");
      }
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
      const response = await api.get<{ data: Milestone[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/milestones/${profileId}?page=${page}&limit=${limit}`);
      if (response.success !== true) {
        throw new Error(response.error || "Failed to load milestones");
      }
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
      const response = await api.get<{ data: Achievement[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/achievements/${profileId}?page=${page}&limit=${limit}${categoryParam}`);
      if (response.success !== true) {
        throw new Error(response.error || "Failed to load profile achievements");
      }
      return response.data;
    },
    enabled: !!profileId,
  });
}

export function useAllAchievements(page = 1, limit = 50) {
  return useQuery<{ data: Achievement[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ["all-achievements", page, limit],
    queryFn: async () => {
      const response = await api.get<{ data: Achievement[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/achievements?page=${page}&limit=${limit}`);
      if (response.success !== true) {
        throw new Error(response.error || "Failed to load achievements");
      }
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
      const response = await api.get<UnlockProgress>(`/unlocks/${profileId}/progress`);
      if (response.success !== true) {
        throw new Error(response.error || "Failed to load unlock progress");
      }
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
      const response = await api.get<{ data: UnlockedContent[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/unlocks/${profileId}?page=${page}&limit=${limit}`);
      if (response.success !== true) {
        throw new Error(response.error || "Failed to load unlocks");
      }
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
      const response = await api.get<{ data: VoterLeaderboardEntry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/votes/${profileId}/voter-leaderboard?page=${page}&limit=${limit}`);
      if (response.success !== true) {
        throw new Error(response.error || "Failed to load voter leaderboard");
      }
      return response.data;
    },
    enabled: !!profileId,
  });
}


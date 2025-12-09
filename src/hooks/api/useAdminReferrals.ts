import { useQuery } from "@tanstack/react-query";
import { api, extractApiError, isApiSuccess } from "@/lib/api";

const ADMIN_REFERRALS_ENDPOINTS = {
  stats: () => "/api/v1/admin/referrals/stats",
} as const;

export interface ReferralStats {
  userId: string;
  userName: string | null;
  referralCode: string | null;
  referralLink: string | null;
  totalReferrals: number;
  currentTier: {
    count: number;
    name: string;
    reward: string;
  } | null;
  nextTier: {
    count: number;
    name: string;
    reward: string;
  } | null;
}

export const useAdminReferralStats = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["admin", "referrals", "stats", page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await api.get<{ data: ReferralStats[]; pagination: any }>(
        `${ADMIN_REFERRALS_ENDPOINTS.stats()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};


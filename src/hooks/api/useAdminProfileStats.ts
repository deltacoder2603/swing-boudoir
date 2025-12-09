import { useMutation } from "@tanstack/react-query";
import { api, extractApiError, isApiSuccess } from "@/lib/api";
import { toast } from "sonner";

const ADMIN_PROFILE_STATS_ENDPOINTS = {
  recalculateAll: () => "/api/v1/admin/profile-stats/recalculate-all",
  recalculateById: (profileId: string) => `/api/v1/admin/profile-stats/recalculate/${profileId}`,
} as const;

export const useRecalculateAllProfileStats = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post(ADMIN_PROFILE_STATS_ENDPOINTS.recalculateAll());
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("All profile stats recalculated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to recalculate profile stats");
    },
  });
};

export const useRecalculateProfileStatsById = () => {
  return useMutation({
    mutationFn: async (profileId: string) => {
      const response = await api.post(ADMIN_PROFILE_STATS_ENDPOINTS.recalculateById(profileId));
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Profile stats recalculated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to recalculate profile stats");
    },
  });
};


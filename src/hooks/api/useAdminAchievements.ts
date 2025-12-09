import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError, isApiSuccess } from "@/lib/api";
import { toast } from "sonner";

const ADMIN_ACHIEVEMENTS_ENDPOINTS = {
  achievements: () => "/api/v1/admin/achievements",
  achievement: (id: string) => `/api/v1/admin/achievements/${id}`,
  profileAchievements: () => "/api/v1/admin/achievements/profile-achievements",
} as const;

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  badgeImage: string | null;
  category: string;
  requirement: number | null;
  tier: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export interface CreateAchievementRequest {
  code: string;
  name: string;
  description: string;
  icon: string;
  badgeImage?: string;
  category: string;
  requirement?: number;
  tier: string;
}

export interface ProfileAchievement {
  id: string;
  profileId: string;
  profileName: string | null;
  achievementId: string;
  achievementName: string;
  unlockedAt: string;
  progress: number;
}

export const useAdminAchievements = (page = 1, limit = 20, filters?: { category?: string; tier?: string }) => {
  return useQuery({
    queryKey: ["admin", "achievements", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.tier && { tier: filters.tier }),
      });
      const response = await api.get<{ data: Achievement[]; pagination: any }>(
        `${ADMIN_ACHIEVEMENTS_ENDPOINTS.achievements()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};

export const useCreateAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAchievementRequest) => {
      const response = await api.post<Achievement>(ADMIN_ACHIEVEMENTS_ENDPOINTS.achievements(), data);
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "achievements"] });
      toast.success("Achievement created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create achievement");
    },
  });
};

export const useUpdateAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAchievementRequest> }) => {
      const response = await api.patch<Achievement>(ADMIN_ACHIEVEMENTS_ENDPOINTS.achievement(id), data);
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "achievements"] });
      toast.success("Achievement updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update achievement");
    },
  });
};

export const useDeleteAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(ADMIN_ACHIEVEMENTS_ENDPOINTS.achievement(id));
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "achievements"] });
      toast.success("Achievement deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete achievement");
    },
  });
};

export const useAdminProfileAchievements = (page = 1, limit = 20, filters?: { profileId?: string; achievementId?: string }) => {
  return useQuery({
    queryKey: ["admin", "profile-achievements", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.profileId && { profileId: filters.profileId }),
        ...(filters?.achievementId && { achievementId: filters.achievementId }),
      });
      const response = await api.get<{ data: ProfileAchievement[]; pagination: any }>(
        `${ADMIN_ACHIEVEMENTS_ENDPOINTS.profileAchievements()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};


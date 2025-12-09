import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError, isApiSuccess } from "@/lib/api";
import { toast } from "sonner";

const ADMIN_UNLOCKS_ENDPOINTS = {
  unlocks: () => "/api/v1/admin/unlocks",
  unlock: (id: string) => `/api/v1/admin/unlocks/${id}`,
} as const;

export interface Unlock {
  id: string;
  contentType: string;
  title: string;
  description: string | null;
  contentUrl: string | null;
  voteThreshold: number;
  unlockedAt: string;
  isActive: boolean;
}

export interface CreateUnlockRequest {
  profileId: string;
  contentType: string;
  title: string;
  description?: string;
  contentUrl?: string;
  mediaId?: string;
  voteThreshold: number;
  isActive?: boolean;
}

export const useAdminUnlocks = (page = 1, limit = 20, filters?: { profileId?: string; contentType?: string }) => {
  return useQuery({
    queryKey: ["admin", "unlocks", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.profileId && { profileId: filters.profileId }),
        ...(filters?.contentType && { contentType: filters.contentType }),
      });
      const response = await api.get<{ data: Unlock[]; pagination: any }>(
        `${ADMIN_UNLOCKS_ENDPOINTS.unlocks()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};

export const useCreateUnlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUnlockRequest) => {
      const response = await api.post<Unlock>(ADMIN_UNLOCKS_ENDPOINTS.unlocks(), data);
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "unlocks"] });
      toast.success("Unlock created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create unlock");
    },
  });
};

export const useDeleteUnlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(ADMIN_UNLOCKS_ENDPOINTS.unlock(id));
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "unlocks"] });
      toast.success("Unlock deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete unlock");
    },
  });
};


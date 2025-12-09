import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError, isApiSuccess } from "@/lib/api";
import { toast } from "sonner";

const ADMIN_FAVORITES_ENDPOINTS = {
  favorites: () => "/api/v1/admin/favorites",
  favorite: (voterId: string, modelId: string) => `/api/v1/admin/favorites/${voterId}/${modelId}`,
} as const;

export interface Favorite {
  id: string;
  voterId: string;
  voterName: string | null;
  modelId: string;
  modelName: string | null;
  createdAt: string;
}

export const useAdminFavorites = (page = 1, limit = 20, filters?: { voterId?: string; modelId?: string }) => {
  return useQuery({
    queryKey: ["admin", "favorites", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.voterId && { voterId: filters.voterId }),
        ...(filters?.modelId && { modelId: filters.modelId }),
      });
      const response = await api.get<{ data: Favorite[]; pagination: any }>(
        `${ADMIN_FAVORITES_ENDPOINTS.favorites()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};

export const useDeleteFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ voterId, modelId }: { voterId: string; modelId: string }) => {
      const response = await api.delete(ADMIN_FAVORITES_ENDPOINTS.favorite(voterId, modelId));
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "favorites"] });
      toast.success("Favorite deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete favorite");
    },
  });
};


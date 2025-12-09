import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError, isApiSuccess } from "@/lib/api";
import { toast } from "sonner";

const ADMIN_MEDIA_ENDPOINTS = {
  media: () => "/api/v1/admin/media",
  mediaItem: (id: string) => `/api/v1/admin/media/${id}`,
} as const;

export interface Media {
  id: string;
  key: string;
  name: string;
  url: string;
  size: number | null;
  caption: string | null;
  type: string | null;
  status: string;
  mediaType: string;
  createdAt: string;
  updatedAt: string;
}

export const useAdminMedia = (page = 1, limit = 20, filters?: { mediaType?: string; status?: string }) => {
  return useQuery({
    queryKey: ["admin", "media", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.mediaType && { mediaType: filters.mediaType }),
        ...(filters?.status && { status: filters.status }),
      });
      const response = await api.get<{ data: Media[]; pagination: any }>(
        `${ADMIN_MEDIA_ENDPOINTS.media()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(ADMIN_MEDIA_ENDPOINTS.mediaItem(id));
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      toast.success("Media deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete media");
    },
  });
};


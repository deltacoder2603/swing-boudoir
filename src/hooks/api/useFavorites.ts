import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError, isApiSuccess } from "@/lib/api";

// Helper function to extract error message
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getErrorMessage = (response: any): string => {
  const errorData = extractApiError(response);
  return typeof errorData === 'string' ? errorData : errorData?.error || "An unknown error occurred";
};

export interface FavoriteModel {
  id: string;
  modelId: string;
  modelName: string;
  modelImage: string | null;
  modelBio: string | null;
  location: string | null;
  totalVotes: number;
  activeContests: number;
  createdAt: string;
}

export interface FavoritesResponse {
  favorites: FavoriteModel[];
}

export interface CheckFavoriteResponse {
  isFavorite: boolean;
  favoriteId: string | null;
}

// Get favorites for a voter
export function useFavorites(voterId: string | undefined) {
  return useQuery({
    queryKey: ["favorites", voterId],
    queryFn: async (): Promise<FavoritesResponse> => {
      if (!voterId) throw new Error("Voter ID is required");
      
      const response = await api.get<FavoritesResponse>(`/favorites/${voterId}`);
      
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
    enabled: !!voterId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Check if a model is favorited
export function useCheckFavorite(voterId: string | undefined, modelId: string | undefined) {
  return useQuery({
    queryKey: ["favorite-check", voterId, modelId],
    queryFn: async (): Promise<CheckFavoriteResponse> => {
      if (!voterId || !modelId) throw new Error("Voter ID and Model ID are required");
      
      const response = await api.get<CheckFavoriteResponse>(`/favorites/check/${voterId}/${modelId}`);
      
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
    enabled: !!voterId && !!modelId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Add a model to favorites
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ voterId, modelId }: { voterId: string; modelId: string }) => {
      const response = await api.post("/favorites", { voterId, modelId });
      
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate favorites list
      queryClient.invalidateQueries({ queryKey: ["favorites", variables.voterId] });
      // Invalidate favorite check for this specific model
      queryClient.invalidateQueries({ queryKey: ["favorite-check", variables.voterId, variables.modelId] });
    },
  });
}

// Remove a model from favorites
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ voterId, modelId }: { voterId: string; modelId: string }) => {
      const response = await api.delete(`/favorites/${voterId}/${modelId}`);
      
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate favorites list
      queryClient.invalidateQueries({ queryKey: ["favorites", variables.voterId] });
      // Invalidate favorite check for this specific model
      queryClient.invalidateQueries({ queryKey: ["favorite-check", variables.voterId, variables.modelId] });
    },
  });
}


import { api, isApiSuccess } from '@/lib/api';
import type { ProfileSelectSchemaType } from '@/lib/validations/profile.schema';
import { ProfileInsertSchema } from '@/lib/validations/profile.schema';
import { ContestParticipation, User_Type } from '@/types';
import { Profile, ProfileStats } from '@/types/profile.types';
import { QueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import z from 'zod';
import { PaginatedResponse } from '@/types/common.types';

export interface CreateProfileRequest {
  userId: string;
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  address: string;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  hobbiesAndPassions?: string | null;
  paidVoterMessage?: string | null;
  freeVoterMessage?: string | null;
  lastFreeVoteAt?: string | null;
  coverImageId?: string | null;
}

export interface UpdateProfileRequest {
  userId?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  address?: string;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  hobbiesAndPassions?: string | null;
  paidVoterMessage?: string | null;
  freeVoterMessage?: string | null;
  lastFreeVoteAt?: string | null;
  coverImageId?: string | null;
  user?: {
    displayUsername?: string | null;
    username?: string | null;
    name?: string | null;
  } | null;
}

// Query keys for React Query
export const profileKeys = {
  all: ['profile'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (filters: { page?: number; limit?: number }) => [...profileKeys.lists(), filters] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  byUserId: (userId: string) => [...profileKeys.details(), 'user', userId] as const,
  byUsername: (username: string) => [...profileKeys.details(), 'username', username] as const,
  stats: () => [...profileKeys.all, 'stats'] as const,
  statsByProfileId: (profileId: string) => [...profileKeys.stats(), profileId] as const,
  activeParticipation: () => [...profileKeys.all, 'active-participation'] as const,
  activeParticipationByProfileId: (profileId: string) => [...profileKeys.activeParticipation(), profileId] as const,
};

// Profile API functions
export const profileApi = {
  // Get all profiles with pagination
  getProfiles: async (
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Profile>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await api.get(`/api/v1/profile?${searchParams.toString()}`);
    return response.data;
  },

  // Get profile by ID
  getProfile: async (id: string): Promise<Profile> => {
    const response = await api.get(`/api/v1/profile/${id}`);
    return response.data;
  },

  // Get profile by user ID
  getProfileByUserId: async (userId: string): Promise<Profile> => {
    const response = await api.get(`/api/v1/profile/user/${userId}`);
    return response.data;
  },

  // Get profile by username
  getProfileByUsername: async (username: string): Promise<Profile | null> => {
    try {
      const response = await api.get<Profile>(`/api/v1/profile/username/${username}`);
      if (!isApiSuccess(response)) {
        console.error("API returned error for username:", username, response);
        return null;
      }
      return response.data;
    } catch (error) {
      console.error("Exception in getProfileByUsername for username:", username, error);
      return null;
    }
  },

  // Create profile

  createProfile: async (
    data: z.infer<typeof ProfileInsertSchema>
  ): Promise<ProfileSelectSchemaType> => {
    const response = await api.post('/api/v1/profile', data);
    return response.data;
  },

  // Update profile
  updateProfile: async (id: string, data: UpdateProfileRequest): Promise<Profile> => {
    const response = await api.patch(`/api/v1/profile/${id}`, data);
    return response.data;
  },

  // Delete profile
  deleteProfile: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/v1/profile/${id}`);
    return response.data;
  },

  // Upload cover image
  uploadCoverImage: async (id: string, file: File): Promise<Profile> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/api/v1/profile/${id}/upload/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Upload banner image
  uploadBannerImage: async (id: string, file: File): Promise<Profile> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/api/v1/profile/${id}/upload/banner`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Upload profile photos
  uploadProfilePhotos: async (id: string, files: File[]): Promise<Profile> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post(`/api/v1/profile/${id}/upload/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Remove profile photo
  removeProfilePhoto: async (id: string, imageId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/v1/profile/${id}/images/${imageId}`);
    return response.data;
  },

  // Remove cover image
  removeCoverImage: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/v1/profile/${id}/cover`);
    return response.data;
  },

  // Get profile statistics
  getProfileStats: async (profileId: string): Promise<ProfileStats> => {
    const response = await api.get(`/api/v1/profile/${profileId}/stats`);
    return response.data;
  },

  // Get active participation by profile ID
  getActiveParticipation: async (
    profileId: string,
    params: { search?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<ContestParticipation>> => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await api.get(`/api/v1/profile/${profileId}/active-participation?${searchParams.toString()}`);
    return response.data;
  },
};

// Main useProfile hook
export const useProfile = () => {
  const queryClient = useQueryClient();

  // Profile queries
  const useProfileList = (params: { page?: number; limit?: number } = {}) => {
    return useQuery({
      queryKey: profileKeys.list(params),
      queryFn: () => profileApi.getProfiles(params),
    });
  };

  const useProfile = (id: string) => {
    return useQuery({
      queryKey: profileKeys.detail(id),
      queryFn: () => profileApi.getProfile(id),
      enabled: !!id,
    });
  };

  const useProfileByUserId = (userId: string) => {
    return useQuery({
      queryKey: profileKeys.byUserId(userId),
      queryFn: () => profileApi.getProfileByUserId(userId),
      enabled: !!userId,
    });
  };

  const useProfileByUsername = (username: string, options?: QueryOptions<Profile>) => {
    return useQuery({
      ...options,
      queryKey: profileKeys.byUsername(username),
      queryFn: () => profileApi.getProfileByUsername(username),
      enabled: !!username,
    });
  };

  const useProfileStats = (profileId: string) => {
    return useQuery({
      queryKey: profileKeys.statsByProfileId(profileId),
      queryFn: () => profileApi.getProfileStats(profileId),
      enabled: !!profileId,
    });
  };

  const useActiveParticipation = (
    profileId: string,
    params: { search?: string; page?: number; limit?: number } = {}
  ) => {
    return useQuery({
      queryKey: profileKeys.activeParticipationByProfileId(profileId),
      queryFn: () => profileApi.getActiveParticipation(profileId, params),
      enabled: !!profileId,
    });
  };

  // Profile mutations
  const createProfile = useMutation({
    mutationFn: profileApi.createProfile,
    onSuccess: (data) => {
      console.log("Profile created successfully:", data);
      
      // Invalidate all profile-related queries
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(data?.id) });
      
      // Invalidate user-specific queries if data is available
      if (data?.userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.byUserId(data.userId) });
      }
      
      // Remove and invalidate all username queries - this will catch any username-based queries
      console.log("Removing and invalidating username queries...");
      
      // First, let's see what queries are currently cached
      const cachedQueries = queryClient.getQueryCache().getAll();
      console.log("Current cached queries:", cachedQueries.map(q => q.queryKey));
      
      // Remove all username queries
      queryClient.removeQueries({ 
        queryKey: ["profile", "detail", "username"],
        exact: false 
      });
      
      // Also try removing with a more specific pattern
      queryClient.removeQueries({ 
        queryKey: ["profile"],
        exact: false,
        predicate: (query) => {
          return query.queryKey.includes("username");
        }
      });
      
      // Try removing queries that match the exact pattern we're seeing
      queryClient.removeQueries({ 
        queryKey: ["profile", "detail", "username"],
        exact: false 
      });
      
      // Also try removing any query that has "username" in it
      queryClient.removeQueries({ 
        predicate: (query) => {
          return query.queryKey.some(key => 
            typeof key === 'string' && key.includes('username')
          );
        }
      });
      
      // Invalidate all username queries
      queryClient.invalidateQueries({ 
        queryKey: ["profile", "detail", "username"],
        exact: false 
      });
      
      console.log("Username queries removed and invalidated");
      
      // Also invalidate all profile detail queries to be extra sure
      console.log("Invalidating all profile detail queries...");
      queryClient.invalidateQueries({ 
        queryKey: ["profile", "detail"],
        exact: false 
        
      });
      
      // Invalidate all stats queries
      queryClient.invalidateQueries({ queryKey: profileKeys.stats() });
      
      // Invalidate session query to refresh user data with new profileId
      queryClient.invalidateQueries({ queryKey: ['session'] });
      
      // Also invalidate all profile queries as a fallback
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      
      // Force refetch all profile queries to ensure fresh data
      console.log("Force refetching all profile queries...");
      queryClient.refetchQueries({ 
        queryKey: ["profile"],
        exact: false 
      });
    },
  });

  const updateProfile = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProfileRequest }) =>
      profileApi.updateProfile(id, data),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      
      // Invalidate user-specific queries if userId is available
      if (data.userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.byUserId(data.userId) });
      }
      // Invalidate all username queries - use a more specific pattern
      queryClient.invalidateQueries({ 
        queryKey: ["profile", "detail", "username"],
        exact: false 
      });
      
      // Invalidate session query if user data might have changed
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  const deleteProfile = useMutation({
    mutationFn: profileApi.deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });

  const uploadCoverImage = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => profileApi.uploadCoverImage(id, file),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(data.id) });
    },
  });

  const uploadBannerImage = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      profileApi.uploadBannerImage(id, file),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(data.id) });
    },
  });

  const uploadProfilePhotos = useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) =>
      profileApi.uploadProfilePhotos(id, files),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(data.id) });
    },
  });

  const removeProfilePhoto = useMutation({
    mutationFn: ({ id, imageId }: { id: string; imageId: string }) =>
      profileApi.removeProfilePhoto(id, imageId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.id) });
    },
  });

  const removeCoverImage = useMutation({
    mutationFn: ({ id }: { id: string }) => profileApi.removeCoverImage(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.id) });
    },
  });

  return {
    // Profile queries
    useProfileList,
    useProfile,
    useProfileByUserId,
    useProfileByUsername,
    useProfileStats,
    useActiveParticipation,

    // Profile mutations
    createProfile,
    updateProfile,
    deleteProfile,
    uploadCoverImage,
    uploadBannerImage,
    uploadProfilePhotos,
    removeProfilePhoto,
    removeCoverImage,
  };
};
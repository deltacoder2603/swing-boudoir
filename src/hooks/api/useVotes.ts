import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError, isApiSuccess } from "@/lib/api";
import {
  Vote,
  FreeVoteRequest,
  PaidVoteRequest,
  FreeVoteAvailabilityRequest,
  FreeVoteAvailabilityResponse,
  LatestVotesResponse,
  ProfileVotesResponse,
  TopVoter,
  VoteMultiplierPeriod,
  CreateVoteMultiplierRequest,
  UpdateVoteMultiplierRequest,
  AdminVotesResponse,
  VotesAnalyticsResponse,
} from "@/types/votes.types";
import { toast } from "sonner";

// Helper function to extract error message from API response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getErrorMessage = (response: any): string => {
  const errorData = extractApiError(response);
  return typeof errorData === 'string' ? errorData : errorData?.error || "An unknown error occurred";
};

// API endpoint functions for dynamic parameters
const VOTES_ENDPOINTS = {
  freeVote: () => "/api/v1/contest/vote/free",
  paidVote: () => "/api/v1/contest/vote/pay",
  checkFreeVoteAvailability: () => "/api/v1/votes/is-free-vote-available",
  latestVotes: () => "/api/v1/votes/latest-votes",
  profileVotes: (profileId: string) => `/api/v1/votes/${profileId}`,
  topVoters: (profileId: string) => `/api/v1/votes/${profileId}/top-voters`,
  voteMultipliers: () => "/api/v1/vote-multiplier-periods",
  activeVoteMultiplier: () => "/api/v1/vote-multiplier-periods/active",
  adminVotes: () => "/api/v1/admin/votes",
  votesAnalytics: () => "/api/v1/analytics/votes",
} as const;

// Cast a free vote
export const useCastFreeVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voteData: FreeVoteRequest): Promise<Vote> => {
      const response = await api.post<Vote>(VOTES_ENDPOINTS.freeVote(), voteData);
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries - be more specific to prevent unnecessary refetches
      queryClient.invalidateQueries({ queryKey: ["votes"] });
      queryClient.invalidateQueries({ queryKey: ["freeVoteAvailability"] });
      // Invalidate profile queries - both by profile ID and user ID patterns
      queryClient.invalidateQueries({ queryKey: ["profile", "detail", "user"] });
      queryClient.invalidateQueries({ queryKey: ["profile", "detail", variables.voterId] });
      queryClient.invalidateQueries({ queryKey: ["contest"] });
    },
  });
};

// Cast a paid vote (returns payment URL)
export const useCastPaidVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voteData: PaidVoteRequest): Promise<{ url: string }> => {
      const response = await api.post<{ url: string }>(VOTES_ENDPOINTS.paidVote(), voteData);
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries - be more specific to prevent unnecessary refetches
      queryClient.invalidateQueries({ queryKey: ["votes"] });
      queryClient.invalidateQueries({ queryKey: ["freeVoteAvailability", variables.voterId] });
      // Only invalidate the specific voter's profile, not all profiles
      queryClient.invalidateQueries({ queryKey: ["profile", "detail", "user", variables.voterId] });
      queryClient.invalidateQueries({ queryKey: ["contest"] });
    },
  });
};

// Check if free vote is available
export const useCheckFreeVoteAvailability = (params: FreeVoteAvailabilityRequest) => {
  return useQuery({
    queryKey: ["freeVoteAvailability", params.profileId],
    queryFn: async (): Promise<FreeVoteAvailabilityResponse> => {
      const response = await api.post<FreeVoteAvailabilityResponse>(
        VOTES_ENDPOINTS.checkFreeVoteAvailability(),
        params
      );
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
    enabled: !!params.profileId,
  });
};

// Get latest votes
export const useLatestVotes = (params: { search?: string; page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: ["latestVotes", params],
    queryFn: async (): Promise<LatestVotesResponse> => {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append("search", params.search);
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());

      const response = await api.get<LatestVotesResponse>(
        `${VOTES_ENDPOINTS.latestVotes()}?${queryParams.toString()}`
      );
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
  });
};

// Get votes by profile ID
export const useProfileVotes = (
  profileId: string,
  params: { search?: string; page?: number; limit?: number, onlyPaid?: boolean } = {}
) => {
  return useQuery({
    queryKey: ["profileVotes", profileId, params],
    queryFn: async (): Promise<ProfileVotesResponse> => {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append("search", params.search);
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.onlyPaid) queryParams.append("onlyPaid", params.onlyPaid.toString());
      const response = await api.get<ProfileVotesResponse>(
        `${VOTES_ENDPOINTS.profileVotes(profileId)}?${queryParams.toString()}`
      );
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }

      console.log("response.data", response.data);
      return response.data;
    },
    enabled: !!profileId,
  });
};

// Get top voters for a profile
export const useTopVoters = (profileId: string) => {
  return useQuery({
    queryKey: ["topVoters", profileId],
    queryFn: async (): Promise<TopVoter[]> => {
      const response = await api.get<TopVoter[]>(VOTES_ENDPOINTS.topVoters(profileId));
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
    enabled: !!profileId,
  });
};

// Vote multiplier periods (admin only)
export const useVoteMultipliers = (params: { search?: string; page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: ["voteMultipliers", params],
    queryFn: async (): Promise<{ data: VoteMultiplierPeriod[]; pagination: { total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean; nextPage: number | null; previousPage: number | null } }> => {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append("search", params.search);
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());

      const response = await api.get(`${VOTES_ENDPOINTS.voteMultipliers()}?${queryParams.toString()}`);
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
  });
};

// Get active vote multiplier
export const useActiveVoteMultiplier = () => {
  return useQuery({
    queryKey: ["activeVoteMultiplier"],
    queryFn: async (): Promise<VoteMultiplierPeriod | null> => {
      const response = await api.get<VoteMultiplierPeriod | null>(VOTES_ENDPOINTS.activeVoteMultiplier());
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
  });
};

// Create vote multiplier period
export const useCreateVoteMultiplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVoteMultiplierRequest): Promise<VoteMultiplierPeriod> => {
      const response = await api.post<VoteMultiplierPeriod>(VOTES_ENDPOINTS.voteMultipliers(), data);
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voteMultipliers"] });
      queryClient.invalidateQueries({ queryKey: ["activeVoteMultiplier"] });
    },
  });
};

// Update vote multiplier period
export const useUpdateVoteMultiplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVoteMultiplierRequest }): Promise<VoteMultiplierPeriod> => {
      const response = await api.put<VoteMultiplierPeriod>(`${VOTES_ENDPOINTS.voteMultipliers()}/${id}`, data);
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voteMultipliers"] });
      queryClient.invalidateQueries({ queryKey: ["activeVoteMultiplier"] });
    },
  });
};

// Delete vote multiplier period
export const useDeleteVoteMultiplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      const response = await api.delete<{ message: string }>(`${VOTES_ENDPOINTS.voteMultipliers()}/${id}`);
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voteMultipliers"] });
      queryClient.invalidateQueries({ queryKey: ["activeVoteMultiplier"] });
    },
  });
};

// Get all votes for admin panel
export const useAdminVotes = (params: {
  search?: string;
  page?: number;
  limit?: number;
  type?: 'FREE' | 'PAID';
  from_date?: string;
  to_date?: string;
} = {}) => {
  return useQuery({
    queryKey: ["adminVotes", params],
    queryFn: async (): Promise<AdminVotesResponse> => {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append("search", params.search);
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.type) queryParams.append("type", params.type);
      if (params.from_date) queryParams.append("from_date", params.from_date);
      if (params.to_date) queryParams.append("to_date", params.to_date);

      const response = await api.get<AdminVotesResponse>(
        `${VOTES_ENDPOINTS.adminVotes()}?${queryParams.toString()}`
      );
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
  });
};

// Get votes analytics
export const useVotesAnalytics = () => {
  return useQuery({
    queryKey: ["votesAnalytics"],
    queryFn: async (): Promise<VotesAnalyticsResponse> => {
      const response = await api.get<VotesAnalyticsResponse>(VOTES_ENDPOINTS.votesAnalytics());
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
  });
};

// Vote History interfaces
export interface VoteHistoryRecord {
  id: string;
  modelName: string;
  modelProfileImage: string | null;
  contestName: string;
  contestId: string;
  contestSlug: string;
  contestStatus: string;
  contestEndDate: string | null;
  voteType: "FREE" | "PAID";
  voteCount: number;
  timestamp: string;
  voteeId: string;
}

export interface VoteHistoryStats {
  totalVotes: number;
  totalRecords: number;
  freeVotes: number;
  paidVotes: number;
  contestsVotedIn: number;
  uniqueModels: number;
}

export interface VoteHistoryResponse {
  votes: VoteHistoryRecord[];
  stats: VoteHistoryStats;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Get vote history for a profile
export const useVoteHistory = (profileId: string | undefined, page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: ["voteHistory", profileId, page, limit],
    queryFn: async (): Promise<VoteHistoryResponse> => {
      if (!profileId) throw new Error("Profile ID is required");
      
      const response = await api.get<VoteHistoryResponse>(
        `/votes/history/${profileId}?page=${page}&limit=${limit}`
      );
      
      if (!isApiSuccess(response)) {
        throw new Error(getErrorMessage(response));
      }
      return response.data;
    },
    enabled: !!profileId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

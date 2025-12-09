import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError, isApiSuccess } from "@/lib/api";
import { toast } from "sonner";

const ADMIN_CONTEST_PARTICIPATION_ENDPOINTS = {
  participations: () => "/api/v1/admin/contest-participations",
  participation: (id: string) => `/api/v1/admin/contest-participations/${id}`,
} as const;

export interface ContestParticipation {
  id: string;
  profileId: string;
  profileName: string | null;
  contestId: string;
  contestName: string | null;
  isApproved: boolean;
  isParticipating: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateParticipationRequest {
  isApproved?: boolean;
  isParticipating?: boolean;
}

export const useAdminContestParticipations = (page = 1, limit = 20, filters?: { contestId?: string; profileId?: string; isApproved?: string }) => {
  return useQuery({
    queryKey: ["admin", "contest-participations", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.contestId && { contestId: filters.contestId }),
        ...(filters?.profileId && { profileId: filters.profileId }),
        ...(filters?.isApproved && { isApproved: filters.isApproved }),
      });
      const response = await api.get<{ data: ContestParticipation[]; pagination: any }>(
        `${ADMIN_CONTEST_PARTICIPATION_ENDPOINTS.participations()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};

export const useUpdateContestParticipation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateParticipationRequest }) => {
      const response = await api.patch<ContestParticipation>(
        ADMIN_CONTEST_PARTICIPATION_ENDPOINTS.participation(id),
        data,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "contest-participations"] });
      toast.success("Participation updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update participation");
    },
  });
};


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError, isApiSuccess } from "@/lib/api";
import { toast } from "sonner";

const ADMIN_MILESTONES_ENDPOINTS = {
  milestones: () => "/api/v1/admin/milestones",
  voterModelMilestones: () => "/api/v1/admin/milestones/voter-model",
  grantMilestone: () => "/api/v1/admin/milestones/voter-model/grant",
} as const;

export interface Milestone {
  id: string;
  profileId: string;
  profileName: string | null;
  type: string;
  threshold: number;
  currentValue: number;
  isNotified: boolean;
  notifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoterModelMilestone {
  id: string;
  voterId: string;
  voterName: string | null;
  modelId: string;
  modelName: string | null;
  totalSpent: number;
  lastMilestoneReached: number | null;
  lastMilestoneReachedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useAdminMilestones = (page = 1, limit = 20, filters?: { profileId?: string; type?: string }) => {
  return useQuery({
    queryKey: ["admin", "milestones", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.profileId && { profileId: filters.profileId }),
        ...(filters?.type && { type: filters.type }),
      });
      const response = await api.get<{ data: Milestone[]; pagination: any }>(
        `${ADMIN_MILESTONES_ENDPOINTS.milestones()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};

export const useAdminVoterModelMilestones = (page = 1, limit = 20, filters?: { voterId?: string; modelId?: string }) => {
  return useQuery({
    queryKey: ["admin", "voter-model-milestones", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.voterId && { voterId: filters.voterId }),
        ...(filters?.modelId && { modelId: filters.modelId }),
      });
      const response = await api.get<{ data: VoterModelMilestone[]; pagination: any }>(
        `${ADMIN_MILESTONES_ENDPOINTS.voterModelMilestones()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};

export const useGrantMilestoneSpin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { voterId: string; modelId: string; milestoneAmount: number }) => {
      const response = await api.post(ADMIN_MILESTONES_ENDPOINTS.grantMilestone(), data);
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "voter-model-milestones"] });
      toast.success("Milestone spin granted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to grant milestone spin");
    },
  });
};


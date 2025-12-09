import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError, isApiSuccess } from "@/lib/api";
import { toast } from "sonner";

const ADMIN_SPIN_WHEEL_ENDPOINTS = {
  rewards: () => "/api/v1/admin/spin-wheel/rewards",
  reward: (id: string) => `/api/v1/admin/spin-wheel/rewards/${id}`,
  history: () => "/api/v1/admin/spin-wheel/history",
  prizes: () => "/api/v1/admin/spin-wheel/prizes",
} as const;

export interface SpinWheelReward {
  id: string;
  name: string;
  description: string;
  icon: string;
  probability: number;
  popupMessage: string;
  rewardType: string;
  rewardValue: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpinWheelRewardRequest {
  name: string;
  description: string;
  icon: string;
  probability: number;
  popupMessage: string;
  rewardType: string;
  rewardValue?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface SpinHistory {
  id: string;
  profileId: string;
  profileName: string | null;
  rewardId: string;
  rewardName: string;
  rewardType: string;
  spunAt: string;
}

export interface ActivePrize {
  id: string;
  profileId: string;
  profileName: string | null;
  rewardId: string | null;
  prizeType: string;
  prizeValue: number | null;
  isActive: boolean;
  isClaimed: boolean;
  claimedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export const useAdminSpinWheelRewards = (page = 1, limit = 20, isActive?: string) => {
  return useQuery({
    queryKey: ["admin", "spin-wheel", "rewards", page, limit, isActive],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(isActive && { isActive }),
      });
      const response = await api.get<{ data: SpinWheelReward[]; pagination: any }>(
        `${ADMIN_SPIN_WHEEL_ENDPOINTS.rewards()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};

export const useCreateSpinWheelReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSpinWheelRewardRequest) => {
      const response = await api.post<SpinWheelReward>(ADMIN_SPIN_WHEEL_ENDPOINTS.rewards(), data);
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "spin-wheel", "rewards"] });
      toast.success("Reward created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create reward");
    },
  });
};

export const useUpdateSpinWheelReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateSpinWheelRewardRequest> }) => {
      const response = await api.patch<SpinWheelReward>(ADMIN_SPIN_WHEEL_ENDPOINTS.reward(id), data);
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "spin-wheel", "rewards"] });
      toast.success("Reward updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update reward");
    },
  });
};

export const useDeleteSpinWheelReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(ADMIN_SPIN_WHEEL_ENDPOINTS.reward(id));
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "spin-wheel", "rewards"] });
      toast.success("Reward deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete reward");
    },
  });
};

export const useAdminSpinHistory = (page = 1, limit = 20, filters?: { profileId?: string; rewardType?: string; startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["admin", "spin-wheel", "history", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.profileId && { profileId: filters.profileId }),
        ...(filters?.rewardType && { rewardType: filters.rewardType }),
        ...(filters?.startDate && { startDate: filters.startDate }),
        ...(filters?.endDate && { endDate: filters.endDate }),
      });
      const response = await api.get<{ data: SpinHistory[]; pagination: any }>(
        `${ADMIN_SPIN_WHEEL_ENDPOINTS.history()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};

export const useAdminActivePrizes = (page = 1, limit = 20, filters?: { profileId?: string; prizeType?: string; isActive?: string; isClaimed?: string }) => {
  return useQuery({
    queryKey: ["admin", "spin-wheel", "prizes", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.profileId && { profileId: filters.profileId }),
        ...(filters?.prizeType && { prizeType: filters.prizeType }),
        ...(filters?.isActive && { isActive: filters.isActive }),
        ...(filters?.isClaimed && { isClaimed: filters.isClaimed }),
      });
      const response = await api.get<{ data: ActivePrize[]; pagination: any }>(
        `${ADMIN_SPIN_WHEEL_ENDPOINTS.prizes()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};


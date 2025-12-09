import { useQuery } from "@tanstack/react-query";
import { api, extractApiError, isApiSuccess } from "@/lib/api";

const ADMIN_AWARDS_ENDPOINTS = {
  awards: () => "/api/v1/admin/awards",
} as const;

export interface Award {
  id: string;
  name: string;
  icon: string;
  contestId: string;
  contestName: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useAdminAwards = (page = 1, limit = 20, contestId?: string) => {
  return useQuery({
    queryKey: ["admin", "awards", page, limit, contestId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(contestId && { contestId }),
      });
      const response = await api.get<{ data: Award[]; pagination: any }>(
        `${ADMIN_AWARDS_ENDPOINTS.awards()}?${params}`,
      );
      if (!isApiSuccess(response)) {
        throw new Error(extractApiError(response) as string);
      }
      return response.data;
    },
  });
};


import { PageLoader } from "@/components/PageLoader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { authApi } from "@/lib/api";
import { GetSessionResponse } from "@/types/auth.types";
import { createFileRoute, redirect } from "@tanstack/react-router";
import React from "react";

const OnboardingLazy = React.lazy(() => import("@/components/story-onboarding").then(module => ({ default: module.default })));

export const Route = createFileRoute("/onboarding/")({
  component: () => (
    <ProtectedRoute>
      <OnboardingLazy />
    </ProtectedRoute>
  ),
  pendingComponent: () => <PageLoader />,
  loader: async () => {
    const response = await authApi.getSession<GetSessionResponse>();
    if (!response.success) return;

    if (!response.data?.user) {
      return redirect({ to: "/auth/$id", params: { id: "sign-in" } });
    }
    
    // Voters don't need onboarding - redirect them to dashboard
    if (response.data?.user.type === "VOTER") {
      return redirect({ to: "/dashboard" });
    }
    
    // If model already has a profile, redirect to dashboard
    if (response.data?.user.profileId) {
      return redirect({ to: "/dashboard" });
    }
    return;
  },
});

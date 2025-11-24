import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BuyVotesModal } from "@/components/profile/BuyVotesModal";
import { profileApi } from "@/hooks/api/useProfile";
import PublicProfilePage from "@/pages/PublicProfilePage";

export const Route = createFileRoute("/_public/vote/$contestId/$profileId")({
  beforeLoad: async ({ params }) => {
    const { profileId } = params;
    try {
      // Get profile by ID
      const profile = await profileApi.getProfile(profileId);
      if (!profile) {
        throw new Error("Profile not found");
      }
      return { profile };
    } catch (error) {
      console.error("Error loading profile:", error);
      throw error;
    }
  },
  loader: async ({ context, params }) => {
    const { profile } = context as { profile: any };
    const { contestId } = params;
    // Get active participations for this profile
    const participations = await profileApi.getActiveParticipation(profile.id, { page: 1, limit: 50 });
    // Filter to only the specific contest
    const filteredParticipations = participations?.data?.filter(
      (p: any) => p.contest?.id === contestId
    ) || [];
    return { participations: filteredParticipations, contestId };
  },
  component: VotePage,
});

function VotePage() {
  const { contestId, profileId } = Route.useParams();
  const { profile } = Route.useRouteContext();
  const { participations } = Route.useLoaderData();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hasRedirectedToSignIn, setHasRedirectedToSignIn] = useState(false);
  const [hasRedirectedToProfile, setHasRedirectedToProfile] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !hasRedirectedToSignIn) {
      setHasRedirectedToSignIn(true);
      const returnUrl = `/vote/${contestId}/${profileId}`;
      // Store returnUrl in sessionStorage as backup for OAuth flow
      sessionStorage.setItem('oauthReturnUrl', returnUrl);
      navigate({
        to: "/auth/$id",
        params: { id: "sign-in" },
        search: { returnUrl, userType: "VOTER" },
        replace: true,
      });
    }
  }, [isAuthenticated, authLoading, hasRedirectedToSignIn, contestId, profileId, navigate]);

  // Redirect to profile page with contestId query param to trigger voting modal
  const profileUsername = profile.user?.username || profile.user?.displayUsername;
  
  useEffect(() => {
    if (profileUsername && isAuthenticated && !authLoading && !hasRedirectedToProfile) {
      setHasRedirectedToProfile(true);
      navigate({
        to: "/profile/$username",
        params: { username: profileUsername },
        search: { contestId, autoOpenVote: true },
        replace: true,
      });
    }
  }, [profileUsername, isAuthenticated, authLoading, contestId, navigate, hasRedirectedToProfile]);

  // Show loading while redirecting
  if (profileUsername) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    </div>
  );
}


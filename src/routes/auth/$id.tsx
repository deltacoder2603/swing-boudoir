import { PageLoader } from "@/components/PageLoader";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateVoterProfile } from "@/hooks/api/users";
import Auth from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

// Define valid auth route IDs
type AuthRouteId = "sign-in" | "sign-up" | "callback";

// Define search parameters
interface AuthSearchParams {
  callback?: string;
  token?: string;
  error?: string;
  redirectTo?: string;
  userType?: "MODEL" | "VOTER";
  referralCode?: string;
}

export const Route = createFileRoute("/auth/$id")({
  component: AuthPage,
  errorComponent: NotFound,
  notFoundComponent: NotFound,
  validateSearch: (search: Record<string, unknown>): AuthSearchParams => {
    return {
      callback: typeof search.callback === "string" ? search.callback : undefined,
      token: typeof search.token === "string" ? search.token : undefined,
      error: typeof search.error === "string" ? search.error : undefined,
      redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
      userType: search.userType === "MODEL" || search.userType === "VOTER" ? (search.userType as "MODEL" | "VOTER") : undefined,
      referralCode: typeof search.referralCode === "string" ? search.referralCode : undefined,
    };
  },
  params: {
    parse: (params) => {
      if (params.id !== "sign-in" && params.id !== "sign-up" && params.id !== "callback") {
        throw new Error(`Invalid auth route: ${params.id}`);
      }
      return { id: params.id as AuthRouteId };
    },
  },
  beforeLoad: ({ params }) => {
    // Type-safe validation
    const validIds: AuthRouteId[] = ["sign-in", "sign-up", "callback"];
    if (!validIds.includes(params.id as AuthRouteId)) {
      throw new Error(`Invalid auth route. Must be one of: ${validIds.join(", ")}`);
    }
  },
});

function AuthPage() {
  const { id } = Route.useParams();
  const search = useSearch({ from: "/auth/$id" });

  // Handle OAuth callback
  if (id === "callback") {
    return <OAuthCallbackPage />;
  }

  // Handle regular auth pages
  return <Auth />;
}

// OAuth Callback Component
const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const { revalidateSession, checkUserNeedsOnboarding } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const search = Route.useSearch();
  const createVoterProfile = useCreateVoterProfile();
  const hasHandledRef = useRef(false);
  const redirectTo = search.redirectTo as string | undefined;
  const desiredUserType = search.userType as "MODEL" | "VOTER" | undefined;
  const referralCode = search.referralCode as string | undefined;

  useEffect(() => {
    if (hasHandledRef.current) return;
    hasHandledRef.current = true;
    const handleOAuthCallback = async () => {
      try {
        let session = await revalidateSession();
        try {
          if (desiredUserType && session.user?.type && session.user.type !== desiredUserType) {
            if (desiredUserType === "VOTER") {
              await createVoterProfile.mutateAsync(session.user.id);
            }
          }
          
          // Process referral if provided (only for new users who don't already have a referrer)
          if (referralCode && session.user && !session.user.referredById) {
            try {
              const { authApi } = await import("@/lib/api");
              await authApi.post(`/referrals/process`, {
                referralCode,
                userId: session.user.id,
              });
              toast.success("Referral Applied!", {
                description: `You were successfully referred by ${referralCode}. You'll receive bonus votes!`,
              });
            } catch (error) {
              console.warn("Failed to process referral:", error);
              // Don't fail authentication if referral processing fails
            }
          } else if (referralCode && session.user?.referredById) {
            console.log("User already has a referrer, skipping referral processing");
          }
        } catch (e) {
          console.warn("Failed to finalize user type on callback:", e);
        } finally {
          const newSession = await revalidateSession();
          session = newSession;
        }

        if (!session.session) {
          throw new Error("No session received from OAuth callback");
        }

        if (session.user && session.user.type === "VOTER") {
          toast.success("Successfully signed in with Google");
          // Use window.location for voter redirect to avoid routing issues
          window.location.href = redirectTo || "/voters/";
          return;
        }

        const needsOnboarding = !session.user.profileId || !session.session.profileId;

        let targetPath = "/dashboard";
        if (needsOnboarding) {
          targetPath = "/onboarding";
        } else if (redirectTo && redirectTo !== "/dashboard") {
          targetPath = redirectTo;
        }

        navigate({ to: targetPath, replace: true });

        toast.success("Successfully signed in with Google");
      } catch (error) {
        console.error("Error processing OAuth callback:", error);
        toast.error("Failed to complete authentication");
        navigate({ to: "/auth/$id", params: { id: "sign-in" }, replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [redirectTo, desiredUserType, navigate, revalidateSession, checkUserNeedsOnboarding, createVoterProfile]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <PageLoader />
          <p className="mt-4 text-muted-foreground">Completing authentication...</p>
        </div>
      </div>
    );
  }

  return null;
};

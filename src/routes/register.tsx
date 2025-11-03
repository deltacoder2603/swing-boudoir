import { PageLoader } from "@/components/PageLoader";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import Auth from "@/pages/AuthPage";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// Define search parameters for referral
interface RegisterSearchParams {
  ref?: string; // referral code
  userType?: "MODEL" | "VOTER";
}

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  validateSearch: (search: Record<string, unknown>): RegisterSearchParams => {
    return {
      ref: typeof search.ref === "string" ? search.ref : undefined,
      userType: search.userType === "MODEL" || search.userType === "VOTER" ? (search.userType as "MODEL" | "VOTER") : undefined,
    };
  },
});

function RegisterPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/register" });
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, navigate]);

  // Handle referral code processing
  useEffect(() => {
    if (search.ref && !isProcessing) {
      setIsProcessing(true);
      
      // Store referral code in localStorage for later use during registration
      localStorage.setItem("referralCode", search.ref);
      
      toast.success(`Welcome! You were referred by ${search.ref}`);
      setIsProcessing(false);
    }
  }, [search.ref, isProcessing]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <PageLoader />
          <p className="mt-4 text-muted-foreground">Processing referral...</p>
        </div>
      </div>
    );
  }

  // Show the auth page with sign-up form
  return <Auth defaultMode="sign-up" referralCode={search.ref} />;
}

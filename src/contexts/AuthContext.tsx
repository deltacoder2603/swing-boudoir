/**
 * Authentication Context for Swing Boudoir Showcase
 *
 * This context provides:
 * - Global authentication state management
 * - Manual email/password authentication
 * - User session management
 * - Protected route handling
 *
 * @author Swing Boudoir Development Team
 * @version 1.0.0
 */

import { toast } from "@/components/ui/use-toast";
import { authApi } from "@/lib/api";
import { AUTH_TOKEN_KEY, authClient } from "@/lib/auth";
import { authPages, DEFAULT_AFTER_LOGIN_REDIRECT, DEFAULT_AFTER_LOGOUT_REDIRECT } from "@/routes";
import {
  GetSessionResponse,
  Session,
  SignInWithEmailRequest,
  SignInWithEmailResponse,
  SignInWithUsernameRequest,
  SignUpWithEmailRequest,
  SocialSignInResponse,
  User,
  User_Type,
} from "@/types/auth.types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuthUrl, getCallbackUrl, getOAuthCallbackUrl, getFullCallbackUrl } from "../lib/config";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Authentication methods
  handleRegister: (data: SignUpWithEmailRequest) => Promise<void>;
  handleRegisterAsVoter: (data: {
    name: string;
    email: string;
    password: string;
    username: string;
    rememberMe?: boolean;
    callbackURL?: string;
  }) => Promise<{ token: string; user: User; username: string }>;
  handleLoginWithEmail: (data: SignInWithEmailRequest) => Promise<void>;
  handleLoginWithUsername: (data: SignInWithUsernameRequest) => Promise<void>;
  handleLoginWithGoogle: (callbackURL?: string, type?: User_Type, referralCode?: string) => Promise<void>;
  
  // Voter-specific authentication methods
  handleVoterSignIn: (data: { email: string; password: string; callbackURL?: string }) => Promise<void>;
  handleVoterSignUp: (data: { name: string; email: string; password: string; username?: string; callbackURL?: string }) => Promise<void>;
  handleVoterGoogleSignIn: (callbackURL?: string) => Promise<void>;
  
  handleLogout: () => Promise<void>;
  checkUserNeedsOnboarding: () => boolean;

  // Session management
  getSession: () => Promise<GetSessionResponse>;
  updateUser: (data: { name?: string; image?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteUser: (password: string) => Promise<void>;

  // Password reset
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;

  // Email verification
  sendVerificationEmail: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;

  // Session management
  listSessions: () => Promise<Session[]>;
  revokeSession: (token: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;
  revokeOtherSessions: () => Promise<void>;
  revalidateSession: () => Promise<GetSessionResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: sessionUserData,
    isLoading: isSessionLoading,
    error: sessionError,
    refetch: refetchSession,
    isSuccess,
  } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        queryClient.removeQueries({ queryKey: ["session"] });
        throw new Error("No authentication token");
      }
      const response = await authApi.getSession<GetSessionResponse>();
      if (!response.success) throw new Error("Session fetch failed");
      return response.data;
    },
    enabled: !!localStorage.getItem(AUTH_TOKEN_KEY), // Only run query if token exists
    retry: false,
    refetchOnWindowFocus: false, // Changed to false to prevent unnecessary refetches
    staleTime: 1000 * 60 * 5, // Increased to 5 minutes
  });

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      // No token means no session - immediately set auth state
      queryClient.removeQueries({ queryKey: ["session"] });
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // If we have a token but no session data yet, keep loading
    if (!sessionUserData) {
      return;
    }

    // We have both token and session data
    if (isSuccess && sessionUserData) {
      setSession(sessionUserData.session);
      setUser(sessionUserData.user);
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [isSuccess, sessionUserData]);

  // Handle initial loading state
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      // No token means no auth needed - set loading to false immediately
      queryClient.removeQueries({ queryKey: ["session"] });
      setIsLoading(false);
      return;
    }

    // We have a token, so we need to fetch the session
    setIsLoading(true);
    refetchSession().finally(() => {
      setIsLoading(false);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revalidateSession = async () => {
    const response = await authApi.getOAuthSession<GetSessionResponse>();
    if (!response.success) throw new Error("Session fetch failed");
    localStorage.setItem(AUTH_TOKEN_KEY, response.data.session.token);
    setSession(response.data.session);
    setUser(response.data.user);
    setIsAuthenticated(true);
    setIsLoading(false);
    return response.data;
  };

  // Register user
  const handleRegister = async (data: SignUpWithEmailRequest) => {
    const { name, email, password, username, type, referralCode } = data;
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.register({
        name,
        email,
        password,
        username,
        type: type || "MODEL",
      });

      if (!response.success) {
        throw new Error(response.error || "Registration failed");
      }

      if (!response.data?.user) {
        throw new Error("Invalid response from server");
      }

      // Process referral if provided
      if (referralCode) {
        try {
          await authApi.post(`/referrals/process`, {
            referralCode,
            userId: response.data.user.id,
          });
          toast({
            title: "Referral Applied!",
            description: `You were successfully referred by ${referralCode}. You'll receive bonus votes!`,
          });
        } catch (error) {
          console.warn("Failed to process referral:", error);
          // Don't fail registration if referral processing fails
        }
      }

      // For new registrations, always go to login
      router.navigate({ to: "/auth/$id", params: { id: "sign-in" }, search: { callback: data.callbackURL || authPages.login }, replace: true });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Registration failed");
      } else {
        setError("Registration failed");
      }
      // Ensure no data is stored on error
      setUser(null);
      throw error; // Re-throw to be handled by component
    } finally {
      setIsLoading(false);
    }
  };

  // Register as voter without automatic login
  const handleRegisterAsVoter = async (data: { name: string; email: string; password: string; username: string; rememberMe?: boolean; callbackURL?: string }) => {
    const { name, email, password, username, rememberMe, callbackURL } = data;
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register<{ token: string; user: User; session: Session }>({
        name,
        email,
        password,
        username,
        type: "VOTER",
        rememberMe,
      });

      if (!response.success) {
        throw new Error(response.error || "Voter registration failed");
      }

      if (!response.data?.user || !response.data?.token) {
        throw new Error("Invalid response from server");
      }

      // Store token and user data
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      const redirectTo = callbackURL || DEFAULT_AFTER_LOGIN_REDIRECT;
      setTimeout(() => {
        router.navigate({ to: redirectTo, replace: true });
      }, 100);

      return {
        token: response.data.token,
        user: response.data.user,
        username: username,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Voter registration failed");
      } else {
        setError("Voter registration failed");
      }
      // Ensure no data is stored on error
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      throw error; // Re-throw to be handled by component
    } finally {
      setIsLoading(false);
    }
  };

  // Login with email
  const handleLoginWithEmail = async (data: SignInWithEmailRequest) => {
    const { email, password, callbackURL } = data;
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login<SignInWithEmailResponse>({
        email,
        password,
      });

      if (!response.success) {
        throw new Error(response.error || "Login failed");
      }

      if (!response.data?.user || !response.data?.token) {
        throw new Error("Invalid response from server");
      }

      // Store token first
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      const redirectTo = callbackURL || DEFAULT_AFTER_LOGIN_REDIRECT;

      // Use setTimeout to ensure navigation happens after state updates
      setTimeout(() => {
        router.navigate({ to: redirectTo, replace: true });
      }, 100);

      // Invalidate and refetch session data after navigation
      queryClient.invalidateQueries({ queryKey: ["session"] });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Login failed");
        toast({
          title: "Login Failed",
          description: error.message || "Login failed",
          variant: "destructive",
        });
      } else {
        setError("Login failed");
        toast({
          title: "Login Failed",
          description: "Login failed",
          variant: "destructive",
        });
      }
      throw error; // Re-throw to be handled by component
    } finally {
      setIsLoading(false);
    }
  };

  // Login with username
  const handleLoginWithUsername = async (data: SignInWithUsernameRequest) => {
    const { username, password, rememberMe = true, callbackURL } = data;
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.loginWithUsername<SignInWithEmailResponse>({
        username,
        password,
        rememberMe,
        callbackURL: callbackURL || getCallbackUrl("/login"),
      });

      if (!response.success) {
        throw new Error(response.error || "Login failed");
      }

      if (!response.data?.user || !response.data?.token) {
        throw new Error("Invalid response from server");
      }

      // Store token first
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);

      // Redirect to callback URL if provided, otherwise go to dashboard
      const redirectTo = callbackURL || DEFAULT_AFTER_LOGIN_REDIRECT;

      // Use setTimeout to ensure navigation happens after state updates
      setTimeout(() => {
        router.navigate({ to: redirectTo, replace: true });
      }, 100);

      // Invalidate and refetch session data after navigation
      queryClient.invalidateQueries({ queryKey: ["session"] });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Login failed");
        toast({
          title: "Login Failed",
          description: error.message || "Login failed",
          variant: "destructive",
        });
      } else {
        setError("Login failed");
        toast({
          title: "Login Failed",
          description: "Login failed",
          variant: "destructive",
        });
      }
      throw error; // Re-throw to be handled by component
    } finally {
      setIsLoading(false);
    }
  };
  // Login with Google OAuth
  const handleLoginWithGoogle = async (callbackURL?: string, type?: User_Type, referralCode?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check sessionStorage for returnUrl (set by vote route)
      const sessionReturnUrl = typeof window !== 'undefined' ? sessionStorage.getItem('oauthReturnUrl') : null;
      const finalRedirectUrl = callbackURL || sessionReturnUrl || DEFAULT_AFTER_LOGIN_REDIRECT;
      // Build callback URL with redirectTo and returnUrl (both for compatibility) and userType
      const baseCallback = getFullCallbackUrl("/auth/callback");
      const searchParams = new URLSearchParams();
      if (finalRedirectUrl) {
        searchParams.set("redirectTo", finalRedirectUrl);
        searchParams.set("returnUrl", finalRedirectUrl); // Also set as returnUrl for compatibility
      }
      if (type) searchParams.set("userType", type);
      if (referralCode) searchParams.set("referralCode", referralCode);
      const oauthCallbackUrl = `${baseCallback}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

      // Log OAuth callback URL only in development
      if (import.meta.env.DEV) {
      console.log("oauthCallbackUrl", oauthCallbackUrl);
      }
      const response = await authApi.loginWithGoogle<SocialSignInResponse>({
        provider: "google",
        callbackURL: oauthCallbackUrl,
        type: type || "MODEL",
      });

      if (!response.success) {
        throw new Error(response.error || "Google login failed");
      }

      // Check if response has redirect URL (OAuth flow)
      if (response.data?.redirect && response.data.url) {
        // Redirect to OAuth provider
        window.location.href = response.data.url;
        return;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Google login failed");
        toast({
          title: "Google Login Failed",
          description: error.message || "Google login failed",
          variant: "destructive",
        });
      } else {
        setError("Google login failed");
        toast({
          title: "Google Login Failed",
          description: "Google login failed",
          variant: "destructive",
        });
      }
      throw error; // Re-throw to be handled by component
    } finally {
      setIsLoading(false);
    }
  };

  // Voter-specific sign in
  const handleVoterSignIn = async (data: { email: string; password: string; callbackURL?: string }) => {
    const { email, password, callbackURL } = data;
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.voterSignIn<{ user: User; session: { token: string; expiresAt: number } }>({
        email,
        password,
      });

      if (!response.success) {
        throw new Error(response.error || "Voter sign in failed");
      }

      if (!response.data?.user || !response.data?.session?.token) {
        throw new Error("Invalid response from server");
      }

      // Store token
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.session.token);

      // Redirect to callback URL or voter dashboard
      const redirectTo = callbackURL || "/voters";

      // Use setTimeout to ensure navigation happens after state updates
      setTimeout(() => {
        router.navigate({ to: redirectTo, replace: true });
      }, 100);

      // Invalidate and refetch session data
      queryClient.invalidateQueries({ queryKey: ["session"] });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Voter sign in failed");
        toast({
          title: "Sign In Failed",
          description: error.message || "Voter sign in failed",
          variant: "destructive",
        });
      } else {
        setError("Voter sign in failed");
        toast({
          title: "Sign In Failed",
          description: "Voter sign in failed",
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Voter-specific sign up
  const handleVoterSignUp = async (data: { name: string; email: string; password: string; username?: string; callbackURL?: string }) => {
    const { name, email, password, username, callbackURL } = data;
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.voterSignUp<{ user: User; session: { token: string; expiresAt: number } }>({
        name,
        email,
        password,
        username,
      });

      if (!response.success) {
        throw new Error(response.error || "Voter sign up failed");
      }

      if (!response.data?.user || !response.data?.session?.token) {
        throw new Error("Invalid response from server");
      }

      // Store token
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.session.token);

      // Redirect to callback URL or voter dashboard
      const redirectTo = callbackURL || "/voters";

      // Use setTimeout to ensure navigation happens after state updates
      setTimeout(() => {
        router.navigate({ to: redirectTo, replace: true });
      }, 100);

      // Invalidate and refetch session data
      queryClient.invalidateQueries({ queryKey: ["session"] });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Voter sign up failed");
        toast({
          title: "Sign Up Failed",
          description: error.message || "Voter sign up failed",
          variant: "destructive",
        });
      } else {
        setError("Voter sign up failed");
        toast({
          title: "Sign Up Failed",
          description: "Voter sign up failed",
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Voter-specific Google sign in
  const handleVoterGoogleSignIn = async (callbackURL?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const finalCallbackUrl = callbackURL || "/voters";
      const response = await authApi.voterSignInGoogle<{ url: string }>({
        callbackUrl: finalCallbackUrl,
      });

      if (!response.success) {
        throw new Error(response.error || "Voter Google sign in failed");
      }

      if (!response.data?.url) {
        throw new Error("Invalid response from server");
      }

      // Redirect to Google OAuth
      window.location.href = response.data.url;
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Voter Google sign in failed");
        toast({
          title: "Google Sign In Failed",
          description: error.message || "Voter Google sign in failed",
          variant: "destructive",
        });
      } else {
        setError("Voter Google sign in failed");
        toast({
          title: "Google Sign In Failed",
          description: "Voter Google sign in failed",
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getSession = async () => {
    const response = await refetchSession();
    return response.data as GetSessionResponse;
  };

  // Logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        await authApi.logout<{ success: boolean }>();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state first
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setError(null);

      // Remove token from localStorage
      localStorage.removeItem(AUTH_TOKEN_KEY);

      // Clear all session-related queries from React Query cache
      queryClient.removeQueries({ queryKey: ["session"] });
      queryClient.clear();

      // Navigate to logout redirect
      router.navigate({ to: DEFAULT_AFTER_LOGOUT_REDIRECT, replace: true });
    }
  };

  // Check if user needs onboarding
  const checkUserNeedsOnboarding = (): boolean => {
    // Only check onboarding if user is authenticated
    if (!isAuthenticated || !user || !session) return false;

    // Voters don't need onboarding - they can directly access the dashboard
    if (user.type === "VOTER") return false;

    // Only models need onboarding (profile setup)
    // Check if user has a profile
    if (!user.profileId || !session.profileId) return true;
    return false;
  };

  // Update user
  const updateUser = async (data: { name?: string; image?: string }) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error("No authentication token");

      const response = await fetch(getAuthUrl("/update-user"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Update failed");
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Update failed");
      throw error;
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error("No authentication token");

      const response = await fetch(getAuthUrl("/change-password"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Password change failed");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Password change failed");
      throw error;
    }
  };

  // Delete user
  const deleteUser = async (password: string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error("No authentication token");

      const response = await fetch(getAuthUrl("/delete-user"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Account deletion failed");
      }

      localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      router.navigate({ to: "/" });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Account deletion failed");
      throw error;
    }
  };

  // Request password reset
  const requestPasswordReset = async (email: string) => {
    try {
      const response = await fetch(getAuthUrl("/request-password-reset"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          callbackURL: getCallbackUrl("/reset-password"),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Password reset request failed");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Password reset request failed");
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await fetch(getAuthUrl("/reset-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Password reset failed");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Password reset failed");
      throw error;
    }
  };

  // Send verification email
  const sendVerificationEmail = async (email: string) => {
    try {
      const response = await fetch(getAuthUrl("/send-verification-email"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          callbackURL: getCallbackUrl("/verify-email"),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Verification email send failed");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Verification email send failed");
      throw error;
    }
  };

  // Verify email
  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(getAuthUrl(`/verify-email?token=${token}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Email verification failed");
      }

      // Update user's email verification status
      if (user) {
        setUser({ ...user, emailVerified: true });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Email verification failed");
      throw error;
    }
  };

  // List sessions
  const listSessions = async (): Promise<Session[]> => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error("No authentication token");

      const response = await fetch(getAuthUrl("/list-sessions"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to list sessions");
      }

      return await response.json();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to list sessions");
      throw error;
    }
  };

  // Revoke session
  const revokeSession = async (token: string) => {
    try {
      const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!authToken) throw new Error("No authentication token");

      const response = await fetch(getAuthUrl("/revoke-session"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to revoke session");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to revoke session");
      throw error;
    }
  };

  // Revoke all sessions
  const revokeAllSessions = async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error("No authentication token");

      const response = await fetch(getAuthUrl("/revoke-sessions"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to revoke all sessions");
      }

      // Logout current session
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      router.navigate({ to: "/" });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to revoke all sessions");
      throw error;
    }
  };

  // Revoke other sessions
  const revokeOtherSessions = async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error("No authentication token");

      const response = await fetch(getAuthUrl("/revoke-other-sessions"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to revoke other sessions");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to revoke other sessions");
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading,
    error,
    handleRegister,
    handleRegisterAsVoter,
    handleLoginWithEmail,
    handleLoginWithUsername,
    handleLoginWithGoogle,
    handleVoterSignIn,
    handleVoterSignUp,
    handleVoterGoogleSignIn,
    handleLogout,
    checkUserNeedsOnboarding,
    getSession,
    updateUser,
    changePassword,
    deleteUser,
    requestPasswordReset,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
    listSessions,
    revokeSession,
    revokeAllSessions,
    revokeOtherSessions,
    revalidateSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

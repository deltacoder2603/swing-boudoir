import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isEmail, loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import LoginWithGoogle from "./LoginWithGoogle";

interface LoginFormProps {
  callbackURL?: string;
  onSuccess?: () => void;
}

export function LoginForm({ callbackURL: propCallbackURL, onSuccess }: LoginFormProps = {}) {
  const { handleLoginWithEmail, handleLoginWithUsername, handleLoginWithGoogle, isLoading } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Get search params for callback URL, or use prop if provided
  const search = useSearch({ strict: false, shouldThrow: false }) as { callback?: string; returnUrl?: string; userType?: "MODEL" | "VOTER" };
  // Prioritize returnUrl (used for vote links) over callback
  // Also check sessionStorage as fallback for OAuth flow
  const sessionReturnUrl = typeof window !== 'undefined' ? sessionStorage.getItem('oauthReturnUrl') : null;
  const callbackURL = propCallbackURL || search.returnUrl || search.callback || sessionReturnUrl || "/dashboard";
  
  // Store returnUrl in sessionStorage if we have it from search params (for OAuth)
  if (search.returnUrl && typeof window !== 'undefined') {
    sessionStorage.setItem('oauthReturnUrl', search.returnUrl);
  }

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Use Zod-based email validation
      const isEmailInput = isEmail(data.emailOrUsername);

      if (isEmailInput) {
        await handleLoginWithEmail({
          email: data.emailOrUsername,
          password: data.password,
          callbackURL,
        });
      } else {
        await handleLoginWithUsername({
          username: data.emailOrUsername,
          password: data.password,
          rememberMe: true,
          callbackURL,
        });
      }

      toast({
        title: "Login Successful!",
        description: "Welcome back! Redirecting to your dashboard...",
      });

      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Please check your credentials and try again.";
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-4">
          <LoginWithGoogle callbackURL={callbackURL} loginAs={search.userType || "MODEL"} />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute w-1/3 inset-0 flex items-center">
            <span className="w-full border-t " />
          </div>
          <div className="absolute w-1/3 left-auto inset-0 flex items-center">
            <span className="w-full border-t " />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailOrUsername">Email address or username</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input id="emailOrUsername" type="text" placeholder="Enter your email or username" className="pl-10" {...form.register("emailOrUsername")} />
          </div>
          {form.formState.errors.emailOrUsername && <p className="text-sm text-red-500">{form.formState.errors.emailOrUsername.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" className="pl-10 pr-10" {...form.register("password")} />
            <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/auth/$id" params={{ id: "sign-up" }} search={{ callback: callbackURL }}>
            <button type="button" className="text-primary hover:underline font-medium">
              Sign up
            </button>
          </Link>
        </p>
      </div>
    </div>
  );
}

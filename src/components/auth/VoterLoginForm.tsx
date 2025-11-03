import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isEmail, loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import LoginWithGoogle from "./LoginWithGoogle";

interface VoterLoginFormProps {
  onSuccess?: () => void;
  callbackURL?: string;
}

export function VoterLoginForm({ onSuccess, callbackURL: propCallbackURL }: VoterLoginFormProps) {
  const { handleVoterSignIn, isLoading } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Voter sign-in requires email (not username)
      if (!isEmail(data.emailOrUsername)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address to sign in as a voter.",
          variant: "destructive",
        });
        return;
      }

      await handleVoterSignIn({
        email: data.emailOrUsername,
        password: data.password,
        callbackURL: propCallbackURL || "/voters", // Use provided callback or default to voter dashboard
      });

      toast({
        title: "Login Successful!",
        description: "Welcome back! You can now vote for your favorite models.",
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
          <LoginWithGoogle callbackURL={propCallbackURL || "/voters"} loginAs="VOTER" onSuccess={onSuccess} />
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
            "Sign In to Vote"
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={() => {
              // This will be handled by the parent modal to switch tabs
              const event = new CustomEvent("switchToRegister");
              window.dispatchEvent(event);
            }}
          >
            Register to vote
          </button>
        </p>
      </div>
    </div>
  );
}

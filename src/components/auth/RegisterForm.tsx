import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Lock, Mail, User, ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { registerStep1Schema, registerStep2Schema, type RegisterStep1Data, type RegisterStep2Data } from "@/lib/validations/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { authPages } from "@/routes";
import { authApi, isApiSuccess } from "@/lib/api";
import { Link, useSearch } from "@tanstack/react-router";
import LoginWithGoogle from "./LoginWithGoogle";

interface RegisterFormProps {
  callbackURL?: string;
  onSuccess?: () => void;
  referralCode?: string;
}

export function RegisterForm({ callbackURL: propCallbackURL, onSuccess, referralCode }: RegisterFormProps = {}) {
  const { handleRegister, isLoading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<RegisterStep1Data | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "unavailable" | "error">("idle");
  const [usernameMessage, setUsernameMessage] = useState<string>("");
  const debounceMs = 450;

  // Preserve callback search param, or use prop if provided
  const search = useSearch({ strict: false, shouldThrow: false }) as { callback?: string };
  const callbackURL = propCallbackURL || search?.callback || "/dashboard";

  const step1Form = useForm<RegisterStep1Data>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const step2Form = useForm<RegisterStep2Data>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: {
      username: "",
    },
  });

  const watchedUsername = step2Form.watch("username");

  useEffect(() => {
    // Reset on empty or too short
    if (!watchedUsername || watchedUsername.trim().length < 3) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    setUsernameStatus("checking");
    setUsernameMessage("");

    const handle = setTimeout(async () => {
      try {
        type UsernameCheckResponse = { available: boolean };
        const res = await authApi.isUsernameAvailable<UsernameCheckResponse>({ username: watchedUsername.trim() });
        if (isApiSuccess<UsernameCheckResponse>(res)) {
          const available = res.data?.available ?? false;
          if (available) {
            setUsernameStatus("available");
            setUsernameMessage("Username is available");
          } else {
            setUsernameStatus("unavailable");
            setUsernameMessage("Username is already taken");
          }
        } else {
          setUsernameStatus("error");
          setUsernameMessage(res.error || "Could not check availability");
        }
      } catch (e) {
        setUsernameStatus("error");
        setUsernameMessage("Could not check availability");
      }
    }, debounceMs);

    return () => clearTimeout(handle);
  }, [watchedUsername]);

  const onStep1Submit = async (data: RegisterStep1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const onStep2Submit = async (data: RegisterStep2Data) => {
    if (!step1Data) return;

    try {
      await handleRegister({
        name: step1Data.name,
        username: data.username,
        email: step1Data.email,
        password: step1Data.password,
        rememberMe: true,
        callbackURL: authPages.login,
        referralCode: referralCode,
      });
      toast({
        title: "Registration Successful!",
        description: "Welcome to Swing Boudoir! Please sign in to continue.",
      });
      
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Please try again with different information.";

      let title = "Registration Failed";
      if (errorMessage.toLowerCase().includes("email")) {
        title = "Email Already Taken";
      } else if (errorMessage.toLowerCase().includes("username")) {
        title = "Username Already Taken";
      }

      toast({
        title,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const goBack = () => {
    setCurrentStep(1);
  };

  if (currentStep === 1) {
    return (
      <div className="space-y-4">
        {/* Google Sign-in Option */}
        <div className="space-y-4">
          <LoginWithGoogle 
            callbackURL={callbackURL} 
            loginAs="MODEL" 
            referralCode={referralCode}
          />
          
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>
        </div>

        <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input id="name" type="text" placeholder="Enter your full name" className="pl-10" {...step1Form.register("name")} />
            </div>
            {step1Form.formState.errors.name && <p className="text-sm text-red-500">{step1Form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input id="email" type="email" placeholder="Enter your email" className="pl-10" {...step1Form.register("email")} />
            </div>
            {step1Form.formState.errors.email && <p className="text-sm text-red-500">{step1Form.formState.errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" className="pl-10 pr-10" {...step1Form.register("password")} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {step1Form.formState.errors.password && <p className="text-sm text-red-500">{step1Form.formState.errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="pl-10 pr-10"
                {...step1Form.register("confirmPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {step1Form.formState.errors.confirmPassword && <p className="text-sm text-red-500">{step1Form.formState.errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" className="w-full">
            <span>Continue</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/auth/$id" params={{ id: "sign-in" }} search={{ callback: callbackURL }}>
              <button type="button" className="text-primary hover:underline font-medium">
                Sign in
              </button>
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const isChecking = usernameStatus === "checking";
  const isUnavailable = usernameStatus === "unavailable";

  return (
    <div className="space-y-4">
      <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input id="username" type="text" placeholder="Choose a username" className="pl-10" {...step2Form.register("username")} />
          </div>
          {usernameStatus !== "idle" && (
            <div className="flex items-center gap-2 text-sm" aria-live="polite">
              {isChecking && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-gray-600">Checking availability...</span>
                </>
              )}
              {usernameStatus === "available" && (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">{usernameMessage}</span>
                </>
              )}
              {isUnavailable && (
                <>
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">{usernameMessage}</span>
                </>
              )}
              {usernameStatus === "error" && <span className="text-red-600">{usernameMessage}</span>}
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={goBack} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Back</span>
          </Button>
          <Button type="submit" disabled={isLoading || isChecking || isUnavailable} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/auth/$id" params={{ id: "sign-in" }} search={{ callback: callbackURL }}>
            <button type="button" className="text-primary hover:underline font-medium">
              Sign in
            </button>
          </Link>
        </p>
      </div>
    </div>
  );
}

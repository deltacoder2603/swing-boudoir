/**
 * Authentication Page Component
 *
 * This component provides:
 * - Manual email/password authentication
 * - Professional UI design
 * - Loading states and error handling
 * - Responsive design for all devices
 *
 * @author Swing Boudoir Development Team
 * @version 1.0.0
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Features } from "@/constants/auth.constants";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Trophy, Heart } from "lucide-react";
import React, { useEffect } from "react";
import { useRouter, useLocation, useSearch } from "@tanstack/react-router";
import { LoginForm, RegisterForm, VoterRegisterForm } from "@/components/auth";
import img1 from "@/assets/testimonials/img-1.jpg";
import img2 from "@/assets/testimonials/img-2.jpg";
import img3 from "@/assets/testimonials/img-3.jpg";
import img4 from "@/assets/testimonials/img-4.jpg";
import img5 from "@/assets/testimonials/img-5.jpg";

interface AuthProps {
  defaultMode?: "sign-in" | "sign-up";
  referralCode?: string;
}

const Auth: React.FC<AuthProps> = ({ defaultMode, referralCode }) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const location = useLocation();
  const search = useSearch({ strict: false }) as { type?: "MODEL" | "VOTER"; referralCode?: string };
  
  // Determine if we're in sign-in mode based on route or props
  const isSignInRoute = location.pathname.includes('/auth/sign-in');
  const isRegisterRoute = location.pathname === '/register';
  const userType = search.type || "MODEL";
  const isVoter = userType === "VOTER";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.navigate({ to: "/dashboard/$section", params: { section: "notifications" } });
    }
  }, [isAuthenticated, router]);

  const isSignIn = isSignInRoute || defaultMode === "sign-in";
  const cardTitle = isSignIn ? "Welcome Back" : (isVoter ? "Join as Voter" : "Get Started");
  const cardDescription = isSignIn
    ? "Sign in to your account to continue your journey"
    : isVoter
    ? "Create a voter account to support models and unlock exclusive rewards"
    : "Create an account to access the Swing Boudoir Magazine and compete for life-changing opportunities.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Features */}
        <div className="hidden lg:block text-white space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              {isVoter ? (
                <>Support Your <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Favorite Models</span></>
              ) : (
                <>Welcome to <span className="bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">Swing Boudoir</span></>
              )}
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              {isVoter 
                ? "Join as a voter to unlock exclusive content, win prizes, and earn rewards while supporting talented models."
                : "Join the most prestigious modeling platform and compete for life-changing opportunities."}
            </p>
          </div>
          <div className="space-y-6">
            {Features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-white/80">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-8">
            <div className="flex items-center space-x-4 text-white/70">
              <div className="flex -space-x-2">
                {[img1, img2, img3, img4, img5].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-accent/80 border-2 border-white"
                    style={{
                      backgroundImage: `url(${i})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                ))}
              </div>
              <span className="text-sm">
                {isVoter ? "Join 50,000+ voters worldwide" : "Join 25,000+ models worldwide"}
              </span>
            </div>
          </div>
        </div>
        {/* Right Side - Authentication Card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                isVoter 
                  ? "bg-gradient-to-r from-purple-500 to-pink-500" 
                  : "bg-gradient-to-r from-primary to-primary/80"
              }`}>
                {isVoter ? <Heart className="w-8 h-8 text-white" /> : <Trophy className="w-8 h-8 text-white" />}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">{cardTitle}</CardTitle>
                <CardDescription className="text-gray-600 mt-2">{cardDescription}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Render the appropriate form based on route parameter and user type */}
              {isSignIn ? (
                <LoginForm />
              ) : isVoter ? (
                <VoterRegisterForm 
                  callbackURL="/voters"
                  referralCode={referralCode || search.referralCode}
                />
              ) : (
                <RegisterForm referralCode={referralCode || search.referralCode} />
              )}

              {/* Security Notice */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span>Your data is protected with industry-standard security</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Auth;

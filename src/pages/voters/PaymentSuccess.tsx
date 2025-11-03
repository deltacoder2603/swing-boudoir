import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Heart, Star, Trophy, ArrowRight, Download, Share2, Home, Users } from "lucide-react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { api, isApiSuccess } from "@/lib/api";

interface PaymentDetails {
  packageName: string;
  votes: number;
  amount: number;
  paymentId: string;
  timestamp: string;
}

export function PaymentSuccess() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearch({ strict: false, shouldThrow: false }) as {
    callback?: string;
    session_id?: string;
  };
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [hasShownToast, setHasShownToast] = useState(false);

  const callback = searchParams?.callback;
  const sessionId = searchParams?.session_id;
  const navigate = useNavigate();

  // Show success toast and verify payment
  useEffect(() => {
    if (hasShownToast) return;

    // Show success toast immediately
    toast({
      title: "🎉 Payment Successful!",
      description: "Your votes have been added to your account. You can start voting now!",
      duration: 5000,
    });
    setHasShownToast(true);

    // Verify payment status if session_id is available
    if (sessionId) {
      api.get(`/payments/status/${sessionId}`).then((response) => {
        if (isApiSuccess(response) && response.data.status === "completed") {
          // Invalidate user data to refresh vote count
          queryClient.invalidateQueries({ queryKey: ["voter-stats", user?.profile?.id] });
          queryClient.invalidateQueries({ queryKey: ["available-votes", user?.profile?.id] });
          
          if (response.data.voteCount) {
            toast({
              title: "✅ Votes Added!",
              description: `${response.data.voteCount} votes have been successfully added to your account.`,
              duration: 4000,
            });
          }
        }
      }).catch((error) => {
        console.error("Error verifying payment:", error);
        // Don't show error - webhook might still be processing
      });
    } else {
      // If no session_id, still invalidate to refresh data (webhook might have processed)
      queryClient.invalidateQueries({ queryKey: ["voter-stats", user?.profile?.id] });
      queryClient.invalidateQueries({ queryKey: ["available-votes", user?.profile?.id] });
    }

    // Redirect after showing toast
    if (callback) {
      const timeout = setTimeout(() => {
        navigate({ to: callback as any, replace: true });
      }, 3000);

      return () => clearTimeout(timeout);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, callback, hasShownToast]);


  const handleShareSuccess = async () => {
    try {
      const shareText = `Just purchased ${paymentDetails?.votes} premium votes on SWING Boudoir! Ready to support amazing models! 🎉`;
      await navigator.share({
        title: "Payment Successful",
        text: shareText,
        url: window.location.origin,
      });
    } catch (error) {
      // Fallback to clipboard
      const shareText = `Just purchased ${paymentDetails?.votes} premium votes on SWING Boudoir! Ready to support amazing models! 🎉`;
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Shared!",
        description: "Success message copied to clipboard.",
      });
    }
  };



  return (
    <div className="max-w-4xl min-h-screen flex flex-col items-center justify-center mx-auto p-6 space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Payment Successful!</h1>
        <p className="text-xl text-muted-foreground">Thank you for your purchase. Your premium votes have been added to your account.</p>
      </div>

      {/* Payment Details */}
      {/* <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-green-600" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Package:</span>
                  <span className="font-medium">{paymentDetails.packageName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Votes Added:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Heart className="w-3 h-3 mr-1" />
                    {paymentDetails.votes} Premium Votes
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount Paid:</span>
                  <span className="font-bold text-green-600">${paymentDetails.amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment ID:</span>
                  <span className="text-xs font-mono text-gray-500">{paymentDetails.paymentId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm">{new Date(paymentDetails.timestamp).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">What's Next?</h4>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Start Voting</p>
                      <p className="text-xs text-gray-600">Use your premium votes without cooldown periods</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Support Models</p>
                      <p className="text-xs text-gray-600">Help your favorite models win contests</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Trophy className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Access Premium Features</p>
                      <p className="text-xs text-gray-600">Unlock exclusive contests and voting tools</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}

          Action Buttons
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <Button asChild className="flex-1">
              <Link to="/competition">
                <Trophy className="w-4 h-4 mr-2" />
                Browse Contests
              </Link>
            </Button>

            <Button asChild variant="outline" className="flex-1">
              <Link to="/voters/favorites">
                <Heart className="w-4 h-4 mr-2" />
                View Favorites
              </Link>
            </Button>



            <Button variant="outline" onClick={handleShareSuccess}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {/* Quick Actions */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Start Voting</h3>
            <p className="text-sm text-muted-foreground mb-4">Use your new premium votes to support your favorite models</p>
            <Button asChild size="sm">
              <Link to="/voters/browse-contests">
                Vote Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Discover Models</h3>
            <p className="text-sm text-muted-foreground mb-4">Find new models to support and add to your favorites</p>
            <Button asChild size="sm" variant="outline">
              <Link to="/voters/favorites">
                Explore
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">View Dashboard</h3>
            <p className="text-sm text-muted-foreground mb-4">Check your voting stats and premium vote balance</p>
            <Button asChild size="sm" variant="outline">
              <Link to="/voters">
                Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div> */}

      {/* Support Section */}
      {/* <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="font-semibold">Need Help?</h3>
            <p className="text-sm text-muted-foreground">If you have any questions about your purchase or premium votes, our support team is here to help.</p>
            <div className="flex justify-center space-x-4">
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/$section" params={{ section: "support" }}>Contact Support</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/$section" params={{ section: "votes" }}>View Vote History</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}

export default PaymentSuccess;

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Check, Sparkles, TrendingUp, Zap, Wallet, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { voteApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface VoterBuyVotesProps {
  userId: string | undefined;
}

// Calculate price based on backend pricing tiers
const calculatePrice = (votes: number): number => {
  if (votes >= 100) return votes * 0.15;
  else if (votes >= 50) return votes * 0.16;
  else if (votes >= 25) return votes * 0.18;
  else return votes * 0.20;
};

const VOTE_PACKAGES = [
  {
    id: "starter",
    name: "Starter Pack",
    votes: 5,
    price: calculatePrice(5),
    popular: false,
    icon: Sparkles,
    color: "from-blue-400 to-blue-600",
    features: ["5 votes", "Standard processing", "No expiry", "$0.20 per vote"]
  },
  {
    id: "popular",
    name: "Popular Choice",
    votes: 25,
    price: calculatePrice(25),
    popular: true,
    icon: TrendingUp,
    color: "from-purple-400 to-pink-600",
    features: ["25 votes", "Priority processing", "No expiry", "$0.18 per vote", "10% savings"]
  },
  {
    id: "premium",
    name: "Premium Pack",
    votes: 50,
    price: calculatePrice(50),
    popular: false,
    icon: Zap,
    color: "from-orange-400 to-red-600",
    features: ["50 votes", "VIP processing", "No expiry", "$0.16 per vote", "20% savings"]
  },
  {
    id: "mega",
    name: "Mega Pack",
    votes: 100,
    price: calculatePrice(100),
    popular: false,
    icon: TrendingUp,
    color: "from-green-400 to-emerald-600",
    features: ["100 votes", "Instant processing", "No expiry", "$0.15 per vote", "25% savings", "Best value!"]
  }
];

export function VoterBuyVotes({ userId }: VoterBuyVotesProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [availableVotes, setAvailableVotes] = useState<number>(0);
  const [loadingVotes, setLoadingVotes] = useState(true);

  // Fetch available votes on mount
  useEffect(() => {
    const fetchAvailableVotes = async () => {
      if (!user?.profileId) return;
      
      setLoadingVotes(true);
      try {
        const response = await voteApi.getAvailableVotes<{
          profileId: string;
          availableVotes: number;
          lastFreeVoteAt: string | null;
          freeVoteAvailable: boolean;
        }>(user.profileId);
        
        if (response.success && response.data) {
          setAvailableVotes(response.data.availableVotes);
        }
      } catch (error) {
        console.error("Failed to fetch available votes:", error);
      } finally {
        setLoadingVotes(false);
      }
    };

    fetchAvailableVotes();
  }, [user?.profileId]);

  const handlePurchase = async (pkg: typeof VOTE_PACKAGES[0]) => {
    if (!userId || !user?.profileId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase votes",
        variant: "destructive",
      });
      return;
    }

    setSelectedPackage(pkg.id);
    setIsPurchasing(true);

    try {
      const response = await voteApi.purchaseVoteCredits<{
        sessionId: string;
        url: string;
        paymentId: string;
      }>({
        profileId: user.profileId,
        voteCount: pkg.votes,
        successUrl: `${window.location.origin}/payments/success?callback=/voters`,
        cancelUrl: `${window.location.origin}/voters?section=buy-votes&payment=cancelled`,
      });

      if (response.success && response.data) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to complete purchase",
        variant: "destructive",
      });
      setSelectedPackage(null);
      setIsPurchasing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Buy Votes</h1>
        <p className="text-muted-foreground">
          Purchase votes to support your favorite models in competitions
        </p>
      </div>

      {/* Available Votes Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Your Vote Balance</h3>
                <p className="text-sm text-muted-foreground">
                  Use these votes to support models in any active competition
                </p>
              </div>
            </div>
            <div className="text-right">
              {loadingVotes ? (
                <div className="animate-pulse">
                  <div className="h-10 w-20 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="text-4xl font-bold text-blue-600">{availableVotes}</div>
                  <p className="text-sm text-muted-foreground">votes available</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-purple-100">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Why Buy Votes?</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✨ Support your favorite models in competitions</li>
                <li>🏆 Help them win prizes and recognition</li>
                <li>🎁 Unlock exclusive rewards as you vote more</li>
                <li>⚡ Votes never expire - use them anytime</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vote Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {VOTE_PACKAGES.map((pkg, index) => {
          const Icon = pkg.icon;
          const isSelected = selectedPackage === pkg.id;
          const isProcessing = isPurchasing && isSelected;

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  pkg.popular ? "border-purple-500 border-2" : ""
                } ${isSelected ? "ring-2 ring-primary" : ""}`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-purple-500">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto mb-4 p-4 rounded-full bg-gradient-to-br ${pkg.color} w-fit`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <CardDescription className="text-3xl font-bold text-foreground mt-2">
                    ${pkg.price}
                  </CardDescription>
                  <p className="text-sm text-muted-foreground">{pkg.votes} votes</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <ul className="space-y-2">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Purchase Button */}
                  <Button
                    className={`w-full ${pkg.popular ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" : ""}`}
                    onClick={() => handlePurchase(pkg)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Now
                      </>
                    )}
                  </Button>

                  {/* Price per vote */}
                  <p className="text-xs text-center text-muted-foreground">
                    ${(pkg.price / pkg.votes).toFixed(2)} per vote
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">How do votes work?</h4>
            <p className="text-sm text-muted-foreground">
              Purchase votes and use them to support your favorite models in any active competition. Each vote counts towards their total score.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Do votes expire?</h4>
            <p className="text-sm text-muted-foreground">
              No! Your purchased votes never expire. You can use them anytime in any active competition.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Can I get a refund?</h4>
            <p className="text-sm text-muted-foreground">
              Due to the digital nature of votes, all sales are final. However, if you experience any issues, please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-center text-blue-800">
            🔒 All transactions are secure and encrypted. Your payment information is never stored on our servers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


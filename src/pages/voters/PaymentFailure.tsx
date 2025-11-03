import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useToast } from "@/hooks/use-toast";

export function PaymentFailure() {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Immediately redirect to voters dashboard with buy-votes section and show toast
        toast({
      title: "❌ Purchase Cancelled",
      description: "Your payment was cancelled. No charges were made. You can try again anytime.",
      duration: 5000,
    });

    // Redirect immediately
    navigate({ 
      to: "/voters", 
      search: { section: "buy-votes", payment: "cancelled" },
      replace: true 
    });
  }, [toast, navigate]);

  // This page should never be visible - it redirects immediately
  return null;
}

export default PaymentFailure;

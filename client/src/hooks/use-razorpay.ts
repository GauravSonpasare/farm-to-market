import { useState, useCallback } from "react";
import { apiRequest } from "../lib/api";

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function useRazorpay() {
  const [isLoading, setIsLoading] = useState(false);

  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const initiatePayment = useCallback(
    async (
      orderId: number,
      buyerDetails: { name: string; email: string; phone?: string },
      onSuccess: () => void,
      onError: (err: string) => void
    ) => {
      setIsLoading(true);
      try {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error("Failed to load Razorpay SDK");
        }

        // 1. Create order on backend
        const res = await apiRequest("POST", "/api/payments/create-order", {
          orderId,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to create payment order");
        }

        const data = await res.json();
        const fallbackKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

        // 2. Open Razorpay Checkout modal
        const options: RazorpayOptions = {
          key: data.keyId || fallbackKey, // Use key provided by backend or fallback to env
          amount: data.amount,
          currency: data.currency,
          name: "Farm-to-Market",
          description: `Payment for Order #${orderId}`,
          order_id: data.razorpayOrderId,
          handler: async function (response: any) {
            try {
              // 3. Verify signature on backend
              const verifyRes = await apiRequest("POST", "/api/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              });

              if (!verifyRes.ok) {
                const verifyErr = await verifyRes.json();
                throw new Error(verifyErr.message || "Payment verification failed");
              }

              onSuccess();
            } catch (err: any) {
              onError(err.message || "Payment verification failed");
            }
          },
          prefill: {
            name: buyerDetails.name,
            email: buyerDetails.email,
            contact: buyerDetails.phone || "",
          },
          theme: {
            color: "#10b981", // emerald-500
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response: any) {
          onError(response.error.description || "Payment failed");
        });
        
        razorpay.open();
      } catch (err: any) {
        onError(err.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [loadRazorpayScript]
  );

  return { initiatePayment, isLoading };
}

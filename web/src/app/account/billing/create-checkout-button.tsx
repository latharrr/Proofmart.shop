"use client";

import { useState } from "react";
import * as s from "@/components/auth/auth-styles";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Opens Razorpay's hosted checkout for the Pro plan. The order is created
 * server-side (POST /api/billing/checkout); this component only launches
 * the widget and reports success/failure — the actual plan upgrade happens
 * out-of-band via the webhook once payment is captured, so a successful
 * checkout here does not immediately flip the page's own "Free" label
 * (a page refresh a few seconds later will show Pro once the webhook has
 * landed).
 */
export default function CreateCheckoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  async function startCheckout() {
    setError(null);
    setPending(true);
    try {
      const [res, scriptOk] = await Promise.all([fetch("/api/billing/checkout", { method: "POST" }), loadRazorpayScript()]);
      if (!scriptOk) {
        setError("Could not load the payment widget. Check your connection and try again.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not start checkout.");
        return;
      }
      const order = await res.json();
      if (!window.Razorpay) {
        setError("Payment widget unavailable.");
        return;
      }
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ProofMart",
        description: `${order.planName} plan`,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: { color: "#0E1216" },
        handler: () => setStarted(true),
      });
      rzp.open();
    } catch {
      setError("Could not start checkout.");
    } finally {
      setPending(false);
    }
  }

  if (started) {
    return <div style={s.successBanner}>Payment received — your plan updates within a few seconds. Refresh to see it reflected.</div>;
  }

  return (
    <div>
      <button type="button" disabled={pending} onClick={startCheckout} className="pm-hoverable" style={{ ...s.primaryButton, width: "auto", padding: "10px 16px" }}>
        {pending ? "Starting…" : "Upgrade to Pro"}
      </button>
      {error && <div style={{ ...s.errorBanner, marginTop: 10 }}>{error}</div>}
    </div>
  );
}

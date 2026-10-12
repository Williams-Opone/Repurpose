import { FREE_QUOTA_PER_MONTH } from "@/lib/constants";
import type { BillingInterval, Plan } from "@/types";

export const PRO_PRICE: Record<BillingInterval, number> = { month: 15_000, year: 150_000 };
export const YEARLY_FREE_MONTHS = 2;
export const CURRENCY = "NGN";

export type PlanCopy = {
  id: Plan;
  name: string;
  tagline: string;
  price: Record<BillingInterval, number>;
  features: string[];
};

export const PLAN_COPY: Record<Plan, PlanCopy> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Enough to feel the difference.",
    price: { month: 0, year: 0 },
    features: [
      `${FREE_QUOTA_PER_MONTH} generations per month`,
      "All 5 formats",
      "Brand voice analysis",
      "Full history and editing",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For people who publish every week.",
    price: PRO_PRICE,
    features: [
      "Unlimited generations",
      "Unlimited brand voices",
      "Free regenerations with directions",
      "Priority generation queue",
      "Email support",
    ],
  },
};

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);

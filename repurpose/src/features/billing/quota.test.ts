import { describe, expect, it } from "vitest";

import { FREE_QUOTA_PER_MONTH } from "@/lib/constants";

import { computeEntitlements, currentPeriod, effectivePlan } from "./quota";

describe("currentPeriod", () => {
  it("formats as UTC YYYY-MM with zero padding", () => {
    expect(currentPeriod(new Date("2025-03-05T10:00:00Z"))).toBe("2025-03");
    // 23:30 local in UTC-2 could be the next day; UTC decides.
    expect(currentPeriod(new Date("2025-11-30T23:59:59Z"))).toBe("2025-11");
  });
});

describe("effectivePlan", () => {
  it("is free without a row or on a free row", () => {
    expect(effectivePlan(null)).toBe("free");
    expect(effectivePlan({ plan: "free", status: "active" })).toBe("free");
  });
  it("is pro only while the subscription is in good standing", () => {
    expect(effectivePlan({ plan: "pro", status: "active" })).toBe("pro");
    expect(effectivePlan({ plan: "pro", status: "past_due" })).toBe("pro");
    expect(effectivePlan({ plan: "pro", status: "canceled" })).toBe("free");
    expect(effectivePlan({ plan: "pro", status: "unpaid" })).toBe("free");
  });
});

describe("computeEntitlements", () => {
  it("counts down for free users and floors at zero", () => {
    expect(computeEntitlements({ plan: "free", used: 2 }).remaining).toBe(FREE_QUOTA_PER_MONTH - 2);
    expect(computeEntitlements({ plan: "free", used: 99 }).remaining).toBe(0);
  });
  it("is unlimited for pro", () => {
    const e = computeEntitlements({ plan: "pro", used: 500 });
    expect(e).toMatchObject({ unlimited: true, limit: null, remaining: null, used: 500 });
  });
});

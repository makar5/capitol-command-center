import { describe, expect, it } from "vitest";
import {
  computeExceptions,
  exceptionMatchKey,
  type ProjectSnapshot,
} from "@/lib/exceptions";

const TODAY = new Date("2026-07-25T12:00:00.000Z");

function baseSnapshot(overrides: Partial<ProjectSnapshot> = {}): ProjectSnapshot {
  return {
    projectId: "proj_test",
    today: TODAY,
    sovLines: [
      {
        id: "sov_a",
        code: "03",
        description: "Facade restoration",
        scheduledValueCents: 1_000_000_00,
        unit: "SF",
        qtyScheduled: 10000,
        sortOrder: 1,
      },
    ],
    workOrders: [],
    dailyReports: [],
    milestones: [],
    payApplications: [],
    changeOrders: [],
    ...overrides,
  };
}

describe("computeExceptions", () => {
  it("flags EVIDENCE_GAP for COMPLETED work orders older than 5 days without verification", () => {
    const snapshot = baseSnapshot({
      workOrders: [
        {
          id: "wo_gap",
          number: "WO-0031",
          title: "Facade anchor replacement, north elevation",
          sovLineId: "sov_a",
          status: "COMPLETED",
          completedAt: new Date("2026-07-16T12:00:00.000Z"),
          fieldVerifications: [],
          photoCount: 0,
        },
        {
          id: "wo_ok",
          number: "WO-0032",
          title: "Recent completion",
          sovLineId: "sov_a",
          status: "COMPLETED",
          completedAt: new Date("2026-07-23T12:00:00.000Z"),
          fieldVerifications: [],
          photoCount: 0,
        },
      ],
    });

    const result = computeExceptions(snapshot);
    const gaps = result.filter((c) => c.type === "EVIDENCE_GAP");
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.entityId).toBe("wo_gap");
    expect(gaps[0]?.message).toContain("WO-0031");
    expect(gaps[0]?.message).toContain("Facade anchor replacement, north elevation");
    expect(gaps[0]?.message).toContain("no field verification");
  });

  it("flags BURN_VS_PROGRESS when billed % exceeds verified % by more than 10 points", () => {
    const snapshot = baseSnapshot({
      workOrders: [
        {
          id: "wo_v1",
          number: "WO-0001",
          title: "Panel A",
          sovLineId: "sov_a",
          status: "VERIFIED",
          qtyVerified: 1,
          fieldVerifications: [{ id: "fv1", result: "PASS", date: TODAY }],
          photoCount: 2,
        },
        {
          id: "wo_open",
          number: "WO-0002",
          title: "Panel B",
          sovLineId: "sov_a",
          status: "IN_PROGRESS",
          fieldVerifications: [],
          photoCount: 0,
        },
        {
          id: "wo_open2",
          number: "WO-0003",
          title: "Panel C",
          sovLineId: "sov_a",
          status: "ISSUED",
          fieldVerifications: [],
          photoCount: 0,
        },
        {
          id: "wo_open3",
          number: "WO-0004",
          title: "Panel D",
          sovLineId: "sov_a",
          status: "ISSUED",
          fieldVerifications: [],
          photoCount: 0,
        },
      ],
      // 1/4 verified = 25%. Bill 50% → +25 pts over evidence.
      payApplications: [
        {
          id: "pa1",
          number: 1,
          status: "PAID",
          periodStart: new Date("2026-02-01"),
          periodEnd: new Date("2026-03-01"),
          lines: [
            {
              sovLineId: "sov_a",
              previousCents: 0,
              thisPeriodCents: 50_000_000,
              storedMaterialsCents: 0,
              retainageCents: 2_500_000,
            },
          ],
        },
      ],
    });

    const burn = computeExceptions(snapshot).filter((c) => c.type === "BURN_VS_PROGRESS");
    expect(burn).toHaveLength(1);
    expect(burn[0]?.severity).toBe("WARNING");
    expect(burn[0]?.message).toContain("SOV 03");
    expect(burn[0]?.message).toContain("over evidence");
  });

  it("flags REPORTING_GAP for weekdays in the last 7 days without a submitted report", () => {
    // TODAY is Saturday Jul 25, 2026. Last 7 days window: Jul 19–25.
    // Weekdays: Mon 20, Tue 21, Wed 22, Thu 23, Fri 24.
    const snapshot = baseSnapshot({
      dailyReports: [
        {
          id: "dr1",
          date: new Date("2026-07-20T12:00:00.000Z"),
          status: "SUBMITTED",
        },
        {
          id: "dr2",
          date: new Date("2026-07-21T12:00:00.000Z"),
          status: "SUBMITTED",
        },
        // Wed 22 missing
        {
          id: "dr3",
          date: new Date("2026-07-23T12:00:00.000Z"),
          status: "SUBMITTED",
        },
        {
          id: "dr4",
          date: new Date("2026-07-24T12:00:00.000Z"),
          status: "DRAFT",
        },
      ],
    });

    const gaps = computeExceptions(snapshot).filter((c) => c.type === "REPORTING_GAP");
    const messages = gaps.map((g) => g.message).join(" | ");
    expect(gaps.length).toBeGreaterThanOrEqual(2);
    expect(messages).toMatch(/Jul 22|July 22|Wed/);
    expect(messages).toMatch(/Jul 24|July 24|Fri/);
  });

  it("resolution matching keys align candidates with existing alerts", () => {
    const snapshot = baseSnapshot({
      workOrders: [
        {
          id: "wo_gap",
          number: "WO-0031",
          title: "Facade anchor replacement, north elevation",
          sovLineId: "sov_a",
          status: "COMPLETED",
          completedAt: new Date("2026-07-10T12:00:00.000Z"),
          fieldVerifications: [],
          photoCount: 0,
        },
      ],
    });

    const before = computeExceptions(snapshot);
    const gap = before.find((c) => c.type === "EVIDENCE_GAP");
    expect(gap).toBeTruthy();

    const existingKey = exceptionMatchKey({
      type: "EVIDENCE_GAP",
      entityType: "WorkOrder",
      entityId: "wo_gap",
    });
    expect(exceptionMatchKey(gap!)).toBe(existingKey);

    // Condition cleared — verification exists
    const after = computeExceptions({
      ...snapshot,
      workOrders: [
        {
          ...snapshot.workOrders[0]!,
          status: "VERIFIED",
          verifiedAt: TODAY,
          fieldVerifications: [{ id: "fv", result: "PASS", date: TODAY }],
          photoCount: 2,
        },
      ],
    });
    const afterKeys = new Set(after.map((c) => exceptionMatchKey(c)));
    expect(afterKeys.has(existingKey)).toBe(false);
  });
});

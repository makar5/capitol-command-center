import { PrismaClient } from "@prisma/client";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
  isWeekend,
  subDays,
  subMonths,
  startOfDay,
} from "date-fns";
import { ensureSeedUploadDir, writePlaceholderSvg } from "./seed-photos";
import { seedPortfolioProjects } from "./seed-portfolio";

const prisma = new PrismaClient();

const WorkOrderStatus = {
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  VERIFIED: "VERIFIED",
  DEFICIENT: "DEFICIENT",
} as const;
type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];

const MilestoneStatus = {
  PENDING: "PENDING",
  AT_RISK: "AT_RISK",
  COMPLETE: "COMPLETE",
} as const;

const ChangeOrderStatus = {
  PROPOSED: "PROPOSED",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

const PayApplicationStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  PAID: "PAID",
} as const;

const PhotoKind = {
  BEFORE: "BEFORE",
  PROGRESS: "PROGRESS",
  AFTER: "AFTER",
  DEFECT: "DEFECT",
} as const;
type PhotoKind = (typeof PhotoKind)[keyof typeof PhotoKind];

const VerificationResult = {
  PASS: "PASS",
  FAIL: "FAIL",
  PARTIAL: "PARTIAL",
} as const;
type VerificationResult = (typeof VerificationResult)[keyof typeof VerificationResult];

const DailyReportStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
} as const;

const DocumentCategory = {
  CONTRACT: "CONTRACT",
  SUBMITTAL: "SUBMITTAL",
  RFI: "RFI",
  PERMIT: "PERMIT",
  INSURANCE: "INSURANCE",
  PAYROLL: "PAYROLL",
  OTHER: "OTHER",
} as const;
type DocumentCategoryValue = (typeof DocumentCategory)[keyof typeof DocumentCategory];

const SITE_LAT = 38.89905;
const SITE_LNG = -77.0398;
const TODAY = startOfDay(new Date());
const PROJECT_START = startOfDay(subMonths(TODAY, 5));
const PROJECT_END = startOfDay(addMonths(PROJECT_START, 26));
const CONTRACT_VALUE_CENTS = 1_840_000_000; // $18,400,000

type ChecklistItem = { item: string; status: "pass" | "fail" | "na"; note?: string };

const CHECKLISTS: Record<string, string[]> = {
  mechanical: [
    "Duct supports per SMACNA",
    "Insulation thickness per spec 23 07 00",
    "Equipment pads level and grouted",
    "Access clearances maintained",
    "Nameplates affixed and legible",
  ],
  electrical: [
    "Conduit bends within code limits",
    "Grounding continuity verified",
    "Panel directories match approved shop drawings",
    "Wire labeling complete",
    "Box fill within NEC limits",
  ],
  facade: [
    "Anchor spacing per spec 04 01 00",
    "Mortar color match approved sample",
    "No spalling at adjacent units",
    "Joint width within tolerance",
    "Weep vents clear and spaced",
  ],
  abatement: [
    "Containment negative pressure maintained",
    "Waste bags double-bagged and labeled",
    "Final clearance air monitoring passed",
    "Decon unit operational log current",
    "Adjacent finishes protected",
  ],
};

function jitterCoord(base: number, spread = 0.0008): number {
  return base + (Math.random() - 0.5) * spread * 2;
}

function pick<T>(items: T[], index: number): T {
  return items[index % items.length]!;
}

function woNumber(n: number): string {
  return `WO-${String(n).padStart(4, "0")}`;
}

function templateNarrative(args: {
  date: Date;
  weather: string;
  crewSummary: string;
  workLines: string[];
  delays: string;
  safety: string;
}): string {
  const work =
    args.workLines.length > 0
      ? args.workLines.map((w) => `• ${w}`).join("\n")
      : "• No definable features of work recorded for this date.";
  return [
    `Daily report for ${format(args.date, "MMMM d, yyyy")}.`,
    "",
    "Work performed (by definable feature of work):",
    work,
    "",
    `Crew and equipment: ${args.crewSummary}`,
    "",
    `Weather: ${args.weather}.`,
    "",
    args.delays
      ? `Delays: ${args.delays}`
      : "Delays: None recorded.",
    "",
    args.safety
      ? `Safety: ${args.safety}`
      : "Safety: No incidents recorded. Stretch and flex conducted at 06:45. PPE compliance observed.",
    "",
    "Coordination: Subcontractor foremen attended 07:00 huddle. Outstanding RFIs tracked with the project engineer.",
  ].join("\n");
}

async function clearAll(): Promise<void> {
  await prisma.payAppLine.deleteMany();
  await prisma.payApplication.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.fieldVerification.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.changeOrder.deleteMany();
  await prisma.exceptionAlert.deleteMany();
  await prisma.document.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.sovLine.deleteMany();
  await prisma.subcontract.deleteMany();
  await prisma.user.deleteMany();
  await prisma.project.deleteMany();
  await prisma.organization.deleteMany();
}

async function main(): Promise<void> {
  console.log("Seeding Franklin Court demo project…");
  await clearAll();

  const uploadDir = ensureSeedUploadDir();

  const gsa = await prisma.organization.create({
    data: {
      id: "org_gsa",
      name: "U.S. General Services Administration",
      type: "OWNER_AGENCY",
    },
  });

  const prime = await prisma.organization.create({
    data: {
      id: "org_meridian",
      name: "Meridian Federal Constructors",
      type: "PRIME",
    },
  });

  const subMech = await prisma.organization.create({
    data: {
      id: "org_sub_atlas",
      name: "Atlas Climate Systems LLC",
      type: "SUBCONTRACTOR",
    },
  });
  const subElec = await prisma.organization.create({
    data: {
      id: "org_sub_capitol",
      name: "Capitol Peak Electric Co.",
      type: "SUBCONTRACTOR",
    },
  });
  const subFacade = await prisma.organization.create({
    data: {
      id: "org_sub_potomac",
      name: "Potomac Masonry & Facade Inc.",
      type: "SUBCONTRACTOR",
    },
  });
  const subAbate = await prisma.organization.create({
    data: {
      id: "org_sub_clearpath",
      name: "ClearPath Environmental Services",
      type: "SUBCONTRACTOR",
    },
  });

  await prisma.user.createMany({
    data: [
      {
        id: "user_exec",
        name: "Helen Vargas",
        email: "helen.vargas@meridianfederal.example",
        role: "EXECUTIVE",
        organizationId: prime.id,
      },
      {
        id: "user_pm",
        name: "Marcus Chen",
        email: "marcus.chen@meridianfederal.example",
        role: "PROJECT_MANAGER",
        organizationId: prime.id,
      },
      {
        id: "user_fi",
        name: "Priya Nair",
        email: "priya.nair@meridianfederal.example",
        role: "FIELD_INSPECTOR",
        organizationId: prime.id,
      },
    ],
  });

  const project = await prisma.project.create({
    data: {
      id: "proj_franklin",
      name: "Franklin Court Federal Building — Phase 1 Modernization",
      contractNumber: "47PA0326C0018",
      owningAgency: "GSA",
      primeContractorId: prime.id,
      contractValueCents: CONTRACT_VALUE_CENTS,
      retainagePct: 5,
      startDate: PROJECT_START,
      endDate: PROJECT_END,
      status: "ACTIVE",
      address: "1700 Pennsylvania Avenue NW, Washington, DC 20006",
      lat: SITE_LAT,
      lng: SITE_LNG,
      description:
        "Hypothetical Phase 1 modernization of a federal office building including selective demolition and abatement, facade and roof restoration, MEP upgrades, elevator modernization, and interior finishes. Seed data for product demonstration only.",
    },
  });

  const sovDefs: Array<{
    id: string;
    code: string;
    description: string;
    scheduledValueCents: number;
    unit?: string;
    qtyScheduled?: number;
  }> = [
    { id: "sov_01", code: "01", description: "Demolition & abatement", scheduledValueCents: 120_000_000, unit: "LS", qtyScheduled: 1 },
    { id: "sov_02", code: "02", description: "Structural repairs", scheduledValueCents: 180_000_000, unit: "LS", qtyScheduled: 1 },
    { id: "sov_03", code: "03", description: "Facade restoration", scheduledValueCents: 240_000_000, unit: "SF", qtyScheduled: 42000 },
    { id: "sov_04", code: "04", description: "Roofing", scheduledValueCents: 98_000_000, unit: "SF", qtyScheduled: 28000 },
    { id: "sov_05", code: "05", description: "Windows", scheduledValueCents: 145_000_000, unit: "EA", qtyScheduled: 312 },
    { id: "sov_06", code: "06", description: "HVAC", scheduledValueCents: 210_000_000, unit: "LS", qtyScheduled: 1 },
    { id: "sov_07", code: "07", description: "Electrical", scheduledValueCents: 165_000_000, unit: "LS", qtyScheduled: 1 },
    { id: "sov_08", code: "08", description: "Plumbing", scheduledValueCents: 92_000_000, unit: "LS", qtyScheduled: 1 },
    { id: "sov_09", code: "09", description: "Fire protection", scheduledValueCents: 78_000_000, unit: "LS", qtyScheduled: 1 },
    { id: "sov_10", code: "10", description: "Elevators", scheduledValueCents: 110_000_000, unit: "EA", qtyScheduled: 4 },
    { id: "sov_11", code: "11", description: "Interior finishes", scheduledValueCents: 185_000_000, unit: "SF", qtyScheduled: 96000 },
    { id: "sov_12", code: "12", description: "Security systems", scheduledValueCents: 64_000_000, unit: "LS", qtyScheduled: 1 },
    { id: "sov_13", code: "13", description: "Sitework", scheduledValueCents: 73_000_000, unit: "LS", qtyScheduled: 1 },
    { id: "sov_14", code: "14", description: "General conditions", scheduledValueCents: 80_000_000, unit: "LS", qtyScheduled: 1 },
  ];

  const sovSum = sovDefs.reduce((s, x) => s + x.scheduledValueCents, 0);
  if (sovSum !== CONTRACT_VALUE_CENTS) {
    throw new Error(`SOV sum ${sovSum} != contract ${CONTRACT_VALUE_CENTS}`);
  }

  await prisma.sovLine.createMany({
    data: sovDefs.map((s, i) => ({
      id: s.id,
      projectId: project.id,
      code: s.code,
      description: s.description,
      scheduledValueCents: s.scheduledValueCents,
      unit: s.unit,
      qtyScheduled: s.qtyScheduled,
      sortOrder: i + 1,
    })),
  });

  await prisma.milestone.createMany({
    data: [
      {
        id: "ms_01",
        projectId: project.id,
        name: "Notice to proceed / mobilization",
        plannedDate: PROJECT_START,
        actualDate: PROJECT_START,
        status: MilestoneStatus.COMPLETE,
      },
      {
        id: "ms_02",
        projectId: project.id,
        name: "Abatement complete — floors 2–4",
        plannedDate: addMonths(PROJECT_START, 2),
        actualDate: addDays(addMonths(PROJECT_START, 2), 3),
        status: MilestoneStatus.COMPLETE,
      },
      {
        id: "ms_03",
        projectId: project.id,
        name: "Facade restoration 50%",
        plannedDate: addMonths(PROJECT_START, 4),
        actualDate: addDays(addMonths(PROJECT_START, 4), -5),
        status: MilestoneStatus.COMPLETE,
      },
      {
        id: "ms_04",
        projectId: project.id,
        name: "Roof dry-in complete",
        plannedDate: addMonths(PROJECT_START, 5),
        forecastDate: addDays(addMonths(PROJECT_START, 5), 12),
        status: MilestoneStatus.AT_RISK,
      },
      {
        id: "ms_05",
        projectId: project.id,
        name: "AHU-1 / AHU-2 set and connected",
        plannedDate: addMonths(PROJECT_START, 8),
        forecastDate: addMonths(PROJECT_START, 8),
        status: MilestoneStatus.PENDING,
      },
      {
        id: "ms_06",
        projectId: project.id,
        name: "Elevator modernization complete",
        plannedDate: addMonths(PROJECT_START, 14),
        forecastDate: addMonths(PROJECT_START, 14),
        status: MilestoneStatus.PENDING,
      },
      {
        id: "ms_07",
        projectId: project.id,
        name: "Substantial completion",
        plannedDate: addMonths(PROJECT_START, 24),
        forecastDate: addMonths(PROJECT_START, 24),
        status: MilestoneStatus.PENDING,
      },
      {
        id: "ms_08",
        projectId: project.id,
        name: "Final completion / closeout",
        plannedDate: PROJECT_END,
        forecastDate: PROJECT_END,
        status: MilestoneStatus.PENDING,
      },
    ],
  });

  const scMech = await prisma.subcontract.create({
    data: {
      id: "sc_mech",
      projectId: project.id,
      subcontractorId: subMech.id,
      trade: "Mechanical / HVAC",
      valueCents: 280_000_000,
    },
  });
  const scElec = await prisma.subcontract.create({
    data: {
      id: "sc_elec",
      projectId: project.id,
      subcontractorId: subElec.id,
      trade: "Electrical",
      valueCents: 195_000_000,
    },
  });
  const scFacade = await prisma.subcontract.create({
    data: {
      id: "sc_facade",
      projectId: project.id,
      subcontractorId: subFacade.id,
      trade: "Facade / masonry",
      valueCents: 320_000_000,
    },
  });
  const scAbate = await prisma.subcontract.create({
    data: {
      id: "sc_abate",
      projectId: project.id,
      subcontractorId: subAbate.id,
      trade: "Abatement",
      valueCents: 140_000_000,
    },
  });

  type WoPlan = {
    title: string;
    description: string;
    subcontractId: string;
    sovLineId: string;
    status: WorkOrderStatus;
    tradeKey: keyof typeof CHECKLISTS;
    qtyClaimed: number;
    qtyVerified?: number;
    daysAgoIssued: number;
    daysDueAfterIssue: number;
    daysToComplete?: number;
    daysToVerify?: number;
    fail?: boolean;
  };

  const woPlans: WoPlan[] = [];

  const titlesBySov: Record<string, string[]> = {
    sov_01: ["Remove ACM flooring — Level 3 east", "Demo partition walls — Level 2 west", "Abate pipe insulation — mechanical penthouse"],
    sov_02: ["Repair concrete beam B-12", "Shore and patch slab opening Level 4", "Install steel lintel — north elevation"],
    sov_03: ["Repoint limestone panels — north elev. bay 3–6", "Replace cracked terra cotta units — west elev.", "Install through-wall flashing — Level 5"],
    sov_04: ["Install vapor barrier — east roof quadrant", "Set insulation and cover board — west roof", "Flash mechanical curbs — penthouse"],
    sov_05: ["Replace punched windows — Level 3 north", "Install storefront — lobby west", "Seal window perimeters — Level 2 south"],
    sov_06: ["Set VAV boxes — Level 4 zone B", "Install supply duct main — Level 2 corridor", "Connect condenser water riser — core A"],
    sov_07: ["Pull feeder — panel MDP to DP-2", "Install lighting package — Level 3 open office", "Terminate devices — Level 2 conference wing"],
    sov_08: ["Rough-in restrooms — Level 4 north", "Set domestic water riser — core B", "Install floor drains — Level 1 kitchen prep"],
    sov_09: ["Hang sprinkler mains — Level 3", "Install fire pump controller", "Test flow switch — standpipe zone 2"],
    sov_10: ["Modernize car #2 controller", "Install new hoist ropes — car #1", "Set machine-room ventilation"],
    sov_11: ["Hang ACT ceiling — Level 2 east", "Install GWB — Level 3 corridors", "Paint finish coats — Level 2 lobby"],
    sov_12: ["Install card readers — Level 1 egress", "Pull security backbone — riser A", "Mount cameras — perimeter Level 1"],
    sov_13: ["Reset pavers — south plaza", "Install bike rack foundations", "Temp construction fence relocation"],
    sov_14: ["Site logistics layout update", "Weekly temporary protection walkdown"],
  };

  // Build ~45 WOs with target status distribution
  const statusQueue: WorkOrderStatus[] = [
    ...Array(18).fill(WorkOrderStatus.VERIFIED),
    ...Array(8).fill(WorkOrderStatus.COMPLETED),
    ...Array(10).fill(WorkOrderStatus.IN_PROGRESS),
    ...Array(5).fill(WorkOrderStatus.ISSUED),
    ...Array(2).fill(WorkOrderStatus.DEFICIENT),
    ...Array(2).fill(WorkOrderStatus.DRAFT),
  ];

  const subForSov = (sovId: string): { subcontractId: string; tradeKey: keyof typeof CHECKLISTS } => {
    if (sovId === "sov_01") return { subcontractId: scAbate.id, tradeKey: "abatement" };
    if (sovId === "sov_03" || sovId === "sov_04" || sovId === "sov_05") {
      return { subcontractId: scFacade.id, tradeKey: "facade" };
    }
    if (sovId === "sov_06" || sovId === "sov_08" || sovId === "sov_09" || sovId === "sov_10") {
      return { subcontractId: scMech.id, tradeKey: "mechanical" };
    }
    return { subcontractId: scElec.id, tradeKey: "electrical" };
  };

  let planIdx = 0;
  for (const status of statusQueue) {
    const sov = sovDefs[planIdx % sovDefs.length]!;
    const titles = titlesBySov[sov.id] ?? [`Work on ${sov.description}`];
    const title = pick(titles, planIdx);
    const { subcontractId, tradeKey } = subForSov(sov.id);

    const daysAgoIssued =
      status === WorkOrderStatus.DRAFT
        ? 2
        : status === WorkOrderStatus.ISSUED
          ? 4 + (planIdx % 5)
          : status === WorkOrderStatus.IN_PROGRESS
            ? 15 + (planIdx % 20)
            : status === WorkOrderStatus.COMPLETED
              ? 20 + (planIdx % 25)
              : status === WorkOrderStatus.DEFICIENT
                ? 25 + (planIdx % 10)
                : 40 + (planIdx % 80);

    const daysDueAfterIssue = 10 + (planIdx % 14);
    const daysToComplete =
      status === WorkOrderStatus.VERIFIED ||
      status === WorkOrderStatus.COMPLETED ||
      status === WorkOrderStatus.DEFICIENT
        ? Math.min(daysDueAfterIssue - 1 + (planIdx % 3), daysAgoIssued - 3)
        : undefined;

    const daysToVerify =
      status === WorkOrderStatus.VERIFIED || status === WorkOrderStatus.DEFICIENT
        ? (daysToComplete ?? 5) + 1 + (planIdx % 3)
        : undefined;

    woPlans.push({
      title,
      description: `${title}. Perform work per approved submittals and project specifications. Coordinate with adjacent trades prior to start.`,
      subcontractId,
      sovLineId: sov.id,
      status,
      tradeKey,
      qtyClaimed: 1 + (planIdx % 8),
      qtyVerified:
        status === WorkOrderStatus.VERIFIED
          ? 1 + (planIdx % 8)
          : status === WorkOrderStatus.DEFICIENT
            ? Math.max(0, (planIdx % 8) - 1)
            : undefined,
      daysAgoIssued,
      daysDueAfterIssue,
      daysToComplete: daysToComplete && daysToComplete > 0 ? daysToComplete : undefined,
      daysToVerify: daysToVerify && daysToVerify > 0 ? daysToVerify : undefined,
      fail: status === WorkOrderStatus.DEFICIENT,
    });
    planIdx++;
  }

  // Make a few COMPLETED WOs wait >5 days (evidence gap for Phase 2)
  for (let i = 0; i < 3; i++) {
    const completed = woPlans.filter((w) => w.status === WorkOrderStatus.COMPLETED);
    const target = completed[i];
    if (target) {
      target.daysAgoIssued = 30;
      target.daysToComplete = 18;
      target.daysDueAfterIssue = 20;
    }
  }

  // Make one DEFICIENT open >10 days
  const deficient = woPlans.find((w) => w.status === WorkOrderStatus.DEFICIENT);
  if (deficient) {
    deficient.daysAgoIssued = 40;
    deficient.daysToComplete = 25;
    deficient.daysToVerify = 22;
  }

  const workOrders: Array<{
    id: string;
    number: string;
    status: WorkOrderStatus;
    sovLineId: string;
    issuedAt: Date | null;
    completedAt: Date | null;
    verifiedAt: Date | null;
    tradeKey: keyof typeof CHECKLISTS;
    fail?: boolean;
    title: string;
  }> = [];

  for (let i = 0; i < woPlans.length; i++) {
    const plan = woPlans[i]!;
    const number = woNumber(i + 1);
    const id = `wo_${String(i + 1).padStart(4, "0")}`;
    const issuedAt =
      plan.status === WorkOrderStatus.DRAFT
        ? null
        : subDays(TODAY, plan.daysAgoIssued);
    const dueDate = issuedAt
      ? addDays(issuedAt, plan.daysDueAfterIssue)
      : addDays(TODAY, plan.daysDueAfterIssue);
    const completedAt =
      plan.daysToComplete != null && issuedAt
        ? addDays(issuedAt, plan.daysToComplete)
        : null;
    const verifiedAt =
      plan.daysToVerify != null && issuedAt
        ? addDays(issuedAt, plan.daysToVerify)
        : null;

    await prisma.workOrder.create({
      data: {
        id,
        projectId: project.id,
        number,
        title: plan.title,
        description: plan.description,
        subcontractId: plan.subcontractId,
        sovLineId: plan.sovLineId,
        status: plan.status,
        issuedAt,
        dueDate,
        completedAt,
        verifiedAt,
        qtyClaimed: plan.qtyClaimed,
        qtyVerified: plan.qtyVerified ?? null,
      },
    });

    workOrders.push({
      id,
      number,
      status: plan.status,
      sovLineId: plan.sovLineId,
      issuedAt,
      completedAt,
      verifiedAt,
      tradeKey: plan.tradeKey,
      fail: plan.fail,
      title: plan.title,
    });
  }

  // Field verifications + photos for VERIFIED / DEFICIENT
  let photoSeq = 0;
  const photoKindsCycle: PhotoKind[] = [
    PhotoKind.BEFORE,
    PhotoKind.PROGRESS,
    PhotoKind.AFTER,
    PhotoKind.DEFECT,
  ];

  for (const wo of workOrders) {
    if (wo.status !== WorkOrderStatus.VERIFIED && wo.status !== WorkOrderStatus.DEFICIENT) {
      // Still attach some progress photos to in-progress / completed
      if (
        wo.status === WorkOrderStatus.IN_PROGRESS ||
        wo.status === WorkOrderStatus.COMPLETED
      ) {
        const count = wo.status === WorkOrderStatus.COMPLETED ? 2 : 1;
        for (let p = 0; p < count; p++) {
          photoSeq++;
          const kind = p === 0 ? PhotoKind.BEFORE : PhotoKind.PROGRESS;
          const takenAt = addDays(wo.issuedAt ?? PROJECT_START, 2 + p);
          const url = writePlaceholderSvg(
            {
              filename: `photo_${String(photoSeq).padStart(4, "0")}.svg`,
              woNumber: wo.number,
              kind,
              dateLabel: format(takenAt, "yyyy-MM-dd"),
            },
            uploadDir,
          );
          await prisma.photo.create({
            data: {
              id: `photo_${String(photoSeq).padStart(4, "0")}`,
              projectId: project.id,
              workOrderId: wo.id,
              url,
              kind,
              lat: jitterCoord(SITE_LAT),
              lng: jitterCoord(SITE_LNG),
              takenAt,
              caption: `${kind.toLowerCase()} — ${wo.title}`,
            },
          });
        }
      }
      continue;
    }

    const items = CHECKLISTS[wo.tradeKey] ?? CHECKLISTS.mechanical!;
    const checklist: ChecklistItem[] = items.map((item, idx) => {
      if (wo.fail && idx === 1) {
        return {
          item,
          status: "fail",
          note: "Does not meet approved sample / specification. Remediation required.",
        };
      }
      if (idx === items.length - 1 && !wo.fail) {
        return { item, status: "na" };
      }
      return { item, status: "pass" };
    });

    const result: VerificationResult = wo.fail
      ? VerificationResult.FAIL
      : VerificationResult.PASS;

    const fv = await prisma.fieldVerification.create({
      data: {
        id: `fv_${wo.id}`,
        workOrderId: wo.id,
        inspectorName: "Priya Nair",
        date: wo.verifiedAt ?? TODAY,
        result,
        notes: wo.fail
          ? "Work does not conform. See failed checklist items. Follow-up work order to be issued for remediation."
          : "Work conforms to contract documents. Quantity verified in field.",
        checklist: JSON.stringify(checklist),
      },
    });

    const photoCount = wo.fail ? 2 : 2 + (photoSeq % 2); // verified mostly ≥2; a few can be low for Phase 2 INFO
    // Intentionally under-photo a couple verified WOs
    const actualCount =
      wo.status === WorkOrderStatus.VERIFIED && ["wo_0001", "wo_0005"].includes(wo.id)
        ? 1
        : Math.max(2, photoCount);

    for (let p = 0; p < actualCount; p++) {
      photoSeq++;
      const kind = wo.fail
        ? p === 0
          ? PhotoKind.PROGRESS
          : PhotoKind.DEFECT
        : pick([PhotoKind.BEFORE, PhotoKind.PROGRESS, PhotoKind.AFTER], p);
      const takenAt = addDays(wo.completedAt ?? wo.verifiedAt ?? TODAY, p === 0 ? -1 : 0);
      const url = writePlaceholderSvg(
        {
          filename: `photo_${String(photoSeq).padStart(4, "0")}.svg`,
          woNumber: wo.number,
          kind,
          dateLabel: format(takenAt, "yyyy-MM-dd"),
        },
        uploadDir,
      );
      await prisma.photo.create({
        data: {
          id: `photo_${String(photoSeq).padStart(4, "0")}`,
          projectId: project.id,
          workOrderId: wo.id,
          fieldVerificationId: fv.id,
          url,
          kind,
          lat: jitterCoord(SITE_LAT),
          lng: jitterCoord(SITE_LNG),
          takenAt,
          caption: `${kind.toLowerCase()} — ${wo.title}`,
        },
      });
    }
  }

  // Pad photos to ~120, skipping WOs intentionally left with a photo gap
  const photoGapWoIds = new Set(["wo_0001", "wo_0005"]);
  const padTargets = workOrders.filter((w) => !photoGapWoIds.has(w.id));
  while (photoSeq < 120) {
    const wo = pick(padTargets, photoSeq);
    photoSeq++;
    const kind = pick(photoKindsCycle, photoSeq);
    const takenAt = addDays(PROJECT_START, (photoSeq * 3) % 140);
    const url = writePlaceholderSvg(
      {
        filename: `photo_${String(photoSeq).padStart(4, "0")}.svg`,
        woNumber: wo.number,
        kind,
        dateLabel: format(takenAt, "yyyy-MM-dd"),
      },
      uploadDir,
    );
    await prisma.photo.create({
      data: {
        id: `photo_${String(photoSeq).padStart(4, "0")}`,
        projectId: project.id,
        workOrderId: wo.id,
        url,
        kind,
        lat: jitterCoord(SITE_LAT),
        lng: jitterCoord(SITE_LNG),
        takenAt,
        caption: `${kind.toLowerCase()} field photo — ${wo.number}`,
      },
    });
  }

  // Daily reports — weekdays over 5 months (~100)
  const allDays = eachDayOfInterval({ start: PROJECT_START, end: TODAY });
  const weekdays = allDays.filter((d) => !isWeekend(d));
  // Leave last 2 weekdays without submitted reports for reporting-gap exception
  const reportDays = weekdays.slice(0, Math.max(0, weekdays.length - 2));

  let safetyIncidentsLeft = 2;
  const delayPool = [
    "Weather delay: sustained winds above hoist limit; exterior work suspended 4 hours.",
    "Material delivery delay: limestone panels arrived 1 day late from fabricator.",
    "Inspection hold: GSA QA requested re-review of facade mock-up joint detail before proceeding.",
    "",
    "",
    "",
    "",
  ];

  for (let i = 0; i < reportDays.length; i++) {
    const date = reportDays[i]!;
    const sovA = sovDefs[i % sovDefs.length]!;
    const sovB = sovDefs[(i + 3) % sovDefs.length]!;
    const crew = [
      {
        organization: "Meridian Federal Constructors",
        trade: "General labor / supervision",
        headcount: 6 + (i % 4),
        hours: 8,
      },
      {
        organization: "Atlas Climate Systems LLC",
        trade: "Mechanical",
        headcount: 3 + (i % 3),
        hours: 8,
      },
      {
        organization: "Capitol Peak Electric Co.",
        trade: "Electrical",
        headcount: 2 + (i % 3),
        hours: 8,
      },
      {
        organization: "Potomac Masonry & Facade Inc.",
        trade: "Facade / masonry",
        headcount: 4 + (i % 2),
        hours: 8,
      },
    ];
    const workPerformed = [
      {
        sovLineId: sovA.id,
        description: `Continued ${sovA.description.toLowerCase()} per daily plan.`,
        qty: 1 + (i % 5),
        unit: sovA.unit,
      },
      {
        sovLineId: sovB.id,
        description: `Progress on ${sovB.description.toLowerCase()}.`,
        qty: 1 + ((i + 2) % 4),
        unit: sovB.unit,
      },
    ];
    const equipment = [
      { name: "Scissor lift 26'", count: 2, status: "operational" },
      { name: "Material hoist", count: 1, status: i % 17 === 0 ? "down for inspection" : "operational" },
      { name: "Air compressor", count: 1, status: "operational" },
    ];

    let safety = "";
    if (safetyIncidentsLeft > 0 && (i === 22 || i === 61)) {
      safety =
        safetyIncidentsLeft === 2
          ? "Minor: worker reported hand abrasion while handling metal stud; first aid administered. Corrective action: cut-resistant gloves reinforced at toolbox talk."
          : "Minor: near-miss when unsecured conduit stack shifted on cart. No injury. Corrective action: carts fitted with side restraints; re-training completed next shift.";
      safetyIncidentsLeft--;
    }

    const delays = pick(delayPool, i);
    const tempLow = 38 + (i % 20);
    const tempHigh = tempLow + 12 + (i % 8);
    const weather = `${i % 5 === 0 ? "Partly cloudy" : i % 7 === 0 ? "Light rain a.m." : "Clear"}; winds ${5 + (i % 10)} mph`;

    const narrative = templateNarrative({
      date,
      weather: `${weather}; ${tempLow}–${tempHigh}°F`,
      crewSummary: crew
        .map((c) => `${c.headcount} ${c.trade} (${c.organization})`)
        .join("; "),
      workLines: workPerformed.map(
        (w) =>
          `${sovDefs.find((s) => s.id === w.sovLineId)?.code ?? "—"} ${w.description}${
            w.qty != null ? ` (${w.qty} ${w.unit ?? ""})` : ""
          }`,
      ),
      delays,
      safety,
    });

    const report = await prisma.dailyReport.create({
      data: {
        id: `dr_${format(date, "yyyyMMdd")}`,
        projectId: project.id,
        date,
        weatherSummary: weather,
        tempLowF: tempLow,
        tempHighF: tempHigh,
        crew: JSON.stringify(crew),
        workPerformed: JSON.stringify(workPerformed),
        equipment: JSON.stringify(equipment),
        safetyIncidents: safety || "None",
        delays: delays || "None",
        visitorLog:
          i % 9 === 0
            ? "GSA project manager (14:00–15:30); commissioning agent walkthrough Level 2."
            : i % 11 === 0
              ? "Owner's AE site visit (09:30–11:00)."
              : "None",
        narrative,
        status: DailyReportStatus.SUBMITTED,
      },
    });

    // Attach a photo to some reports
    if (i % 4 === 0 && photoSeq < 140) {
      photoSeq++;
      const url = writePlaceholderSvg(
        {
          filename: `photo_${String(photoSeq).padStart(4, "0")}.svg`,
          woNumber: "SITE",
          kind: "PROGRESS",
          dateLabel: format(date, "yyyy-MM-dd"),
        },
        uploadDir,
      );
      await prisma.photo.create({
        data: {
          id: `photo_${String(photoSeq).padStart(4, "0")}`,
          projectId: project.id,
          dailyReportId: report.id,
          url,
          kind: PhotoKind.PROGRESS,
          lat: jitterCoord(SITE_LAT),
          lng: jitterCoord(SITE_LNG),
          takenAt: date,
          caption: `Daily progress — ${format(date, "MMM d, yyyy")}`,
        },
      });
    }
  }

  // Change orders
  await prisma.changeOrder.createMany({
    data: [
      {
        id: "co_01",
        projectId: project.id,
        number: "CO-001",
        title: "Unforeseen ACM behind Level 3 chase walls",
        description:
          "Additional abatement of previously concealed ACM discovered during selective demolition of chase walls on Level 3. Agency-directed to proceed under unit rates.",
        amountCents: 186_500_00,
        status: ChangeOrderStatus.APPROVED,
        submittedAt: addMonths(PROJECT_START, 1),
        decidedAt: addDays(addMonths(PROJECT_START, 1), 18),
      },
      {
        id: "co_02",
        projectId: project.id,
        number: "CO-002",
        title: "Agency-directed lobby security vestibule",
        description:
          "Add mantrap vestibule and associated card access hardware at main lobby per GSA directive dated month 3.",
        amountCents: 242_000_00,
        status: ChangeOrderStatus.APPROVED,
        submittedAt: addMonths(PROJECT_START, 3),
        decidedAt: addDays(addMonths(PROJECT_START, 3), 21),
      },
      {
        id: "co_03",
        projectId: project.id,
        number: "CO-003",
        title: "Upgrade elevator cab finishes — cars 1–2",
        description:
          "Owner requested upgrade from standard to specified premium cab finish package.",
        amountCents: 78_400_00,
        status: ChangeOrderStatus.SUBMITTED,
        submittedAt: subDays(TODAY, 12),
      },
      {
        id: "co_04",
        projectId: project.id,
        number: "CO-004",
        title: "Additional roof drain relocation",
        description:
          "Proposed relocation of two roof drains to clear new mechanical curb layout.",
        amountCents: 34_200_00,
        status: ChangeOrderStatus.PROPOSED,
      },
      {
        id: "co_05",
        projectId: project.id,
        number: "CO-005",
        title: "Premium limestone veneer substitution",
        description:
          "Contractor proposed substitution of limestone veneer for cost/schedule. Rejected; retain specified stone.",
        amountCents: -12_000_00,
        status: ChangeOrderStatus.REJECTED,
        submittedAt: addMonths(PROJECT_START, 2),
        decidedAt: addDays(addMonths(PROJECT_START, 2), 14),
      },
    ],
  });

  // Pay applications — progress curves roughly aligned with verified work
  // Distribute billed amounts across SOV lines for apps 1–3 paid, 4 draft
  const verifiedBySov = new Map<string, number>();
  for (const wo of workOrders) {
    if (wo.status === WorkOrderStatus.VERIFIED) {
      verifiedBySov.set(wo.sovLineId, (verifiedBySov.get(wo.sovLineId) ?? 0) + 1);
    }
  }

  // Target cumulative billed % of each SOV by end of app 3 (~18–28% depending on verified density)
  // Force cumulative billed % on select lines well above verified WO share
  // so Phase 2 variance chips (+10 pts over evidence) light up in demos.
  const forcedCumulativeBilledPct: Record<string, number> = {
    sov_06: 0.55, // HVAC — typically ~33% verified by WO count
    sov_08: 0.52, // Plumbing
    sov_11: 0.5, // Interior finishes
  };

  function periodAmount(
    sovId: string,
    scheduled: number,
    periodIndex: number, // 0..3
  ): number {
    const verifiedCount = verifiedBySov.get(sovId) ?? 0;
    const basePct = Math.min(0.35, 0.08 + verifiedCount * 0.04);
    // Spread across 3 paid periods; draft period 4 gets smaller suggested amount
    const weights = [0.3, 0.35, 0.25, 0.1];
    const targetCumulative = forcedCumulativeBilledPct[sovId] ?? basePct;
    // Allocate target across periods 0–2; period 3 (draft) stays small
    const paidWeightSum = weights[0]! + weights[1]! + weights[2]!;
    let fraction: number;
    if (periodIndex <= 2 && forcedCumulativeBilledPct[sovId] != null) {
      fraction = targetCumulative * ((weights[periodIndex] ?? 0) / paidWeightSum);
    } else if (periodIndex <= 2) {
      fraction = basePct * (weights[periodIndex] ?? 0);
    } else {
      fraction = (forcedCumulativeBilledPct[sovId] != null ? 0.02 : basePct) * (weights[3] ?? 0.1);
    }
    const cents = Math.round(scheduled * fraction);
    // Round to nearest dollar
    return Math.floor(cents / 100) * 100;
  }

  const retainagePct = 0.05;
  const payPeriods = [
    {
      number: 1,
      status: PayApplicationStatus.PAID,
      start: PROJECT_START,
      end: addMonths(PROJECT_START, 1),
      submittedAt: addDays(addMonths(PROJECT_START, 1), 3),
      approvedAt: addDays(addMonths(PROJECT_START, 1), 17),
      paidAt: addDays(addMonths(PROJECT_START, 1), 38),
    },
    {
      number: 2,
      status: PayApplicationStatus.PAID,
      start: addDays(addMonths(PROJECT_START, 1), 1),
      end: addMonths(PROJECT_START, 2),
      submittedAt: addDays(addMonths(PROJECT_START, 2), 2),
      approvedAt: addDays(addMonths(PROJECT_START, 2), 14),
      paidAt: addDays(addMonths(PROJECT_START, 2), 32),
    },
    {
      number: 3,
      status: PayApplicationStatus.PAID,
      start: addDays(addMonths(PROJECT_START, 2), 1),
      end: addMonths(PROJECT_START, 4),
      submittedAt: addDays(addMonths(PROJECT_START, 4), 4),
      approvedAt: addDays(addMonths(PROJECT_START, 4), 18),
      paidAt: addDays(addMonths(PROJECT_START, 4), 40),
    },
    {
      number: 4,
      status: PayApplicationStatus.DRAFT,
      start: addDays(addMonths(PROJECT_START, 4), 1),
      end: TODAY,
      submittedAt: null,
      approvedAt: null,
      paidAt: null,
    },
  ];

  const cumulativePrevious = new Map<string, number>();
  for (const sov of sovDefs) cumulativePrevious.set(sov.id, 0);

  for (const period of payPeriods) {
    const app = await prisma.payApplication.create({
      data: {
        id: `payapp_${period.number}`,
        projectId: project.id,
        number: period.number,
        periodStart: period.start,
        periodEnd: period.end,
        status: period.status,
        submittedAt: period.submittedAt,
        approvedAt: period.approvedAt,
        paidAt: period.paidAt,
      },
    });

    for (const sov of sovDefs) {
      const previous = cumulativePrevious.get(sov.id) ?? 0;
      const thisPeriod = periodAmount(sov.id, sov.scheduledValueCents, period.number - 1);
      const stored = period.number === 2 && sov.id === "sov_06" ? 15_000_00 : 0;
      const retainage = Math.round((thisPeriod + stored) * retainagePct);
      await prisma.payAppLine.create({
        data: {
          id: `pal_${period.number}_${sov.code}`,
          payApplicationId: app.id,
          sovLineId: sov.id,
          previousCents: previous,
          thisPeriodCents: thisPeriod,
          storedMaterialsCents: stored,
          retainageCents: retainage,
        },
      });
      cumulativePrevious.set(sov.id, previous + thisPeriod);
    }
  }

  // Documents
  const docs: Array<{
    id: string;
    title: string;
    category: DocumentCategoryValue;
    tags: string[];
    daysAgo: number;
  }> = [
    { id: "doc_01", title: "Executed contract — 47PA0326C0018", category: DocumentCategory.CONTRACT, tags: ["executed", "base"], daysAgo: 150 },
    { id: "doc_02", title: "NTP letter", category: DocumentCategory.CONTRACT, tags: ["ntp"], daysAgo: 148 },
    { id: "doc_03", title: "Submittal 03 30 00 — concrete mix design", category: DocumentCategory.SUBMITTAL, tags: ["approved"], daysAgo: 120 },
    { id: "doc_04", title: "Submittal 04 01 00 — mortar sample", category: DocumentCategory.SUBMITTAL, tags: ["approved", "facade"], daysAgo: 110 },
    { id: "doc_05", title: "RFI-014 — beam pocket dimension conflict", category: DocumentCategory.RFI, tags: ["closed"], daysAgo: 90 },
    { id: "doc_06", title: "RFI-022 — roof curb height at AHU-2", category: DocumentCategory.RFI, tags: ["open"], daysAgo: 20 },
    { id: "doc_07", title: "Building permit — Phase 1 modernization", category: DocumentCategory.PERMIT, tags: ["active"], daysAgo: 145 },
    { id: "doc_08", title: "Occupational / public space permit — sidewalk shed", category: DocumentCategory.PERMIT, tags: ["active"], daysAgo: 140 },
    { id: "doc_09", title: "Certificate of insurance — Meridian Federal", category: DocumentCategory.INSURANCE, tags: ["current"], daysAgo: 40 },
    { id: "doc_10", title: "Certificate of insurance — Atlas Climate", category: DocumentCategory.INSURANCE, tags: ["current"], daysAgo: 35 },
    { id: "doc_11", title: "Certified payroll — week ending prior Friday", category: DocumentCategory.PAYROLL, tags: ["davis-bacon"], daysAgo: 7 },
    { id: "doc_12", title: "Quality control plan — revision 2", category: DocumentCategory.OTHER, tags: ["cqc"], daysAgo: 100 },
  ];

  await prisma.document.createMany({
    data: docs.map((d) => ({
      id: d.id,
      projectId: project.id,
      title: d.title,
      category: d.category,
      url: `/uploads/seed/docs/${d.id}.txt`,
      uploadedAt: subDays(TODAY, d.daysAgo),
      tags: JSON.stringify(d.tags),
    })),
  });

  // Write simple document placeholders
  const docsDir = `${uploadDir}/docs`;
  const fs = await import("fs");
  fs.mkdirSync(docsDir, { recursive: true });
  for (const d of docs) {
    fs.writeFileSync(
      `${docsDir}/${d.id}.txt`,
      `${d.title}\n\nPlaceholder document for Franklin Court Federal Building seed data.\nContract 47PA0326C0018\n`,
      "utf8",
    );
  }

  // Exception alerts are computed on first dashboard load via refreshExceptions.

  console.log(`Franklin Court seeded: ${workOrders.length} WOs, ${photoSeq} photos, ${reportDays.length} daily reports`);

  await prisma.organization.createMany({
    data: [
      {
        id: "org_va",
        name: "U.S. Department of Veterans Affairs",
        type: "OWNER_AGENCY",
      },
      {
        id: "org_usace",
        name: "U.S. Army Corps of Engineers",
        type: "OWNER_AGENCY",
      },
    ],
  });

  await seedPortfolioProjects(prisma, {
    primeId: prime.id,
    subMechId: subMech.id,
    subElecId: subElec.id,
    subFacadeId: subFacade.id,
    subAbateId: subAbate.id,
  });

  console.log("Seed complete — 4 demo projects ready.");
  void gsa;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

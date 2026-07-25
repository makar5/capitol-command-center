/**
 * Compact seeders for additional demo projects so sales can flip between sites.
 * Franklin Court remains the rich flagship in seed.ts; these add distinct stories.
 */
import { PrismaClient } from "@prisma/client";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
  isWeekend,
  startOfDay,
  subDays,
  subMonths,
} from "date-fns";
import fs from "fs";
import path from "path";
import { ensureSeedUploadDir, writePlaceholderSvg } from "./seed-photos";

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

const VerificationResult = {
  PASS: "PASS",
  FAIL: "FAIL",
  PARTIAL: "PARTIAL",
} as const;

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

type Profile = "evidence_stress" | "on_hold" | "closeout";

export type PortfolioOrgRefs = {
  primeId: string;
  subMechId: string;
  subElecId: string;
  subFacadeId: string;
  subAbateId: string;
};

type SovDef = {
  code: string;
  description: string;
  scheduledValueCents: number;
  unit?: string;
  qtyScheduled?: number;
};

type PortfolioConfig = {
  id: string;
  prefix: string;
  name: string;
  shortLabel: string;
  contractNumber: string;
  owningAgency: string;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETE";
  contractValueCents: number;
  retainagePct: number;
  startMonthsAgo: number;
  durationMonths: number;
  address: string;
  lat: number;
  lng: number;
  description: string;
  profile: Profile;
  sovLines: SovDef[];
  milestoneNames: string[];
  woTitles: string[];
};

const TODAY = startOfDay(new Date());

const CHECKLIST = [
  "Work matches approved drawings",
  "Materials per approved submittal",
  "Tolerances within specification",
  "Adjacent finishes protected",
  "Housekeeping acceptable",
];

function pid(prefix: string, kind: string, n: string | number): string {
  return `${prefix}_${kind}_${n}`;
}

function woNumber(n: number): string {
  return `WO-${String(n).padStart(4, "0")}`;
}

function jitter(base: number, salt: number, spread = 0.0009): number {
  const t = Math.sin(salt * 12.9898) * 43758.5453;
  const frac = t - Math.floor(t);
  return base + (frac - 0.5) * spread * 2;
}

function templateNarrative(args: {
  date: Date;
  weather: string;
  crewSummary: string;
  workLines: string[];
  delays: string;
}): string {
  const work =
    args.workLines.length > 0
      ? args.workLines.map((w) => `• ${w}`).join("\n")
      : "• Limited activity recorded for this date.";
  return [
    `Daily report for ${format(args.date, "MMMM d, yyyy")}.`,
    "",
    "Work performed:",
    work,
    "",
    `Crew and equipment: ${args.crewSummary}`,
    "",
    `Weather: ${args.weather}.`,
    "",
    args.delays ? `Delays: ${args.delays}` : "Delays: None recorded.",
    "",
    "Safety: Stretch and flex conducted. PPE compliance observed.",
  ].join("\n");
}

async function seedOneProject(
  prisma: PrismaClient,
  orgs: PortfolioOrgRefs,
  cfg: PortfolioConfig,
): Promise<void> {
  const start = startOfDay(subMonths(TODAY, cfg.startMonthsAgo));
  const end = startOfDay(addMonths(start, cfg.durationMonths));
  const uploadDir = ensureSeedUploadDir();
  const projectUploadDir = path.join(uploadDir, cfg.prefix);
  fs.mkdirSync(projectUploadDir, { recursive: true });

  const sovSum = cfg.sovLines.reduce((s, x) => s + x.scheduledValueCents, 0);
  if (sovSum !== cfg.contractValueCents) {
    throw new Error(
      `${cfg.id}: SOV sum ${sovSum} != contract ${cfg.contractValueCents}`,
    );
  }

  const project = await prisma.project.create({
    data: {
      id: cfg.id,
      name: cfg.name,
      contractNumber: cfg.contractNumber,
      owningAgency: cfg.owningAgency,
      primeContractorId: orgs.primeId,
      contractValueCents: cfg.contractValueCents,
      retainagePct: cfg.retainagePct,
      startDate: start,
      endDate: end,
      status: cfg.status,
      address: cfg.address,
      lat: cfg.lat,
      lng: cfg.lng,
      description: cfg.description,
    },
  });

  await prisma.sovLine.createMany({
    data: cfg.sovLines.map((s, i) => ({
      id: pid(cfg.prefix, "sov", s.code),
      projectId: project.id,
      code: s.code,
      description: s.description,
      scheduledValueCents: s.scheduledValueCents,
      unit: s.unit,
      qtyScheduled: s.qtyScheduled,
      sortOrder: i + 1,
    })),
  });

  const milestoneStatuses =
    cfg.profile === "closeout"
      ? [
          MilestoneStatus.COMPLETE,
          MilestoneStatus.COMPLETE,
          MilestoneStatus.COMPLETE,
          MilestoneStatus.COMPLETE,
          MilestoneStatus.COMPLETE,
          MilestoneStatus.AT_RISK,
          MilestoneStatus.PENDING,
          MilestoneStatus.PENDING,
        ]
      : cfg.profile === "on_hold"
        ? [
            MilestoneStatus.COMPLETE,
            MilestoneStatus.COMPLETE,
            MilestoneStatus.AT_RISK,
            MilestoneStatus.AT_RISK,
            MilestoneStatus.PENDING,
            MilestoneStatus.PENDING,
            MilestoneStatus.PENDING,
            MilestoneStatus.PENDING,
          ]
        : [
            MilestoneStatus.COMPLETE,
            MilestoneStatus.COMPLETE,
            MilestoneStatus.COMPLETE,
            MilestoneStatus.AT_RISK,
            MilestoneStatus.PENDING,
            MilestoneStatus.PENDING,
            MilestoneStatus.PENDING,
            MilestoneStatus.PENDING,
          ];

  await prisma.milestone.createMany({
    data: cfg.milestoneNames.slice(0, 8).map((name, i) => {
      const planned = addMonths(start, Math.round((cfg.durationMonths * i) / 7));
      const status = milestoneStatuses[i] ?? MilestoneStatus.PENDING;
      return {
        id: pid(cfg.prefix, "ms", String(i + 1).padStart(2, "0")),
        projectId: project.id,
        name,
        plannedDate: planned,
        actualDate:
          status === MilestoneStatus.COMPLETE
            ? addDays(planned, i % 3 === 0 ? 2 : -2)
            : null,
        forecastDate:
          status === MilestoneStatus.AT_RISK
            ? addDays(planned, 14)
            : status === MilestoneStatus.PENDING
              ? planned
              : null,
        status,
      };
    }),
  });

  const scMech = await prisma.subcontract.create({
    data: {
      id: pid(cfg.prefix, "sc", "mech"),
      projectId: project.id,
      subcontractorId: orgs.subMechId,
      trade: "Mechanical / HVAC",
      valueCents: Math.round(cfg.contractValueCents * 0.18),
    },
  });
  const scElec = await prisma.subcontract.create({
    data: {
      id: pid(cfg.prefix, "sc", "elec"),
      projectId: project.id,
      subcontractorId: orgs.subElecId,
      trade: "Electrical",
      valueCents: Math.round(cfg.contractValueCents * 0.14),
    },
  });
  const scFacade = await prisma.subcontract.create({
    data: {
      id: pid(cfg.prefix, "sc", "facade"),
      projectId: project.id,
      subcontractorId: orgs.subFacadeId,
      trade: "Specialty trades",
      valueCents: Math.round(cfg.contractValueCents * 0.16),
    },
  });
  const scAbate = await prisma.subcontract.create({
    data: {
      id: pid(cfg.prefix, "sc", "abate"),
      projectId: project.id,
      subcontractorId: orgs.subAbateId,
      trade: "Abatement / selective demo",
      valueCents: Math.round(cfg.contractValueCents * 0.1),
    },
  });

  const subs = [scMech, scElec, scFacade, scAbate];
  const sovIds = cfg.sovLines.map((s) => pid(cfg.prefix, "sov", s.code));

  type StatusPlan = {
    status: WorkOrderStatus;
    daysAgoIssued: number;
    daysDueAfterIssue: number;
    daysToComplete?: number;
    daysToVerify?: number;
    fail?: boolean;
    skipPhotos?: boolean;
  };

  const statusPlans: StatusPlan[] =
    cfg.profile === "evidence_stress"
      ? [
          { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 90, daysDueAfterIssue: 21, daysToComplete: 14, daysToVerify: 16 },
          { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 75, daysDueAfterIssue: 21, daysToComplete: 12, daysToVerify: 15 },
          { status: WorkOrderStatus.COMPLETED, daysAgoIssued: 40, daysDueAfterIssue: 21, daysToComplete: 18, skipPhotos: true },
          { status: WorkOrderStatus.COMPLETED, daysAgoIssued: 35, daysDueAfterIssue: 21, daysToComplete: 20 },
          { status: WorkOrderStatus.COMPLETED, daysAgoIssued: 28, daysDueAfterIssue: 14, daysToComplete: 16, skipPhotos: true },
          { status: WorkOrderStatus.COMPLETED, daysAgoIssued: 22, daysDueAfterIssue: 14, daysToComplete: 12 },
          { status: WorkOrderStatus.DEFICIENT, daysAgoIssued: 45, daysDueAfterIssue: 21, daysToComplete: 18, daysToVerify: 20, fail: true },
          { status: WorkOrderStatus.DEFICIENT, daysAgoIssued: 30, daysDueAfterIssue: 14, daysToComplete: 12, daysToVerify: 14, fail: true },
          { status: WorkOrderStatus.IN_PROGRESS, daysAgoIssued: 12, daysDueAfterIssue: 21 },
          { status: WorkOrderStatus.IN_PROGRESS, daysAgoIssued: 8, daysDueAfterIssue: 14 },
          { status: WorkOrderStatus.ISSUED, daysAgoIssued: 5, daysDueAfterIssue: 21 },
          { status: WorkOrderStatus.ISSUED, daysAgoIssued: 3, daysDueAfterIssue: 14 },
          { status: WorkOrderStatus.DRAFT, daysAgoIssued: 1, daysDueAfterIssue: 21 },
          { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 60, daysDueAfterIssue: 21, daysToComplete: 10, daysToVerify: 12 },
          { status: WorkOrderStatus.COMPLETED, daysAgoIssued: 18, daysDueAfterIssue: 14, daysToComplete: 10, skipPhotos: true },
          { status: WorkOrderStatus.IN_PROGRESS, daysAgoIssued: 20, daysDueAfterIssue: 10 },
          { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 50, daysDueAfterIssue: 21, daysToComplete: 11, daysToVerify: 13 },
          { status: WorkOrderStatus.COMPLETED, daysAgoIssued: 25, daysDueAfterIssue: 21, daysToComplete: 15 },
          { status: WorkOrderStatus.ISSUED, daysAgoIssued: 16, daysDueAfterIssue: 7 },
          { status: WorkOrderStatus.DEFICIENT, daysAgoIssued: 55, daysDueAfterIssue: 21, daysToComplete: 20, daysToVerify: 22, fail: true },
        ]
      : cfg.profile === "on_hold"
        ? [
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 120, daysDueAfterIssue: 21, daysToComplete: 14, daysToVerify: 16 },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 100, daysDueAfterIssue: 21, daysToComplete: 12, daysToVerify: 14 },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 90, daysDueAfterIssue: 21, daysToComplete: 10, daysToVerify: 12 },
            { status: WorkOrderStatus.COMPLETED, daysAgoIssued: 80, daysDueAfterIssue: 21, daysToComplete: 18 },
            { status: WorkOrderStatus.IN_PROGRESS, daysAgoIssued: 45, daysDueAfterIssue: 21 },
            { status: WorkOrderStatus.IN_PROGRESS, daysAgoIssued: 40, daysDueAfterIssue: 14 },
            { status: WorkOrderStatus.ISSUED, daysAgoIssued: 35, daysDueAfterIssue: 21 },
            { status: WorkOrderStatus.ISSUED, daysAgoIssued: 30, daysDueAfterIssue: 14 },
            { status: WorkOrderStatus.DRAFT, daysAgoIssued: 25, daysDueAfterIssue: 21 },
            { status: WorkOrderStatus.DEFICIENT, daysAgoIssued: 70, daysDueAfterIssue: 21, daysToComplete: 15, daysToVerify: 18, fail: true },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 110, daysDueAfterIssue: 21, daysToComplete: 11, daysToVerify: 13 },
            { status: WorkOrderStatus.COMPLETED, daysAgoIssued: 60, daysDueAfterIssue: 21, daysToComplete: 20 },
            { status: WorkOrderStatus.ISSUED, daysAgoIssued: 50, daysDueAfterIssue: 14 },
            { status: WorkOrderStatus.IN_PROGRESS, daysAgoIssued: 55, daysDueAfterIssue: 10 },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 95, daysDueAfterIssue: 21, daysToComplete: 9, daysToVerify: 11 },
            { status: WorkOrderStatus.DRAFT, daysAgoIssued: 20, daysDueAfterIssue: 21 },
          ]
        : [
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 200, daysDueAfterIssue: 21, daysToComplete: 14, daysToVerify: 16 },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 180, daysDueAfterIssue: 21, daysToComplete: 12, daysToVerify: 14 },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 160, daysDueAfterIssue: 21, daysToComplete: 10, daysToVerify: 12 },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 140, daysDueAfterIssue: 21, daysToComplete: 11, daysToVerify: 13 },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 120, daysDueAfterIssue: 21, daysToComplete: 9, daysToVerify: 11 },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 100, daysDueAfterIssue: 21, daysToComplete: 10, daysToVerify: 12 },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 80, daysDueAfterIssue: 21, daysToComplete: 12, daysToVerify: 14 },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 60, daysDueAfterIssue: 21, daysToComplete: 10, daysToVerify: 12 },
            { status: WorkOrderStatus.COMPLETED, daysAgoIssued: 40, daysDueAfterIssue: 21, daysToComplete: 18 },
            { status: WorkOrderStatus.COMPLETED, daysAgoIssued: 30, daysDueAfterIssue: 14, daysToComplete: 12 },
            { status: WorkOrderStatus.DEFICIENT, daysAgoIssued: 50, daysDueAfterIssue: 21, daysToComplete: 16, daysToVerify: 18, fail: true },
            { status: WorkOrderStatus.DEFICIENT, daysAgoIssued: 35, daysDueAfterIssue: 14, daysToComplete: 12, daysToVerify: 14, fail: true },
            { status: WorkOrderStatus.IN_PROGRESS, daysAgoIssued: 15, daysDueAfterIssue: 21 },
            { status: WorkOrderStatus.ISSUED, daysAgoIssued: 10, daysDueAfterIssue: 14 },
            { status: WorkOrderStatus.DRAFT, daysAgoIssued: 5, daysDueAfterIssue: 21 },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 90, daysDueAfterIssue: 21, daysToComplete: 8, daysToVerify: 10 },
            { status: WorkOrderStatus.VERIFIED, daysAgoIssued: 70, daysDueAfterIssue: 21, daysToComplete: 9, daysToVerify: 11 },
            { status: WorkOrderStatus.COMPLETED, daysAgoIssued: 25, daysDueAfterIssue: 14, daysToComplete: 10 },
          ];

  let photoSeq = 0;
  const workOrderIds: string[] = [];

  for (let i = 0; i < statusPlans.length; i++) {
    const plan = statusPlans[i]!;
    const title = cfg.woTitles[i % cfg.woTitles.length]!;
    const sovLineId = sovIds[i % sovIds.length]!;
    const subcontractId = subs[i % subs.length]!.id;
    const issuedAt = subDays(TODAY, plan.daysAgoIssued);
    const dueDate = addDays(issuedAt, plan.daysDueAfterIssue);
    const completedAt =
      plan.daysToComplete != null ? addDays(issuedAt, plan.daysToComplete) : null;
    const verifiedAt =
      plan.daysToVerify != null ? addDays(issuedAt, plan.daysToVerify) : null;
    const qtyClaimed = 1;
    const qtyVerified =
      plan.status === WorkOrderStatus.VERIFIED
        ? 1
        : plan.status === WorkOrderStatus.DEFICIENT
          ? 0.5
          : undefined;

    const woId = pid(cfg.prefix, "wo", String(i + 1).padStart(4, "0"));
    workOrderIds.push(woId);

    await prisma.workOrder.create({
      data: {
        id: woId,
        projectId: project.id,
        number: woNumber(i + 1),
        title,
        description: `${title} — ${cfg.shortLabel} seed scope.`,
        status: plan.status,
        subcontractId,
        sovLineId,
        qtyClaimed,
        qtyVerified: qtyVerified ?? null,
        issuedAt: plan.status === WorkOrderStatus.DRAFT ? null : issuedAt,
        dueDate,
        completedAt,
        verifiedAt,
      },
    });

    if (
      plan.status === WorkOrderStatus.VERIFIED ||
      plan.status === WorkOrderStatus.DEFICIENT
    ) {
      const checklist = CHECKLIST.map((item, ci) => ({
        item,
        status: plan.fail && ci === 1 ? ("fail" as const) : ("pass" as const),
        note: plan.fail && ci === 1 ? "Punch item outstanding" : undefined,
      }));
      await prisma.fieldVerification.create({
        data: {
          id: pid(cfg.prefix, "fv", String(i + 1).padStart(4, "0")),
          workOrderId: woId,
          date: verifiedAt ?? completedAt ?? TODAY,
          result: plan.fail
            ? VerificationResult.FAIL
            : VerificationResult.PASS,
          checklist: JSON.stringify(checklist),
          notes: plan.fail
            ? "Deficiency noted — re-inspection required."
            : "Accepted as installed.",
          inspectorName: "Priya Nair",
        },
      });
    }

    if (
      !plan.skipPhotos &&
      plan.status !== WorkOrderStatus.DRAFT &&
      plan.status !== WorkOrderStatus.ISSUED
    ) {
      const kinds =
        plan.status === WorkOrderStatus.DEFICIENT
          ? [PhotoKind.PROGRESS, PhotoKind.DEFECT]
          : [PhotoKind.BEFORE, PhotoKind.PROGRESS, PhotoKind.AFTER];
      for (const kind of kinds) {
        photoSeq += 1;
        const filename = `${cfg.prefix}_photo_${String(photoSeq).padStart(4, "0")}.svg`;
        const url = writePlaceholderSvg(
          {
            filename,
            woNumber: woNumber(i + 1),
            kind,
            dateLabel: format(completedAt ?? issuedAt, "MMM d, yyyy"),
            projectLabel: cfg.shortLabel,
          },
          projectUploadDir,
          cfg.prefix,
        );
        await prisma.photo.create({
          data: {
            id: pid(cfg.prefix, "photo", String(photoSeq).padStart(4, "0")),
            projectId: project.id,
            workOrderId: woId,
            kind,
            url,
            caption: `${kind} — ${title}`,
            takenAt: completedAt ?? issuedAt,
            lat: jitter(cfg.lat, photoSeq),
            lng: jitter(cfg.lng, photoSeq + 17),
          },
        });
      }
    }
  }

  // Daily reports (cap length so long-running closeout jobs stay demo-snappy)
  const reportEnd =
    cfg.profile === "on_hold" ? subDays(TODAY, 18) : subDays(TODAY, 1);
  const reportWindowStart =
    cfg.profile === "closeout" ? subMonths(TODAY, 5) : start;
  const allDays = eachDayOfInterval({
    start: reportWindowStart < start ? start : reportWindowStart,
    end: reportEnd,
  }).filter((d) => !isWeekend(d));
  const omitTail =
    cfg.profile === "on_hold"
      ? 0
      : cfg.profile === "evidence_stress"
        ? 3
        : 1;
  const reportDays = allDays.slice(0, Math.max(0, allDays.length - omitTail));

  const weathers = ["Clear", "Partly cloudy", "Overcast", "Light rain", "Windy"];
  for (let i = 0; i < reportDays.length; i++) {
    const date = reportDays[i]!;
    const workLines = [
      cfg.woTitles[i % cfg.woTitles.length]!,
      cfg.woTitles[(i + 3) % cfg.woTitles.length]!,
    ];
    const narrative = templateNarrative({
      date,
      weather: weathers[i % weathers.length]!,
      crewSummary: `${18 + (i % 7)} craft · ${3 + (i % 3)} supervision`,
      workLines,
      delays:
        cfg.profile === "on_hold" && i > reportDays.length - 5
          ? "Owner-directed pause pending design rebaseline."
          : "",
    });
    const drId = pid(cfg.prefix, "dr", format(date, "yyyyMMdd"));
    const delayText =
      cfg.profile === "on_hold" && i > reportDays.length - 5
        ? "Owner-directed pause pending design rebaseline."
        : "None";
    await prisma.dailyReport.create({
      data: {
        id: drId,
        projectId: project.id,
        date,
        status: DailyReportStatus.SUBMITTED,
        weatherSummary: weathers[i % weathers.length]!,
        tempLowF: 42 + (i % 20),
        tempHighF: 58 + (i % 22),
        narrative,
        crew: JSON.stringify([
          {
            organization: "Meridian Federal Constructors",
            trade: "General",
            headcount: 12 + (i % 5),
            hours: 8,
          },
          {
            organization: "Atlas Climate Systems",
            trade: "Mechanical",
            headcount: 4 + (i % 3),
            hours: 8,
          },
          {
            organization: "Capitol Voltage Electric",
            trade: "Electrical",
            headcount: 3 + (i % 2),
            hours: 8,
          },
        ]),
        workPerformed: JSON.stringify(
          workLines.map((w, wi) => ({
            sovLineId: sovIds[wi % sovIds.length],
            description: w,
            qty: 1,
            unit: "LS",
          })),
        ),
        equipment: JSON.stringify([
          { name: "Scissor lift", count: 2, status: "operating" },
          { name: "Forklift", count: 1, status: "operating" },
        ]),
        delays: delayText,
        safetyIncidents: "None",
        visitorLog: i % 8 === 0 ? "Agency COR site walk (10:00–11:30)." : "None",
      },
    });
  }

  // Change orders
  const cos =
    cfg.profile === "on_hold"
      ? [
          { n: 1, status: ChangeOrderStatus.APPROVED, daysAgo: 90, amount: 180_000_00 },
          { n: 2, status: ChangeOrderStatus.SUBMITTED, daysAgo: 40, amount: 95_000_00 },
          { n: 3, status: ChangeOrderStatus.PROPOSED, daysAgo: 20, amount: 220_000_00 },
          { n: 4, status: ChangeOrderStatus.PROPOSED, daysAgo: 10, amount: 45_000_00 },
        ]
      : cfg.profile === "closeout"
        ? [
            { n: 1, status: ChangeOrderStatus.APPROVED, daysAgo: 200, amount: 125_000_00 },
            { n: 2, status: ChangeOrderStatus.APPROVED, daysAgo: 150, amount: 88_000_00 },
            { n: 3, status: ChangeOrderStatus.APPROVED, daysAgo: 90, amount: 42_000_00 },
            { n: 4, status: ChangeOrderStatus.REJECTED, daysAgo: 40, amount: 60_000_00 },
          ]
        : [
            { n: 1, status: ChangeOrderStatus.APPROVED, daysAgo: 70, amount: 75_000_00 },
            { n: 2, status: ChangeOrderStatus.SUBMITTED, daysAgo: 25, amount: 110_000_00 },
            { n: 3, status: ChangeOrderStatus.PROPOSED, daysAgo: 12, amount: 38_000_00 },
            { n: 4, status: ChangeOrderStatus.APPROVED, daysAgo: 50, amount: 22_000_00 },
          ];

  for (const co of cos) {
    await prisma.changeOrder.create({
      data: {
        id: pid(cfg.prefix, "co", String(co.n).padStart(2, "0")),
        projectId: project.id,
        number: `CO-${String(co.n).padStart(3, "0")}`,
        title: `${cfg.shortLabel} change ${co.n}`,
        description: `Seed change order for ${cfg.name}.`,
        amountCents: co.amount,
        status: co.status,
        submittedAt:
          co.status === ChangeOrderStatus.PROPOSED
            ? null
            : subDays(TODAY, co.daysAgo),
        decidedAt:
          co.status === ChangeOrderStatus.APPROVED ||
          co.status === ChangeOrderStatus.REJECTED
            ? subDays(TODAY, Math.max(0, co.daysAgo - 10))
            : null,
      },
    });
  }

  // Pay applications — progress fractions by profile
  const payApps =
    cfg.profile === "on_hold"
      ? [
          { n: 1, status: PayApplicationStatus.PAID, periodEndDaysAgo: 90, frac: 0.12 },
          { n: 2, status: PayApplicationStatus.PAID, periodEndDaysAgo: 60, frac: 0.1 },
          { n: 3, status: PayApplicationStatus.SUBMITTED, periodEndDaysAgo: 30, frac: 0.08 },
          { n: 4, status: PayApplicationStatus.DRAFT, periodEndDaysAgo: 5, frac: 0.04 },
        ]
      : cfg.profile === "closeout"
        ? [
            { n: 1, status: PayApplicationStatus.PAID, periodEndDaysAgo: 180, frac: 0.22 },
            { n: 2, status: PayApplicationStatus.PAID, periodEndDaysAgo: 120, frac: 0.2 },
            { n: 3, status: PayApplicationStatus.PAID, periodEndDaysAgo: 60, frac: 0.18 },
            { n: 4, status: PayApplicationStatus.APPROVED, periodEndDaysAgo: 20, frac: 0.15 },
            { n: 5, status: PayApplicationStatus.DRAFT, periodEndDaysAgo: 2, frac: 0.08 },
          ]
        : [
            { n: 1, status: PayApplicationStatus.PAID, periodEndDaysAgo: 75, frac: 0.1 },
            { n: 2, status: PayApplicationStatus.PAID, periodEndDaysAgo: 45, frac: 0.09 },
            { n: 3, status: PayApplicationStatus.SUBMITTED, periodEndDaysAgo: 15, frac: 0.08 },
            { n: 4, status: PayApplicationStatus.DRAFT, periodEndDaysAgo: 2, frac: 0.05 },
          ];

  const cumulativePrevious = new Map<string, number>();
  for (const s of sovIds) cumulativePrevious.set(s, 0);

  for (const pa of payApps) {
    const periodTo = subDays(TODAY, pa.periodEndDaysAgo);
    const periodFrom = subDays(periodTo, 29);
    const appId = pid(cfg.prefix, "payapp", String(pa.n));
    await prisma.payApplication.create({
      data: {
        id: appId,
        projectId: project.id,
        number: pa.n,
        periodStart: periodFrom,
        periodEnd: periodTo,
        status: pa.status,
        submittedAt:
          pa.status === PayApplicationStatus.DRAFT
            ? null
            : addDays(periodTo, 2),
        approvedAt:
          pa.status === PayApplicationStatus.APPROVED ||
          pa.status === PayApplicationStatus.PAID
            ? addDays(periodTo, 10)
            : null,
        paidAt:
          pa.status === PayApplicationStatus.PAID
            ? addDays(periodTo, 25)
            : null,
      },
    });

    for (let si = 0; si < cfg.sovLines.length; si++) {
      const sov = cfg.sovLines[si]!;
      const sovId = pid(cfg.prefix, "sov", sov.code);
      const previous = cumulativePrevious.get(sovId) ?? 0;
      // Closeout: underbill early SOV lines so UNBILLED_VERIFIED can fire;
      // evidence_stress: modest burn; on_hold: conservative.
      let thisPeriod = Math.round(sov.scheduledValueCents * pa.frac * (0.7 + (si % 5) * 0.05));
      if (cfg.profile === "closeout" && si < 3) {
        thisPeriod = Math.round(thisPeriod * 0.55);
      }
      if (cfg.profile === "evidence_stress" && (si === 2 || si === 5)) {
        thisPeriod = Math.round(thisPeriod * 1.35);
      }
      const remaining = sov.scheduledValueCents - previous;
      thisPeriod = Math.max(0, Math.min(thisPeriod, remaining));
      const retainage = Math.round(thisPeriod * (cfg.retainagePct / 100));
      await prisma.payAppLine.create({
        data: {
          id: pid(cfg.prefix, `pal${pa.n}`, sov.code),
          payApplicationId: appId,
          sovLineId: sovId,
          previousCents: previous,
          thisPeriodCents: thisPeriod,
          storedMaterialsCents: 0,
          retainageCents: retainage,
        },
      });
      cumulativePrevious.set(sovId, previous + thisPeriod);
    }
  }

  const docs = [
    { n: 1, title: `Executed contract — ${cfg.contractNumber}`, category: DocumentCategory.CONTRACT, daysAgo: cfg.startMonthsAgo * 30 },
    { n: 2, title: "NTP letter", category: DocumentCategory.CONTRACT, daysAgo: cfg.startMonthsAgo * 30 - 2 },
    { n: 3, title: "Baseline schedule — revision 1", category: DocumentCategory.OTHER, daysAgo: 40 },
    { n: 4, title: "Certificate of insurance — Meridian Federal", category: DocumentCategory.INSURANCE, daysAgo: 25 },
    { n: 5, title: "Certified payroll — recent period", category: DocumentCategory.PAYROLL, daysAgo: 7 },
    { n: 6, title: `Site permit — ${cfg.owningAgency}`, category: DocumentCategory.PERMIT, daysAgo: 60 },
  ];

  const docsDir = path.join(projectUploadDir, "docs");
  fs.mkdirSync(docsDir, { recursive: true });
  await prisma.document.createMany({
    data: docs.map((d) => {
      const id = pid(cfg.prefix, "doc", String(d.n).padStart(2, "0"));
      const file = `${id}.txt`;
      fs.writeFileSync(
        path.join(docsDir, file),
        `${d.title}\n\nPlaceholder for ${cfg.name}\nContract ${cfg.contractNumber}\n`,
        "utf8",
      );
      return {
        id,
        projectId: project.id,
        title: d.title,
        category: d.category,
        url: `/uploads/seed/${cfg.prefix}/docs/${file}`,
        uploadedAt: subDays(TODAY, d.daysAgo),
        tags: JSON.stringify(["seed"]),
      };
    }),
  });

  console.log(
    `  + ${cfg.shortLabel}: ${workOrderIds.length} WOs, ${photoSeq} photos, ${reportDays.length} daily reports (${cfg.status}/${cfg.profile})`,
  );
}

/** VA ambulatory clinic — ACTIVE, verification lag / photo gaps. */
const VA_CONFIG: PortfolioConfig = {
  id: "proj_va_ambulatory",
  prefix: "va",
  name: "VA Medical Center — Ambulatory Care Renovation",
  shortLabel: "VA Ambulatory",
  contractNumber: "36C24526C0087",
  owningAgency: "VA",
  status: "ACTIVE",
  contractValueCents: 12_600_000_00, // $12.6M
  retainagePct: 5,
  startMonthsAgo: 4,
  durationMonths: 18,
  address: "50 Irving Street NW, Washington, DC 20422",
  lat: 38.9295,
  lng: -77.0112,
  description:
    "Occupied-building renovation of ambulatory clinics including ICRA containment, medical gas, nurse call, and MEP upgrades. Seed data for product demonstration only.",
  profile: "evidence_stress",
  sovLines: [
    { code: "01", description: "ICRA / selective demolition", scheduledValueCents: 980_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "02", description: "Medical gas systems", scheduledValueCents: 1_450_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "03", description: "HVAC / infection control", scheduledValueCents: 2_100_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "04", description: "Electrical / nurse call", scheduledValueCents: 1_680_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "05", description: "Plumbing / fixtures", scheduledValueCents: 920_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "06", description: "Fire protection", scheduledValueCents: 640_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "07", description: "Interior finishes — clinics", scheduledValueCents: 1_850_000_00, unit: "SF", qtyScheduled: 42000 },
    { code: "08", description: "Casework & equipment pads", scheduledValueCents: 780_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "09", description: "Security / access control", scheduledValueCents: 520_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "10", description: "General conditions", scheduledValueCents: 1_680_000_00, unit: "LS", qtyScheduled: 1 },
  ],
  milestoneNames: [
    "NTP / ICRA plan approved",
    "Clinic A demolition complete",
    "Medical gas rough-in 50%",
    "AHU temporary filtration online",
    "Clinic B finishes start",
    "Nurse call system functional test",
    "Substantial completion",
    "Final completion / closeout",
  ],
  woTitles: [
    "ICRA containment — Clinic A east",
    "Demo above-ceiling — Corridor B",
    "Medical gas outlets — Exam 12–18",
    "Install HEPA temporary units — Level 2",
    "Nurse call headwall rough-in — Pod C",
    "Panelboard LP-2A feeder",
    "Replace clinic sinks — Wing D",
    "Sprinkler head relocation — Imaging",
    "Vinyl flooring — Waiting A",
    "Casework install — Phlebotomy",
    "Card reader — Staff entry south",
    "Duct cleaning — Return riser 2",
    "Ceiling grid — Clinic B west",
    "Med gas alarm panel tie-in",
    "Firestop penetrations — Shaft 3",
    "Lighting package — Corridor C",
    "Booster pump isolation valves",
    "Patch & paint — Nurse station",
    "Above-ceiling inspection closeout",
    "Equipment pad — Imaging chiller",
  ],
};

/** USACE logistics facility — ON_HOLD after funding/design pause. */
const USACE_CONFIG: PortfolioConfig = {
  id: "proj_usace_logistics",
  prefix: "usace",
  name: "USACE Logistics Facility — Pavement & Utilities",
  shortLabel: "USACE Logistics",
  contractNumber: "W912DR26C0142",
  owningAgency: "USACE",
  status: "ON_HOLD",
  contractValueCents: 9_400_000_00, // $9.4M
  retainagePct: 10,
  startMonthsAgo: 7,
  durationMonths: 16,
  address: "Fort Belvoir, 8725 John J Kingman Road, Fort Belvoir, VA 22060",
  lat: 38.7192,
  lng: -77.1543,
  description:
    "Warehouse apron pavement, storm drainage, and utility extensions paused pending design rebaseline and funding confirmation. Seed data for product demonstration only.",
  profile: "on_hold",
  sovLines: [
    { code: "01", description: "Mobilization / general conditions", scheduledValueCents: 940_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "02", description: "Earthwork & subgrade", scheduledValueCents: 1_320_000_00, unit: "CY", qtyScheduled: 18500 },
    { code: "03", description: "Storm drainage", scheduledValueCents: 1_150_000_00, unit: "LF", qtyScheduled: 4200 },
    { code: "04", description: "Utilities — water/sewer", scheduledValueCents: 980_000_00, unit: "LF", qtyScheduled: 3100 },
    { code: "05", description: "Electrical ductbank", scheduledValueCents: 860_000_00, unit: "LF", qtyScheduled: 2400 },
    { code: "06", description: "Concrete pavement", scheduledValueCents: 2_200_000_00, unit: "SY", qtyScheduled: 28000 },
    { code: "07", description: "Asphalt overlay — access roads", scheduledValueCents: 720_000_00, unit: "TN", qtyScheduled: 6400 },
    { code: "08", description: "Site lighting & security", scheduledValueCents: 540_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "09", description: "Striping & signage", scheduledValueCents: 210_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "10", description: "Testing & quality control", scheduledValueCents: 480_000_00, unit: "LS", qtyScheduled: 1 },
  ],
  milestoneNames: [
    "NTP / survey control",
    "Mass excavation complete",
    "Storm trunk line installed",
    "Utility corridor pressure tests",
    "Pavement base course 50%",
    "Apron pour sequence A",
    "Substantial completion",
    "Final acceptance",
  ],
  woTitles: [
    "Clear & grub — south apron",
    "Proof roll subgrade — Bay 2",
    "Install 36-in RCP — Line A",
    "Water main tie-in — Node 4",
    "Ductbank — feeder manhole 7",
    "Place lean concrete base — Panel 12",
    "Dowel basket install — Joint J-8",
    "Asphalt binder — Gate road",
    "Pole bases — perimeter lighting",
    "Striping layout — truck court",
    "Inlet protection — Stage 2",
    "Compaction testing — Lift 3",
    "Sewer lateral — Building stub",
    "Curb & gutter — Access B",
    "Temp fencing — Phase hold line",
    "Survey as-built — storm",
  ],
};

/** Judiciary / GSA courthouse security — near closeout. */
const COURTHOUSE_CONFIG: PortfolioConfig = {
  id: "proj_courthouse_security",
  prefix: "court",
  name: "Federal Courthouse — Security Modernization",
  shortLabel: "Courthouse Security",
  contractNumber: "47PA0325C0091",
  owningAgency: "GSA",
  status: "ACTIVE",
  contractValueCents: 6_850_000_00, // $6.85M
  retainagePct: 5,
  startMonthsAgo: 14,
  durationMonths: 16,
  address: "333 Constitution Avenue NW, Washington, DC 20001",
  lat: 38.8932,
  lng: -77.0165,
  description:
    "Security screening, ballistic glazing, sally port, and command center upgrades nearing substantial completion. Seed data for product demonstration only.",
  profile: "closeout",
  sovLines: [
    { code: "01", description: "Selective demolition", scheduledValueCents: 420_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "02", description: "Ballistic glazing & frames", scheduledValueCents: 1_280_000_00, unit: "SF", qtyScheduled: 8600 },
    { code: "03", description: "Sally port & doors", scheduledValueCents: 890_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "04", description: "Magnetometers / screening lanes", scheduledValueCents: 640_000_00, unit: "EA", qtyScheduled: 6 },
    { code: "05", description: "Security electronics", scheduledValueCents: 1_150_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "06", description: "Electrical / UPS", scheduledValueCents: 720_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "07", description: "Command center fit-out", scheduledValueCents: 780_000_00, unit: "SF", qtyScheduled: 2400 },
    { code: "08", description: "HVAC modifications", scheduledValueCents: 390_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "09", description: "Finishes & wayfinding", scheduledValueCents: 310_000_00, unit: "LS", qtyScheduled: 1 },
    { code: "10", description: "General conditions", scheduledValueCents: 270_000_00, unit: "LS", qtyScheduled: 1 },
  ],
  milestoneNames: [
    "NTP / security plan approved",
    "Demolition complete — public lobby",
    "Ballistic storefront installed",
    "Sally port operational",
    "Screening lanes functional",
    "Command center beneficial occupancy",
    "Substantial completion",
    "Final completion / retainage release",
  ],
  woTitles: [
    "Demo screening lobby — Phase 1",
    "Install ballistic curtain wall — north",
    "Sally port overhead door — east",
    "Magnetometer bases — Lane 2–3",
    "CCTV head-end — command room",
    "UPS install — MDF closet",
    "Access control — judges corridor",
    "Duress buttons — clerk stations",
    "HVAC rebalance — screening",
    "Wayfinding package — public",
    "Blast film — clerk windows",
    "Mantrap interlock commissioning",
    "Cable tray — security riser",
    "Finish paint — command center",
    "Punch walk — public lobby",
    "Final cleaning — screening lanes",
    "As-built drawings package",
    "Training — USMS operators",
  ],
};

export async function seedPortfolioProjects(
  prisma: PrismaClient,
  orgs: PortfolioOrgRefs,
): Promise<void> {
  console.log("Seeding additional portfolio projects…");
  await seedOneProject(prisma, orgs, VA_CONFIG);
  await seedOneProject(prisma, orgs, USACE_CONFIG);
  await seedOneProject(prisma, orgs, COURTHOUSE_CONFIG);
}

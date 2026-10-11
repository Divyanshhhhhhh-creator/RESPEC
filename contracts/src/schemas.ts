/**
 * ReSpec — Zod Schemas for runtime validation of API contracts.
 *
 * These schemas mirror /contracts/src/types.ts and are the source of truth
 * for both fixture validation and API response validation.
 *
 * OWNER: Divyansh
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export const MaterialCategorySchema = z.enum([
  'backfill_screened_soil',
  'granular_sub_base',
  'lean_concrete',
  'plain_concrete',
  'reinforced_concrete',
  'masonry_plaster_sand',
  'pavers',
  'kerbstones',
  'tiles',
  'ineligible_manual_review',
]);

export const EligibilityStatusSchema = z.enum([
  'ELIGIBLE',
  'CONDITIONAL',
  'MANUAL_REVIEW',
  'NOT_ALLOWED',
]);

export const LedgerStateSchema = z.enum([
  'ELIGIBLE',
  'PLANNED',
  'ORDERED',
  'VERIFIED',
]);

export const JobStatusSchema = z.enum([
  'CREATED',
  'UPLOADED',
  'EXTRACTING',
  'NEEDS_REVIEW',
  'READY',
  'ERROR',
]);

export const InputSourceSchema = z.enum(['pdf', 'rows']);

export const ProjectTypeSchema = z.enum(['building', 'road', 'campus']);

export const DecisionSchema = z.enum(['APPROVE', 'REJECT']);

export const LineFlagSchema = z.enum([
  'LOW_CONFIDENCE',
  'UNKNOWN_UNIT',
  'UNKNOWN_GRADE',
  'STRUCTURAL_BEYOND_LIMIT',
  'PRESTRESSED',
  'WATER_RETAINING',
  'RETAINING_WALL',
  'QUANTITY_OUTLIER',
  'MISSING_MASS_FACTOR',
  'DUPLICATE_ITEM_NO',
  'UNIT_QTY_SWAPPED',
]);

export const DeliveryFlagSchema = z.enum([
  'EXCEEDS_PLANNED_PLUS_5PCT',
  'DUPLICATE_SLIP_NO',
  'EVIDENCE_MISSING',
  'EVIDENCE_S3_NOT_FOUND',
]);

// ---------------------------------------------------------------------------
// Line schema
// ---------------------------------------------------------------------------

export const LineSchema = z.object({
  lineId: z.string().min(1),
  itemNo: z.string(),
  description: z.string(),
  unit: z.string(),
  qty: z.number(),
  rate: z.number().optional(),
  confidence: z.number().min(0).max(1).nullable(),
  category: MaterialCategorySchema.optional(),
  categoryConfidence: z.number().min(0).max(1).optional(),
  gradeParsed: z.string().nullable().optional(),
  flags: z.array(LineFlagSchema),
  massT: z.number().nonnegative().optional(),
  massBasis: z.string().optional(),
  excludedFromDenominator: z.boolean().optional(),
  excludedReason: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Rec schema
// ---------------------------------------------------------------------------

export const RecSchema = z.object({
  recId: z.string().min(1),
  lineId: z.string().min(1),
  ruleId: z.string().min(1),
  status: EligibilityStatusSchema,
  product: z.string().min(1),
  maxShare: z.number().min(0).max(1),
  modelledMassT: z.number().nonnegative().optional(),
  conditions: z.array(z.string()),
  source: z.object({
    url: z.string().url(),
    clause: z.string().min(1),
  }),
  decision: DecisionSchema.optional(),
  approverNote: z.string().optional(),
  approver: z.string().optional(),
  ledgerState: LedgerStateSchema,
  facilityOptions: z.array(z.object({
    facilityId: z.string().min(1),
    distanceKm: z.number().nonnegative(),
  })),
});

// ---------------------------------------------------------------------------
// Gap schema
// ---------------------------------------------------------------------------

export const GapSchema = z.object({
  applicable: z.boolean(),
  notApplicableReason: z.string().optional(),
  targetPct: z.number().min(0).max(1),
  modelledPct: z.number().min(0).max(1).nullable(),
  denominatorT: z.number().nonnegative(),
  numeratorT: z.number().nonnegative(),
  assumptions: z.array(z.string()),
  topLines: z.array(z.object({
    lineId: z.string(),
    itemNo: z.string(),
    description: z.string(),
    modelledMassT: z.number().nonnegative(),
    maxShare: z.number().min(0).max(1),
  })),
  excluded: z.array(z.object({
    lineId: z.string(),
    reason: z.string(),
  })),
  missingFactors: z.array(z.object({
    lineId: z.string(),
    unit: z.string(),
  })),
  scheduleRef: z.string(),
});

// ---------------------------------------------------------------------------
// PlanRow schema
// ---------------------------------------------------------------------------

export const PlanRowSchema = z.object({
  planRowId: z.string().min(1),
  recId: z.string().min(1),
  lineId: z.string().min(1),
  itemNo: z.string(),
  description: z.string(),
  product: z.string(),
  quantityT: z.number().nonnegative(),
  facilityId: z.string().min(1),
  facilityName: z.string(),
  distanceKm: z.number().nonnegative(),
  sourceClause: z.string().min(1),
  draftLabel: z.literal('DRAFT'),
});

// ---------------------------------------------------------------------------
// Delivery schema
// ---------------------------------------------------------------------------

export const DeliverySchema = z.object({
  deliveryId: z.string().min(1),
  recId: z.string().min(1),
  facilityId: z.string().min(1),
  quantityT: z.number().positive(),
  slipNo: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  evidenceKey: z.string().min(1),
  state: z.enum(['VERIFIED', 'FLAGGED']),
  flags: z.array(DeliveryFlagSchema),
});

// ---------------------------------------------------------------------------
// Impact totals schema
// ---------------------------------------------------------------------------

export const ImpactTotalsSchema = z.object({
  eligibleT: z.number().nonnegative(),
  plannedT: z.number().nonnegative(),
  orderedT: z.number().nonnegative(),
  verifiedT: z.number().nonnegative(),
  assumptions: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

export const CreateJobRequestSchema = z.object({
  projectName: z.string().min(1),
  projectType: ProjectTypeSchema,
  builtUpAreaM2: z.number().nonnegative().optional(),
  fy: z.string().regex(/^\d{4}-\d{2}$/),
  site: z.object({ lat: z.number(), lng: z.number() }),
});

export const StartJobRequestSchema = z.object({
  source: InputSourceSchema,
  rows: z.array(z.object({
    itemNo: z.string(),
    description: z.string(),
    unit: z.string(),
    qty: z.number(),
    rate: z.number().optional(),
  })).optional(),
});

export const PatchLinesRequestSchema = z.object({
  edits: z.array(z.object({
    lineId: z.string().min(1),
    field: z.string().min(1),
    value: z.union([z.string(), z.number()]),
  })),
});

export const DecisionRequestSchema = z.object({
  recId: z.string().min(1),
  decision: DecisionSchema,
  approver: z.string().min(1),
  note: z.string().optional(),
});

export const OrderRequestSchema = z.object({
  recId: z.string().min(1),
  poRef: z.string().min(1),
});

export const EvidenceUrlRequestSchema = z.object({
  recId: z.string().min(1),
  filename: z.string().min(1),
});

export const DeliveryRequestSchema = z.object({
  recId: z.string().min(1),
  facilityId: z.string().min(1),
  quantityT: z.number().positive(),
  slipNo: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  evidenceKey: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------

export const CreateJobResponseSchema = z.object({
  jobId: z.string().min(1),
  uploadUrl: z.string().url(),
  key: z.string().min(1),
});

export const GetJobResponseSchema = z.object({
  jobId: z.string().min(1),
  projectName: z.string().min(1),
  projectType: ProjectTypeSchema,
  builtUpAreaM2: z.number().optional(),
  fy: z.string(),
  site: z.object({ lat: z.number(), lng: z.number() }),
  status: JobStatusSchema,
  stage: z.string().optional(),
  error: z.string().optional(),
  lines: z.array(LineSchema),
});

export const EvaluateResponseSchema = z.object({
  recommendations: z.array(RecSchema),
  gap: GapSchema,
});

export const PlanResponseSchema = z.object({
  planId: z.string().min(1),
  rows: z.array(PlanRowSchema),
  exportUrls: z.object({
    csv: z.string(),
    pdf: z.string(),
  }),
});

export const DeliveryResponseSchema = z.object({
  deliveryId: z.string().min(1),
  state: z.enum(['VERIFIED', 'FLAGGED']),
  flags: z.array(DeliveryFlagSchema),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    field: z.string().optional(),
  }),
});

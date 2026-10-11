/**
 * ReSpec — Canonical API Types (v1)
 *
 * OWNER: Divyansh (tech lead)
 * These types are the single source of truth for all API contracts.
 *
 * CHANGE POLICY: No member may silently change a shared contract.
 * Any change requires a PR labelled `contract-change`, updating fixtures
 * first, announced in chat, and approved by Divyansh.
 * Additive optional fields only after contract freeze (end of Block 0).
 * No breaking changes after 16:00 Oct 10 except bug fixes.
 *
 * Evidence tags (per Spec):
 *   [V] verified from a source
 *   [A] assumption to confirm
 *   [E] estimate
 *   [S] synthetic demo data
 *   [U] not verified
 */

// ---------------------------------------------------------------------------
// Shared enumerations
// ---------------------------------------------------------------------------

/** The 10 material categories the classifier produces. */
export type MaterialCategory =
  | 'backfill_screened_soil'
  | 'granular_sub_base'
  | 'lean_concrete'        // < M15
  | 'plain_concrete'
  | 'reinforced_concrete'
  | 'masonry_plaster_sand'
  | 'pavers'
  | 'kerbstones'
  | 'tiles'
  | 'ineligible_manual_review';

/** Eligibility status returned by the rules evaluator. */
export type EligibilityStatus =
  | 'ELIGIBLE'
  | 'CONDITIONAL'
  | 'MANUAL_REVIEW'
  | 'NOT_ALLOWED';

/** Four-state procurement ledger. */
export type LedgerState =
  | 'ELIGIBLE'
  | 'PLANNED'
  | 'ORDERED'
  | 'VERIFIED';

/** Job processing status. */
export type JobStatus =
  | 'CREATED'
  | 'UPLOADED'
  | 'EXTRACTING'
  | 'NEEDS_REVIEW'
  | 'READY'
  | 'ERROR';

/** Source of BOQ input — determines whether Textract runs. */
export type InputSource = 'pdf' | 'rows';

/** Project type — determines which regulatory schedule applies. */
export type ProjectType = 'building' | 'road' | 'campus';

/** Human decision on a recommendation. */
export type Decision = 'APPROVE' | 'REJECT';

// ---------------------------------------------------------------------------
// Line — one row extracted from the BOQ
// ---------------------------------------------------------------------------

/**
 * A single extracted BOQ line.
 * Added: massT, massBasis, excludedFromDenominator (D3 decision — additive, non-breaking)
 */
export interface Line {
  lineId: string;
  itemNo: string;
  description: string;
  unit: string;
  qty: number;
  rate?: number;
  /** Textract confidence score 0–1; null for manually entered rows. */
  confidence: number | null;
  category?: MaterialCategory;
  categoryConfidence?: number;
  /** Parsed concrete grade (e.g. 'M20', 'M30'). null if not applicable. */
  gradeParsed?: string | null;
  /** Flags raised by normaliser or rules evaluator. */
  flags: LineFlag[];
  /** Modelled mass in tonnes. Only present when a density/thickness factor exists. [A] */
  massT?: number;
  /** Basis used to calculate mass (e.g. 'density:1.8 t/m³ [E]'). */
  massBasis?: string;
  /** Excluded from compliance gap denominator (e.g. metal, wood, missing factor). */
  excludedFromDenominator?: boolean;
  /** Reason for denominator exclusion. */
  excludedReason?: string;
}

/** Flags that can be set on a line. */
export type LineFlag =
  | 'LOW_CONFIDENCE'
  | 'UNKNOWN_UNIT'
  | 'UNKNOWN_GRADE'
  | 'STRUCTURAL_BEYOND_LIMIT'
  | 'PRESTRESSED'
  | 'WATER_RETAINING'
  | 'RETAINING_WALL'
  | 'QUANTITY_OUTLIER'
  | 'MISSING_MASS_FACTOR'
  | 'DUPLICATE_ITEM_NO'
  | 'UNIT_QTY_SWAPPED';

// ---------------------------------------------------------------------------
// Rec — one recommendation from the rules evaluator
// ---------------------------------------------------------------------------

/**
 * A recommendation produced by the rules evaluator for an eligible/conditional line.
 * Every recommendation must have a source clause; unsourced → MANUAL_REVIEW.
 */
export interface Rec {
  recId: string;
  lineId: string;
  ruleId: string;
  status: EligibilityStatus;
  /** Allowed recycled product name (e.g. 'RCA coarse aggregate'). */
  product: string;
  /** Maximum allowed share of recycled material (0–1). e.g. 0.25 for 25%. */
  maxShare: number;
  /** Modelled mass of recycled material in tonnes, if mass is calculable. [A] */
  modelledMassT?: number;
  /** Conditions the approver must acknowledge (for CONDITIONAL). */
  conditions: string[];
  /** Regulatory source for this recommendation. */
  source: {
    url: string;
    clause: string;
  };
  /** Human decision on this recommendation. */
  decision?: Decision;
  /** Note attached by the approver. */
  approverNote?: string;
  /** Name/ID of the approver. */
  approver?: string;
  /** Current procurement ledger state. */
  ledgerState: LedgerState;
  /** Nearby processing facilities (straight-line distance [E]). */
  facilityOptions: Array<{
    facilityId: string;
    distanceKm: number;
  }>;
}

// ---------------------------------------------------------------------------
// Gap — compliance-gap calculation result
// ---------------------------------------------------------------------------

/**
 * Result of the compliance-gap calculation (Divyansh's D2 deliverable).
 *
 * Applicable: project >= 20,000 m² built-up OR road project [V].
 * Denominator: total modelled mass of construction lines excluding metal/wood [A].
 * Numerator (modelled): Σ line.massT × rec.maxShare for approved ELIGIBLE/CONDITIONAL lines.
 * Target: Second Schedule 5% in 2026-27 (buildings); Third Schedule 5% 2026-28 (roads).
 */
export interface Gap {
  /** Whether the project is subject to the C&D Rules 2025 mandatory target. */
  applicable: boolean;
  /** Reason it is not applicable, if applicable === false. */
  notApplicableReason?: string;
  /** Target percentage as a decimal (e.g. 0.05 for 5%). */
  targetPct: number;
  /** Modelled achievable percentage as a decimal. null if denominator is zero or unknown. */
  modelledPct: number | null;
  /** Total modelled mass of eligible denominator lines in tonnes. [A] */
  denominatorT: number;
  /** Modelled recycled material mass in tonnes (eligible/conditional approved lines). [A] */
  numeratorT: number;
  /** Explicit assumptions and exclusions that affect the calculation. */
  assumptions: string[];
  /** Lines contributing most to the numerator, for the UI driving-lines display. */
  topLines: Array<{
    lineId: string;
    itemNo: string;
    description: string;
    modelledMassT: number;
    maxShare: number;
  }>;
  /** Lines excluded from the denominator and the reason. */
  excluded: Array<{
    lineId: string;
    reason: string;
  }>;
  /** Missing mass factors that could not be computed. */
  missingFactors: Array<{
    lineId: string;
    unit: string;
  }>;
  /** Regulatory schedule reference. */
  scheduleRef: string;
}

// ---------------------------------------------------------------------------
// PlanRow — one row of the draft procurement plan
// ---------------------------------------------------------------------------

export interface PlanRow {
  planRowId: string;
  recId: string;
  lineId: string;
  itemNo: string;
  description: string;
  product: string;
  quantityT: number;
  facilityId: string;
  facilityName: string;
  distanceKm: number;
  sourceClause: string;
  /** Always 'DRAFT' — this is not a statutory filing. */
  draftLabel: 'DRAFT';
}

// ---------------------------------------------------------------------------
// Delivery — one delivery record
// ---------------------------------------------------------------------------

export interface Delivery {
  deliveryId: string;
  recId: string;
  facilityId: string;
  quantityT: number;
  slipNo: string;
  date: string;         // ISO 8601
  evidenceKey: string;  // S3 object key
  /** VERIFIED = evidence exists and is consistent. FLAGGED = failed consistency check. */
  state: 'VERIFIED' | 'FLAGGED';
  flags: DeliveryFlag[];
}

export type DeliveryFlag =
  | 'EXCEEDS_PLANNED_PLUS_5PCT'
  | 'DUPLICATE_SLIP_NO'
  | 'EVIDENCE_MISSING'
  | 'EVIDENCE_S3_NOT_FOUND';

// ---------------------------------------------------------------------------
// Impact totals — GET /jobs/{id}/impact
// ---------------------------------------------------------------------------

export interface ImpactTotals {
  eligibleT: number;
  plannedT: number;
  orderedT: number;
  verifiedT: number;
  assumptions: string[];
}

// ---------------------------------------------------------------------------
// Request / response shapes
// ---------------------------------------------------------------------------

// POST /jobs
export interface CreateJobRequest {
  projectName: string;
  projectType: ProjectType;
  builtUpAreaM2?: number;
  fy: string;           // e.g. '2026-27'
  site: { lat: number; lng: number };
}

export interface CreateJobResponse {
  jobId: string;
  uploadUrl: string;    // presigned S3 PUT URL (5-min expiry)
  key: string;          // S3 object key for the BOQ upload
}

// POST /jobs/{id}/start
export interface StartJobRequest {
  source: InputSource;
  rows?: Array<{
    itemNo: string;
    description: string;
    unit: string;
    qty: number;
    rate?: number;
  }>;
}

export interface StartJobResponse {
  status: 'QUEUED';
}

// GET /jobs/{id}
export interface GetJobResponse {
  jobId: string;
  projectName: string;
  projectType: ProjectType;
  builtUpAreaM2?: number;
  fy: string;
  site: { lat: number; lng: number };
  status: JobStatus;
  stage?: string;
  error?: string;
  lines: Line[];
}

// PATCH /jobs/{id}/lines
export interface PatchLinesRequest {
  edits: Array<{
    lineId: string;
    field: string;
    value: string | number;
  }>;
}

export interface PatchLinesResponse {
  lines: Line[];
}

// POST /jobs/{id}/confirm → 200 {status: 'READY'}
export interface ConfirmResponse {
  status: 'READY';
}

// POST /jobs/{id}/evaluate → 200 {recommendations, gap}
export interface EvaluateResponse {
  recommendations: Rec[];
  gap: Gap;
}

// POST /jobs/{id}/decisions
export interface DecisionRequest {
  recId: string;
  decision: Decision;
  approver: string;
  note?: string;
}

export interface DecisionResponse {
  rec: Rec;
}

// POST /jobs/{id}/plan → 200 {planId, rows, exportUrls}
export interface PlanResponse {
  planId: string;
  rows: PlanRow[];
  exportUrls: {
    csv: string;   // presigned S3 GET URL (5-min expiry)
    pdf: string;   // browser-print URL (same page with print=true)
  };
}

// POST /jobs/{id}/orders
export interface OrderRequest {
  recId: string;
  poRef: string;
}

export interface OrderResponse {
  rec: Rec;
}

// POST /jobs/{id}/evidence-url
export interface EvidenceUrlRequest {
  recId: string;
  filename: string;
}

export interface EvidenceUrlResponse {
  uploadUrl: string;   // presigned S3 PUT URL (5-min expiry)
  key: string;
}

// POST /jobs/{id}/deliveries
export interface DeliveryRequest {
  recId: string;
  facilityId: string;
  quantityT: number;
  slipNo: string;
  date: string;
  evidenceKey: string;
}

export interface DeliveryResponse {
  deliveryId: string;
  state: 'VERIFIED' | 'FLAGGED';
  flags: DeliveryFlag[];
}

// ---------------------------------------------------------------------------
// Error response
// ---------------------------------------------------------------------------

export interface ApiError {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

// ---------------------------------------------------------------------------
// Ledger events (used by /core/ledger)
// ---------------------------------------------------------------------------

export type LedgerEventType =
  | 'DECISION_APPROVED'
  | 'DECISION_REJECTED'
  | 'PLAN_GENERATED'
  | 'ORDER_PLACED'
  | 'DELIVERY_RECORDED';

export interface LedgerEvent {
  type: LedgerEventType;
  recId: string;
  timestamp: string;    // ISO 8601
  payload: Record<string, unknown>;
}

export interface LedgerState_Rec {
  recId: string;
  state: LedgerState;
  eligibleT: number;
  plannedT: number;
  orderedT: number;
  verifiedT: number;
  deliveries: Delivery[];
}

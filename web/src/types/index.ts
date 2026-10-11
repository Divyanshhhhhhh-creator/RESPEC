import { z } from 'zod';

export type ProjectType = 'building' | 'road' | 'campus';

export interface SiteLocation {
  lat: number;
  lng: number;
  address: string;
}

export type JobStatus = 'UPLOADED' | 'EXTRACTING' | 'NEEDS_REVIEW' | 'READY' | 'ERROR';

export interface ProjectJob {
  jobId: string;
  projectName: string;
  projectType: ProjectType;
  builtUpAreaM2?: number;
  fy: string;
  site: SiteLocation;
  status: JobStatus;
  stage: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  linesCount: number;
}

export interface LineItem {
  lineId: string;
  itemNo: string;
  description: string;
  unit: string;
  qty: number;
  rate?: number;
  confidence: number; // 0.0 - 1.0 (e.g. 0.98 = 98%)
  category?: string;
  categoryConfidence?: number;
  gradeParsed?: string;
  flags: string[];
  // D3 additive fields:
  massT?: number;
  massBasis?: string;
  excludedFromDenominator?: boolean;
}

export type RecStatus = 'ELIGIBLE' | 'CONDITIONAL' | 'MANUAL_REVIEW' | 'NOT_ALLOWED';
export type LedgerState = 'ELIGIBLE' | 'PLANNED' | 'ORDERED' | 'VERIFIED';

export interface FacilityOption {
  facilityId: string;
  facilityName: string;
  distanceKm: number;
  phone: string;
  location: string;
}

export interface Recommendation {
  recId: string;
  lineId: string;
  ruleId: string;
  status: RecStatus;
  product: string;
  maxShare: number; // percentage (e.g. 20, 25, 100)
  modelledMassT?: number;
  conditions: string[];
  source: {
    url: string;
    clause: string;
  };
  decision?: 'APPROVE' | 'REJECT';
  approver?: string;
  approvalTimestamp?: string;
  approvalNote?: string;
  acknowledgedConditions?: string[];
  ledgerState: LedgerState;
  facilityOptions: FacilityOption[];
  poRef?: string;
  orderedAt?: string;
  verifiedT?: number;
}

export interface ComplianceGap {
  applicable: boolean;
  applicabilityReason: string;
  targetPct: number;
  modelledPct: number;
  denominatorT: number;
  numeratorT: number;
  gapPct: number; // targetPct - modelledPct (if > 0, shortfall; if <= 0, met)
  isTargetMet: boolean;
  assumptions: string[];
  topLines: Array<{
    lineId: string;
    description: string;
    category: string;
    itemNo: string;
    contributionT: number;
    shareOfTargetPct: number;
  }>;
  excludedLinesCount: number;
  missingMassLinesCount: number;
}

export interface DeliveryRecord {
  deliveryId: string;
  recId: string;
  itemNo: string;
  description: string;
  facilityId: string;
  facilityName: string;
  quantityT: number;
  slipNo: string;
  date: string;
  evidenceKey?: string;
  evidenceFilename?: string;
  evidenceUrl?: string;
  state: 'VERIFIED' | 'FLAGGED';
  flags: string[];
  createdAt: string;
}

export interface ImpactSummary {
  eligibleT: number;
  plannedT: number;
  orderedT: number;
  verifiedT: number;
  assumptions: string[];
}

export interface PlanRow {
  recId: string;
  itemNo: string;
  description: string;
  originalQty: number;
  unit: string;
  allowedProduct: string;
  maxSharePct: number;
  plannedRecycledT: number;
  recommendedFacility: string;
  distanceKm: number;
  sourceClause: string;
  status: RecStatus;
  decision: 'APPROVE' | 'REJECT';
  approver: string;
  poRef?: string;
  ledgerState: LedgerState;
}

// Zod validation schemas for forms and contracts
export const NewProjectSchema = z.object({
  projectName: z.string().min(3, 'Project name must be at least 3 characters'),
  projectType: z.enum(['building', 'road', 'campus']),
  builtUpAreaM2: z.number().min(1, 'Built-up area must be greater than 0').optional(),
  fy: z.string().min(4, 'Financial year required (e.g. 2026-27)'),
  address: z.string().min(3, 'Site address required'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type NewProjectFormValues = z.infer<typeof NewProjectSchema>;

export const LineEditSchema = z.object({
  lineId: z.string(),
  itemNo: z.string().min(1, 'Item number is required'),
  description: z.string().min(3, 'Description is required'),
  unit: z.enum(['m3', 'm2', 'm', 'nos', 'kg', 't']),
  qty: z.number().positive('Quantity must be greater than 0'),
  rate: z.number().nonnegative().optional(),
  gradeParsed: z.string().optional(),
});

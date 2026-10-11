import {
  ProjectJob,
  LineItem,
  Recommendation,
  ComplianceGap,
  DeliveryRecord,
  ImpactSummary,
  PlanRow,
} from '../types';
import { SAMPLE_CAMPUS_ROAD_BOQ } from '../data/sampleBoq';
import { normalizeLine } from '../core/normalize';
import { classifyLine } from '../core/classify';
import { evaluateLines } from '../core/evaluate';
import { computeGap } from '../core/gapCalculator';
import { computeImpactSummary } from '../core/ledgerReducer';

const STORAGE_KEY = 'respec_state_v1';

export interface AppState {
  currentJob: ProjectJob;
  lines: LineItem[];
  recommendations: Recommendation[];
  gap: ComplianceGap | null;
  deliveries: DeliveryRecord[];
  impact: ImpactSummary;
  planRows: PlanRow[];
  activeStepIndex: number;
}

export function getInitialDemoState(): AppState {
  const initialJob: ProjectJob = {
    jobId: 'job-delhi-campus-2026',
    projectName: 'IIT-Delhi NCR North Extension & Ring Road',
    projectType: 'campus',
    builtUpAreaM2: 34500, // >= 20,000 m2 threshold!
    fy: '2026-27',
    site: {
      lat: 28.545,
      lng: 77.1926,
      address: 'IIT Campus North Ring Road, Hauz Khas / Sector 4, New Delhi',
    },
    status: 'READY',
    stage: 'Extraction and Rules Evaluated',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linesCount: SAMPLE_CAMPUS_ROAD_BOQ.length,
  };

  // Build initial lines
  const lines: LineItem[] = SAMPLE_CAMPUS_ROAD_BOQ.map((raw, idx) => {
    const line = normalizeLine(raw, idx);
    const classification = classifyLine(line.description, line.gradeParsed);
    line.category = classification.category;
    line.categoryConfidence = classification.confidence;
    return line;
  });

  // Evaluate recommendations
  const recommendations = evaluateLines(lines, initialJob.site);

  // Compute gap
  const gap = computeGap(lines, recommendations, initialJob);

  // Sample verified and flagged deliveries to show four-state ledger
  const sampleDeliveries: DeliveryRecord[] = [
    {
      deliveryId: 'deliv-001',
      recId: 'rec-line-2', // Lean concrete (M10)
      itemNo: '2.01',
      description: 'M10 Lean concrete mud mat (RCA 100%)',
      facilityId: 'FAC-BURARI',
      facilityName: 'Burari C&D Processing Facility',
      quantityT: 120.0,
      slipNo: 'WB-BUR-2026-0891',
      date: '2026-10-08',
      evidenceKey: 'evidence/wb_slip_0891.pdf',
      evidenceFilename: 'Burari_Weighbridge_Slip_0891.pdf',
      evidenceUrl: '#mock-evidence-url',
      state: 'VERIFIED',
      flags: [],
      createdAt: '2026-10-08T11:30:00Z',
    },
    {
      deliveryId: 'deliv-002',
      recId: 'rec-line-3', // PCC 1:2:4
      itemNo: '2.02',
      description: 'Plain Cement Concrete 1:2:4 (RCA 25%)',
      facilityId: 'FAC-RANIKHERA',
      facilityName: 'Ranikhera (Mundka) C&D Processing Facility',
      quantityT: 45.0,
      slipNo: 'WB-RNK-2026-4412',
      date: '2026-10-09',
      evidenceKey: 'evidence/rnk_delivery_4412.pdf',
      evidenceFilename: 'Mundka_Dispatch_Receipt_4412.pdf',
      evidenceUrl: '#mock-evidence-url',
      state: 'VERIFIED',
      flags: [],
      createdAt: '2026-10-09T14:15:00Z',
    },
  ];

  // Set rec ledger states for those with deliveries/orders
  recommendations.forEach((r) => {
    if (r.recId === 'rec-line-2') {
      r.decision = 'APPROVE';
      r.approver = 'Er. Aarvi Bansal (Procurement Lead)';
      r.approvalTimestamp = '2026-10-07T09:00:00Z';
      r.poRef = 'PO/2026/IITD/044';
      r.ledgerState = 'VERIFIED';
      r.verifiedT = 120.0;
    } else if (r.recId === 'rec-line-3') {
      r.decision = 'APPROVE';
      r.approver = 'Er. Aarvi Bansal (Procurement Lead)';
      r.approvalTimestamp = '2026-10-07T09:15:00Z';
      r.poRef = 'PO/2026/IITD/048';
      r.ledgerState = 'VERIFIED';
      r.verifiedT = 45.0;
    } else if (r.recId === 'rec-line-4') {
      // M20 RCC conditional
      r.decision = 'APPROVE';
      r.approver = 'Er. Divyansh (Structural Lead)';
      r.approvalTimestamp = '2026-10-08T10:00:00Z';
      r.acknowledgedConditions = r.conditions;
      r.poRef = 'PO/2026/IITD/052';
      r.ledgerState = 'ORDERED';
    }
  });

  const impact = computeImpactSummary(recommendations, sampleDeliveries);

  const planRows: PlanRow[] = recommendations
    .filter((r) => r.decision === 'APPROVE')
    .map((r) => {
      const line = lines.find((l) => l.lineId === r.lineId)!;
      return {
        recId: r.recId,
        itemNo: line.itemNo,
        description: line.description,
        originalQty: line.qty,
        unit: line.unit,
        allowedProduct: r.product,
        maxSharePct: r.maxShare,
        plannedRecycledT: r.modelledMassT || 0,
        recommendedFacility: r.facilityOptions[0]?.facilityName || 'Ranikhera Facility',
        distanceKm: r.facilityOptions[0]?.distanceKm || 18.5,
        sourceClause: r.source.clause,
        status: r.status,
        decision: r.decision || 'APPROVE',
        approver: r.approver || 'Er. Aarvi Bansal',
        poRef: r.poRef,
        ledgerState: r.ledgerState,
      };
    });

  return {
    currentJob: initialJob,
    lines,
    recommendations,
    gap,
    deliveries: sampleDeliveries,
    impact,
    planRows,
    activeStepIndex: 0,
  };
}

export function loadSavedState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load state from localStorage', err);
  }
  const defaultState = getInitialDemoState();
  saveState(defaultState);
  return defaultState;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage', err);
  }
}

export function resetDemoState(): AppState {
  const fresh = getInitialDemoState();
  saveState(fresh);
  return fresh;
}

import { Recommendation, DeliveryRecord, ImpactSummary } from '../types';

export interface LedgerEvent {
  type: 'APPROVE_REC' | 'REJECT_REC' | 'GENERATE_PLAN' | 'SET_ORDER' | 'RECORD_DELIVERY';
  payload: any;
}

export function canApproveRecommendation(rec: Recommendation): {
  allowed: boolean;
  reason?: string;
} {
  if (rec.status === 'NOT_ALLOWED') {
    return {
      allowed: false,
      reason: 'Safety Gate Violation: NOT_ALLOWED items cannot be approved for recycled substitution.',
    };
  }
  if (rec.status === 'MANUAL_REVIEW') {
    return {
      allowed: false,
      reason: 'Safety Gate Violation: MANUAL_REVIEW items must have a verified standard clause before approval.',
    };
  }
  return { allowed: true };
}

export function computeImpactSummary(
  recs: Recommendation[],
  deliveries: DeliveryRecord[]
): ImpactSummary {
  let eligibleT = 0;
  let plannedT = 0;
  let orderedT = 0;
  let verifiedT = 0;

  // 1. Eligible tonnes: all recs that are ELIGIBLE or CONDITIONAL
  recs.forEach((r) => {
    if (r.status === 'ELIGIBLE' || r.status === 'CONDITIONAL') {
      const mass = r.modelledMassT || 0;
      eligibleT += mass;

      // 2. Planned: approved recs where plan has been generated (ledgerState is PLANNED, ORDERED, or VERIFIED)
      if (r.decision === 'APPROVE' && (r.ledgerState === 'PLANNED' || r.ledgerState === 'ORDERED' || r.ledgerState === 'VERIFIED')) {
        plannedT += mass;
      }

      // 3. Ordered: recs with an active PO reference
      if (r.ledgerState === 'ORDERED' || r.ledgerState === 'VERIFIED') {
        orderedT += mass;
      }
    }
  });

  // 4. Verified tonnes: derived strictly from valid VERIFIED delivery events with attached evidence
  deliveries.forEach((d) => {
    if (d.state === 'VERIFIED' && d.evidenceKey) {
      verifiedT += d.quantityT;
    }
  });

  eligibleT = Math.round(eligibleT * 100) / 100;
  plannedT = Math.round(plannedT * 100) / 100;
  orderedT = Math.round(orderedT * 100) / 100;
  verifiedT = Math.round(verifiedT * 100) / 100;

  return {
    eligibleT,
    plannedT,
    orderedT,
    verifiedT,
    assumptions: [
      'Four-state ledger guarantees eligible ≥ planned ≥ ordered ≥ verified hierarchy [V].',
      'Planned diversion is recorded only upon formal waste-utilisation plan generation [D5].',
      'Ordered diversion requires a validated Purchase Order reference [D4].',
      'Verified tonnes are recorded strictly from delivery weighbridge records with attached evidence files [V].',
      'Planned or ordered quantities are never claimed as verified diversion.'
    ],
  };
}

export function validateDeliveryRecord(
  rec: Recommendation,
  existingDeliveries: DeliveryRecord[],
  input: {
    quantityT: number;
    slipNo: string;
    evidenceKey?: string;
  }
): { state: 'VERIFIED' | 'FLAGGED'; flags: string[] } {
  const flags: string[] = [];

  // Check 1: Evidence key check
  if (!input.evidenceKey || input.evidenceKey.trim() === '') {
    flags.push('MISSING_EVIDENCE');
  }

  // Check 2: Duplicate weighbridge slip check
  const duplicate = existingDeliveries.some(
    (d) => d.slipNo.trim().toUpperCase() === input.slipNo.trim().toUpperCase()
  );
  if (duplicate) {
    flags.push('DUPLICATE_SLIP_NUMBER');
  }

  // Check 3: Over-delivery check (delivered <= planned + 5% tolerance)
  const plannedMass = rec.modelledMassT || 0;
  const toleranceLimit = plannedMass > 0 ? plannedMass * 1.05 : 999999;
  if (input.quantityT > toleranceLimit) {
    flags.push(`OVER_DELIVERY_EXCEEDS_5PCT_TOLERANCE (Max allowed: ${Math.round(toleranceLimit * 10) / 10} t)`);
  }

  if (flags.length > 0) {
    return { state: 'FLAGGED', flags };
  }

  return { state: 'VERIFIED', flags: [] };
}

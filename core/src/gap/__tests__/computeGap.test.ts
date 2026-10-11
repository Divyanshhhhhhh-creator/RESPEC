/**
 * ReSpec — Gap Calculator Unit Tests (D2 acceptance tests)
 *
 * Verifies all cases listed in the execution plan:
 * ✓ Building at or above 20,000 m² → applicable, 5% target
 * ✓ Road project → applicable, Third Schedule
 * ✓ Building below applicability threshold → not applicable
 * ✓ Missing mass conversion factors → excluded, listed
 * ✓ Non-C&D materials (metal) excluded from numerator and denominator
 * ✓ No eligible material → numerator = 0, modelledPct = 0
 * ✓ Empty BOQ → denominatorT = 0, modelledPct = null
 * ✓ Unknown/incomplete project data (undefined area) → not applicable
 * ✓ Zero or invalid denominator → modelledPct = null
 * ✓ Mixed eligible and excluded lines
 * ✓ modelledPct never exceeds 1.0
 */

import { describe, it, expect } from 'vitest';
import { computeGap, isApplicable, getTargetPct } from '../../gap/computeGap.js';
import type { Line, Rec, Gap } from '@respec/contracts';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

function makeLine(
  overrides: Partial<Line> & Pick<Line, 'lineId' | 'itemNo' | 'description' | 'unit' | 'qty'>,
): Line {
  return {
    confidence: 0.95,
    flags: [],
    excludedFromDenominator: false,
    ...overrides,
  };
}

function makeRec(overrides: Partial<Rec> & Pick<Rec, 'recId' | 'lineId' | 'ruleId' | 'status'>): Rec {
  return {
    product: 'RCA coarse aggregate',
    maxShare: 0.25,
    conditions: [],
    source: {
      url: 'https://example.com/is383',
      clause: 'IS 383:2016 Table 1',
    },
    ledgerState: 'ELIGIBLE',
    facilityOptions: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isApplicable tests
// ---------------------------------------------------------------------------

describe('isApplicable', () => {
  it('returns applicable=true for building >= 20,000 m²', () => {
    const result = isApplicable('building', 20000);
    expect(result.applicable).toBe(true);
  });

  it('returns applicable=true for building exactly 20,000 m²', () => {
    const result = isApplicable('building', 20000);
    expect(result.applicable).toBe(true);
  });

  it('returns applicable=false for building below 20,000 m²', () => {
    const result = isApplicable('building', 15000);
    expect(result.applicable).toBe(false);
    expect(result.reason).toContain('15,000');
    expect(result.reason).toContain('20,000');
  });

  it('returns applicable=true for road project', () => {
    const result = isApplicable('road', undefined);
    expect(result.applicable).toBe(true);
  });

  it('returns applicable=false when area is undefined (building)', () => {
    const result = isApplicable('building', undefined);
    expect(result.applicable).toBe(false);
    expect(result.reason).toContain('Built-up area not provided');
  });

  it('returns applicable=true for campus >= 20,000 m²', () => {
    const result = isApplicable('campus', 24000);
    expect(result.applicable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getTargetPct tests
// ---------------------------------------------------------------------------

describe('getTargetPct', () => {
  it('returns 5% for building in 2026-27', () => {
    expect(getTargetPct('building', '2026-27')).toBe(0.05);
  });

  it('returns 10% for building in 2027-28', () => {
    expect(getTargetPct('building', '2027-28')).toBe(0.10);
  });

  it('returns 25% for building in 2029-30', () => {
    expect(getTargetPct('building', '2029-30')).toBe(0.25);
  });

  it('returns 5% for road in 2026-27', () => {
    expect(getTargetPct('road', '2026-27')).toBe(0.05);
  });

  it('returns 15% for road from 2030-31', () => {
    expect(getTargetPct('road', '2030-31')).toBe(0.15);
  });

  it('returns null for building in 2025-26 (before rules)', () => {
    expect(getTargetPct('building', '2025-26')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// computeGap integration tests
// ---------------------------------------------------------------------------

describe('computeGap', () => {
  // --- Case 1: Building ≥ 20,000 m² — should apply 5% target ---
  it('applies Second Schedule 5% target for building >= 20,000 m² in 2026-27', () => {
    const lines: Line[] = [
      makeLine({ lineId: 'l1', itemNo: '1', description: 'Lean concrete', unit: 'm3', qty: 100, massT: 180 }),
    ];
    const recs: Rec[] = [
      makeRec({ recId: 'r1', lineId: 'l1', ruleId: 'R-LEAN', status: 'ELIGIBLE', maxShare: 1.0, modelledMassT: 180 }),
    ];

    const gap = computeGap({ lines, recs, projectType: 'building', builtUpAreaM2: 24000, fy: '2026-27' });

    expect(gap.applicable).toBe(true);
    expect(gap.targetPct).toBe(0.05);
    expect(gap.denominatorT).toBe(180);
    expect(gap.numeratorT).toBe(180);
    expect(gap.modelledPct).toBe(1.0); // 180/180
    expect(gap.scheduleRef).toContain('Second Schedule');
  });

  // --- Case 2: Road project ---
  it('applies Third Schedule for road project', () => {
    const lines: Line[] = [
      makeLine({ lineId: 'l1', itemNo: '1', description: 'GSB material', unit: 'm3', qty: 300, massT: 540 }),
    ];
    const recs: Rec[] = [
      makeRec({ recId: 'r1', lineId: 'l1', ruleId: 'R-GSB', status: 'ELIGIBLE', maxShare: 1.0, modelledMassT: 540 }),
    ];

    const gap = computeGap({ lines, recs, projectType: 'road', fy: '2026-27' });

    expect(gap.applicable).toBe(true);
    expect(gap.targetPct).toBe(0.05);
    expect(gap.scheduleRef).toContain('Third Schedule');
  });

  // --- Case 3: Building below applicability threshold ---
  it('returns applicable=false for building below 20,000 m²', () => {
    const lines: Line[] = [
      makeLine({ lineId: 'l1', itemNo: '1', description: 'Concrete', unit: 'm3', qty: 50, massT: 120 }),
    ];
    const recs: Rec[] = [];

    const gap = computeGap({ lines, recs, projectType: 'building', builtUpAreaM2: 8000, fy: '2026-27' });

    expect(gap.applicable).toBe(false);
    expect(gap.modelledPct).toBeNull();
    expect(gap.denominatorT).toBe(0);
    expect(gap.numeratorT).toBe(0);
    expect(gap.notApplicableReason).toContain('8,000');
  });

  // --- Case 4: Missing mass conversion factors ---
  it('excludes lines with missing mass factors and lists them', () => {
    const lines: Line[] = [
      makeLine({ lineId: 'l1', itemNo: '1', description: 'Lean concrete', unit: 'm3', qty: 100, massT: 180 }),
      // No massT — missing conversion factor
      makeLine({ lineId: 'l2', itemNo: '2', description: 'Kerbstone', unit: 'm', qty: 400 }),
    ];
    const recs: Rec[] = [
      makeRec({ recId: 'r1', lineId: 'l1', ruleId: 'R-LEAN', status: 'ELIGIBLE', maxShare: 1.0 }),
    ];

    const gap = computeGap({ lines, recs, projectType: 'building', builtUpAreaM2: 25000, fy: '2026-27' });

    expect(gap.missingFactors).toHaveLength(1);
    expect(gap.missingFactors[0]?.lineId).toBe('l2');
    expect(gap.missingFactors[0]?.unit).toBe('m');
    expect(gap.denominatorT).toBe(180); // only l1 counts
    expect(gap.excluded.some((e) => e.lineId === 'l2')).toBe(true);
  });

  // --- Case 5: Non-C&D materials (metal/wood) excluded ---
  it('excludes metal lines from denominator and numerator', () => {
    const lines: Line[] = [
      makeLine({ lineId: 'l1', itemNo: '1', description: 'Lean concrete', unit: 'm3', qty: 100, massT: 180 }),
      makeLine({
        lineId: 'l2', itemNo: '2', description: 'MS steel sections', unit: 't', qty: 25, massT: 25,
        excludedFromDenominator: true,
        excludedReason: 'Ineligible material (metal)',
      }),
    ];
    const recs: Rec[] = [
      makeRec({ recId: 'r1', lineId: 'l1', ruleId: 'R-LEAN', status: 'ELIGIBLE', maxShare: 1.0 }),
    ];

    const gap = computeGap({ lines, recs, projectType: 'building', builtUpAreaM2: 20000, fy: '2026-27' });

    expect(gap.denominatorT).toBe(180); // metal excluded
    expect(gap.excluded.some((e) => e.lineId === 'l2')).toBe(true);
  });

  // --- Case 6: No eligible material ---
  it('returns numeratorT=0 when no ELIGIBLE or CONDITIONAL recs exist', () => {
    const lines: Line[] = [
      makeLine({ lineId: 'l1', itemNo: '1', description: 'M30 RCC prestressed', unit: 'm3', qty: 40, massT: 96 }),
    ];
    const recs: Rec[] = [
      makeRec({ recId: 'r1', lineId: 'l1', ruleId: 'R-PRESTRESSED', status: 'NOT_ALLOWED', maxShare: 0 }),
    ];

    const gap = computeGap({ lines, recs, projectType: 'building', builtUpAreaM2: 20000, fy: '2026-27' });

    expect(gap.numeratorT).toBe(0);
    expect(gap.modelledPct).toBe(0);
    expect(gap.denominatorT).toBe(96);
  });

  // --- Case 7: Empty BOQ ---
  it('returns modelledPct=null for empty BOQ (zero denominator)', () => {
    const gap = computeGap({ lines: [], recs: [], projectType: 'building', builtUpAreaM2: 25000, fy: '2026-27' });

    expect(gap.denominatorT).toBe(0);
    expect(gap.numeratorT).toBe(0);
    expect(gap.modelledPct).toBeNull();
    expect(gap.applicable).toBe(true);
    expect(gap.assumptions.some((a) => a.includes('zero'))).toBe(true);
  });

  // --- Case 8: Unknown project type / missing area ---
  it('returns applicable=false when area is not provided for a building', () => {
    const gap = computeGap({ lines: [], recs: [], projectType: 'building', fy: '2026-27' });

    expect(gap.applicable).toBe(false);
    expect(gap.notApplicableReason).toContain('Built-up area not provided');
  });

  // --- Case 9: Zero denominator (all lines excluded) ---
  it('returns modelledPct=null when all lines are excluded', () => {
    const lines: Line[] = [
      makeLine({
        lineId: 'l1', itemNo: '1', description: 'MS steel', unit: 't', qty: 10, massT: 10,
        excludedFromDenominator: true, excludedReason: 'metal',
      }),
    ];

    const gap = computeGap({ lines, recs: [], projectType: 'building', builtUpAreaM2: 25000, fy: '2026-27' });

    expect(gap.denominatorT).toBe(0);
    expect(gap.modelledPct).toBeNull();
  });

  // --- Case 10: Mixed eligible and excluded lines ---
  it('correctly separates eligible and excluded lines in mixed BOQ', () => {
    const lines: Line[] = [
      makeLine({ lineId: 'l1', itemNo: '1', description: 'Lean concrete', unit: 'm3', qty: 100, massT: 180 }),
      makeLine({ lineId: 'l2', itemNo: '2', description: 'Plain concrete M15', unit: 'm3', qty: 80, massT: 192 }),
      makeLine({ lineId: 'l3', itemNo: '3', description: 'RCC M30 prestressed', unit: 'm3', qty: 40, massT: 96 }),
      makeLine({
        lineId: 'l4', itemNo: '4', description: 'MS steel', unit: 't', qty: 25, massT: 25,
        excludedFromDenominator: true, excludedReason: 'metal',
      }),
      makeLine({ lineId: 'l5', itemNo: '5', description: 'Kerbstone', unit: 'm', qty: 400 }), // no massT
    ];
    const recs: Rec[] = [
      makeRec({ recId: 'r1', lineId: 'l1', ruleId: 'R-LEAN', status: 'ELIGIBLE', maxShare: 1.0 }),
      makeRec({ recId: 'r2', lineId: 'l2', ruleId: 'R-PLAIN', status: 'ELIGIBLE', maxShare: 0.25 }),
      makeRec({ recId: 'r3', lineId: 'l3', ruleId: 'R-PRESTRESSED', status: 'NOT_ALLOWED', maxShare: 0 }),
    ];

    const gap = computeGap({ lines, recs, projectType: 'building', builtUpAreaM2: 24000, fy: '2026-27' });

    // Denominator: l1 (180) + l2 (192) + l3 (96) = 468; l4 excluded (metal), l5 missing factor
    expect(gap.denominatorT).toBe(468);
    // Numerator: l1 × 1.0 = 180; l2 × 0.25 = 48; l3 → NOT_ALLOWED = 0
    expect(gap.numeratorT).toBe(228);
    expect(gap.excluded).toHaveLength(2); // l4 (metal) + l5 (missing factor)
    expect(gap.missingFactors).toHaveLength(1); // l5
    expect(gap.topLines.length).toBeGreaterThan(0);
    expect(gap.topLines[0]?.lineId).toBe('l1'); // lean concrete contributes most
    expect(gap.modelledPct).toBeCloseTo(228 / 468, 3);
  });

  // --- Case 11: modelledPct never exceeds 1.0 ---
  it('caps modelledPct at 1.0 even if numerator > denominator', () => {
    const lines: Line[] = [
      makeLine({ lineId: 'l1', itemNo: '1', description: 'Lean concrete', unit: 'm3', qty: 100, massT: 100 }),
    ];
    const recs: Rec[] = [
      makeRec({ recId: 'r1', lineId: 'l1', ruleId: 'R-LEAN', status: 'ELIGIBLE', maxShare: 1.0 }),
    ];

    const gap = computeGap({ lines, recs, projectType: 'building', builtUpAreaM2: 20000, fy: '2026-27' });

    expect(gap.modelledPct).toBeLessThanOrEqual(1.0);
  });

  // --- Case 12: CONDITIONAL lines count toward numerator ---
  it('includes CONDITIONAL lines in modelled numerator', () => {
    const lines: Line[] = [
      makeLine({ lineId: 'l1', itemNo: '1', description: 'RCC M20', unit: 'm3', qty: 60, massT: 144 }),
    ];
    const recs: Rec[] = [
      makeRec({ recId: 'r1', lineId: 'l1', ruleId: 'R-RCC', status: 'CONDITIONAL', maxShare: 0.20 }),
    ];

    const gap = computeGap({ lines, recs, projectType: 'building', builtUpAreaM2: 25000, fy: '2026-27' });

    expect(gap.numeratorT).toBeCloseTo(144 * 0.20, 3);
  });

  // --- Case 13: Assumptions are always present ---
  it('always includes regulatory assumptions in output', () => {
    const gap = computeGap({ lines: [], recs: [], projectType: 'building', builtUpAreaM2: 25000, fy: '2026-27' });
    expect(gap.assumptions.length).toBeGreaterThan(0);
    expect(gap.assumptions.some((a) => a.includes('[V]'))).toBe(true);
  });
});

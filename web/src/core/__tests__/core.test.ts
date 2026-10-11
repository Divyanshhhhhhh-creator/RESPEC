import { describe, it, expect } from 'vitest';
import { normalizeUnit, parseGrade, isPrestressed, isMetalOrWood, normalizeLine } from '../normalize';
import { classifyLine } from '../classify';
import { evaluateLines } from '../evaluate';
import { computeGap } from '../gapCalculator';
import {
  canApproveRecommendation,
  computeImpactSummary,
  validateDeliveryRecord,
} from '../ledgerReducer';
import { SiteLocation, ProjectJob } from '../../types';

describe('Unit Normalizer & Grade Parser', () => {
  it('normalizes legacy civil engineering unit representations', () => {
    expect(normalizeUnit('cum')).toBe('m3');
    expect(normalizeUnit('cu.m')).toBe('m3');
    expect(normalizeUnit('sqm')).toBe('m2');
    expect(normalizeUnit('rmt')).toBe('m');
    expect(normalizeUnit('mt')).toBe('t');
    expect(normalizeUnit('nos')).toBe('nos');
  });

  it('correctly parses design mix concrete grades and nominal proportions', () => {
    expect(parseGrade('RCC M20 in foundations')).toBe('M20');
    expect(parseGrade('Design mix concrete grade M35 for columns')).toBe('M35');
    expect(parseGrade('PCC 1:4:8 in levelling course')).toBe('M7.5 (1:4:8)');
    expect(parseGrade('Lean concrete 1:3:6 under raft')).toBe('M10 (1:3:6)');
    expect(parseGrade('PCC 1:2:4 under road bed')).toBe('M15 (1:2:4)');
    expect(parseGrade('Earthwork in excavation')).toBeUndefined();
  });

  it('detects prestressed concrete elements as critical safety control', () => {
    expect(isPrestressed('Prestressed concrete bridge girders')).toBe(true);
    expect(isPrestressed('Post-tensioned slab with high tensile wire strands')).toBe(true);
    expect(isPrestressed('Standard RCC beam in M25')).toBe(false);
  });

  it('identifies metal and timber lines to exclude from C&D denominator', () => {
    expect(isMetalOrWood('Thermo-Mechanically Treated (TMT) steel rebar Fe-500D')).toBe(true);
    expect(isMetalOrWood('Waterproof commercial plywood shuttering')).toBe(true);
    expect(isMetalOrWood('Ready-mix concrete M20')).toBe(false);
  });
});

describe('Safety Gate & Negative Control Rules (IS 383:2016)', () => {
  const dummySite: SiteLocation = { lat: 28.545, lng: 77.1926, address: 'IIT Delhi Campus' };

  it('Negative Control 1: Prestressed concrete yields NOT_ALLOWED', () => {
    const line = normalizeLine(
      {
        description: 'Prestressed concrete high-tensile bridge girders',
        unit: 'm3',
        qty: 50,
      },
      0
    );
    line.category = 'reinforced concrete';
    const [rec] = evaluateLines([line], dummySite);

    expect(rec.status).toBe('NOT_ALLOWED');
    expect(rec.maxShare).toBe(0);
    expect(canApproveRecommendation(rec).allowed).toBe(false);
  });

  it('Negative Control 2: RCC Grade > M25 yields NOT_ALLOWED', () => {
    const line = normalizeLine(
      {
        description: 'Reinforced concrete columns in design mix M35',
        unit: 'm3',
        qty: 80,
      },
      0
    );
    line.category = 'reinforced concrete';
    const [rec] = evaluateLines([line], dummySite);

    expect(rec.status).toBe('NOT_ALLOWED');
    expect(rec.maxShare).toBe(0);
    expect(canApproveRecommendation(rec).allowed).toBe(false);
  });

  it('Negative Control 3: Unknown grade in RCC yields MANUAL_REVIEW', () => {
    const line = normalizeLine(
      {
        description: 'Reinforced cement concrete slab without specified mix',
        unit: 'm3',
        qty: 100,
      },
      0
    );
    line.category = 'reinforced concrete';
    line.flags.push('UNKNOWN_GRADE');
    const [rec] = evaluateLines([line], dummySite);

    expect(rec.status).toBe('MANUAL_REVIEW');
    expect(canApproveRecommendation(rec).allowed).toBe(false);
  });

  it('Lean concrete (<M15) yields ELIGIBLE with 100% permitted share', () => {
    const line = normalizeLine(
      {
        description: 'Lean concrete (1:4:8) under foundation mud mat',
        unit: 'm3',
        qty: 120,
      },
      0
    );
    line.category = 'lean concrete (<M15)';
    const [rec] = evaluateLines([line], dummySite);

    expect(rec.status).toBe('ELIGIBLE');
    expect(rec.maxShare).toBe(100);
    expect(canApproveRecommendation(rec).allowed).toBe(true);
  });

  it('RCC M20 yields CONDITIONAL with 20% max share and Note 2 clause', () => {
    const line = normalizeLine(
      {
        description: 'RCC M20 in plinth beams and grade slab',
        unit: 'm3',
        qty: 150,
      },
      0
    );
    line.category = 'reinforced concrete';
    const [rec] = evaluateLines([line], dummySite);

    expect(rec.status).toBe('CONDITIONAL');
    expect(rec.maxShare).toBe(20);
    expect(canApproveRecommendation(rec).allowed).toBe(true);
  });
});

describe('Compliance Gap Calculator', () => {
  const dummySite: SiteLocation = { lat: 28.545, lng: 77.1926, address: 'IIT Delhi Campus' };

  it('applies 5% mandatory target for projects >= 20,000 m2', () => {
    const project: Partial<ProjectJob> = {
      projectType: 'building',
      builtUpAreaM2: 25000,
    };
    const line = normalizeLine({ description: 'Lean concrete', unit: 'm3', qty: 100 }, 0);
    line.category = 'lean concrete (<M15)';
    const recs = evaluateLines([line], dummySite);
    const gap = computeGap([line], recs, project);

    expect(gap.applicable).toBe(true);
    expect(gap.targetPct).toBe(5.0);
  });

  it('applies 5% mandatory target for road projects regardless of built-up area', () => {
    const project: Partial<ProjectJob> = {
      projectType: 'road',
      builtUpAreaM2: 0,
    };
    const line = normalizeLine({ description: 'Granular sub-base', unit: 'm3', qty: 100 }, 0);
    const gap = computeGap([line], [], project);

    expect(gap.applicable).toBe(true);
    expect(gap.targetPct).toBe(5.0);
  });

  it('flags non-mandatory for buildings < 20,000 m2', () => {
    const project: Partial<ProjectJob> = {
      projectType: 'building',
      builtUpAreaM2: 12000,
    };
    const line = normalizeLine({ description: 'Plain concrete', unit: 'm3', qty: 50 }, 0);
    const gap = computeGap([line], [], project);

    expect(gap.applicable).toBe(false);
    expect(gap.targetPct).toBe(0);
  });
});

describe('Four-State Delivery Ledger & Evidence Gating', () => {
  it('rejects delivery verification when evidence is missing', () => {
    const dummyRec: any = { modelledMassT: 100, conditions: [] };
    const validation = validateDeliveryRecord(dummyRec, [], {
      quantityT: 50,
      slipNo: 'WB-1234',
      evidenceKey: '', // Missing!
    });

    expect(validation.state).toBe('FLAGGED');
    expect(validation.flags).toContain('MISSING_EVIDENCE');
  });

  it('flags over-delivery when quantity exceeds planned + 5% tolerance', () => {
    const dummyRec: any = { modelledMassT: 50, conditions: [] };
    const validation = validateDeliveryRecord(dummyRec, [], {
      quantityT: 65, // > 50 * 1.05 = 52.5 t
      slipNo: 'WB-5566',
      evidenceKey: 'evidence/slip_5566.pdf',
    });

    expect(validation.state).toBe('FLAGGED');
    expect(validation.flags.some((f) => f.includes('OVER_DELIVERY'))).toBe(true);
  });

  it('guarantees only VERIFIED evidenced deliveries count towards impact summary', () => {
    const recs: any[] = [
      { recId: 'r1', status: 'ELIGIBLE', modelledMassT: 100, decision: 'APPROVE', ledgerState: 'VERIFIED' },
    ];
    const deliveries: any[] = [
      { deliveryId: 'd1', quantityT: 40, state: 'VERIFIED', evidenceKey: 'slip1.pdf' },
      { deliveryId: 'd2', quantityT: 30, state: 'FLAGGED', evidenceKey: 'slip2.pdf' }, // Flagged!
    ];

    const impact = computeImpactSummary(recs, deliveries);
    expect(impact.verifiedT).toBe(40); // Only d1 counts, not d2!
  });
});

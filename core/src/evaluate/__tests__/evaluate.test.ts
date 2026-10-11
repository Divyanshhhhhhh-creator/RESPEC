/**
 * ReSpec — Rules Evaluator Unit Tests
 *
 * OWNER: Riya (core rules & evaluation)
 */

import { describe, it, expect } from 'vitest';
import { evaluate, haversineDistanceKm } from '../index.js';
import { computeGap } from '../../gap/computeGap.js';
import { LineSchema, RecSchema } from '@respec/contracts';
import type { Line } from '@respec/contracts';

function makeLine(overrides: Partial<Line> & Pick<Line, 'lineId' | 'itemNo' | 'description' | 'unit' | 'qty'>): Line {
  return {
    confidence: 0.95,
    flags: [],
    excludedFromDenominator: false,
    ...overrides,
  };
}

describe('haversineDistanceKm', () => {
  it('calculates accurate distance between known coordinates', () => {
    // DTU (28.7506, 77.1168) to Shastri Park (28.6638, 77.2567) ~ 16.8 km
    const dist = haversineDistanceKm(28.7506, 77.1168, 28.6638, 77.2567);
    expect(dist).toBeGreaterThan(15);
    expect(dist).toBeLessThan(18);
  });

  it('returns 0 for identical points', () => {
    expect(haversineDistanceKm(28.7, 77.1, 28.7, 77.1)).toBe(0);
  });
});

describe('evaluate', () => {
  const defaultSite = { lat: 28.7506, lng: 77.1168 };

  it('evaluates lean concrete lines as ELIGIBLE with 100% max share', () => {
    const lines = [
      makeLine({
        lineId: 'line-001',
        itemNo: '1',
        description: 'Lean concrete (1:4:8) under footings',
        unit: 'm3',
        qty: 120,
      }),
    ];

    const output = evaluate({ lines, projectType: 'building', site: defaultSite, fy: '2026-27' });

    expect(output.lines).toHaveLength(1);
    expect(output.lines[0]?.category).toBe('lean_concrete');
    expect(output.lines[0]?.massT).toBe(216); // 120 * 1.8
    expect(output.lines[0]?.excludedFromDenominator).toBe(false);

    expect(output.recs).toHaveLength(1);
    const rec = output.recs[0]!;
    expect(rec.status).toBe('ELIGIBLE');
    expect(rec.ruleId).toBe('R-LEAN');
    expect(rec.maxShare).toBe(1.0);
    expect(rec.modelledMassT).toBe(216);
    expect(rec.facilityOptions.length).toBeGreaterThan(0);

    // Validate with contracts schemas
    expect(() => LineSchema.parse(output.lines[0])).not.toThrow();
    expect(() => RecSchema.parse(rec)).not.toThrow();
  });

  it('evaluates plain concrete lines as ELIGIBLE with 25% max share', () => {
    const lines = [
      makeLine({
        lineId: 'line-002',
        itemNo: '2',
        description: 'Plain cement concrete M15 in raft foundation',
        unit: 'm3',
        qty: 80,
      }),
    ];

    const output = evaluate({ lines, projectType: 'building', site: defaultSite, fy: '2026-27' });
    expect(output.lines[0]?.category).toBe('plain_concrete');
    expect(output.lines[0]?.massT).toBe(192); // 80 * 2.4

    expect(output.recs).toHaveLength(1);
    const rec = output.recs[0]!;
    expect(rec.status).toBe('ELIGIBLE');
    expect(rec.ruleId).toBe('R-PLAIN');
    expect(rec.maxShare).toBe(0.25);
    expect(rec.modelledMassT).toBe(48); // 192 * 0.25

    expect(() => LineSchema.parse(output.lines[0])).not.toThrow();
    expect(() => RecSchema.parse(rec)).not.toThrow();
  });

  it('evaluates structural RCC M20 as CONDITIONAL with 20% max share', () => {
    const lines = [
      makeLine({
        lineId: 'line-003',
        itemNo: '3',
        description: 'Reinforced cement concrete M20 in columns',
        unit: 'm3',
        qty: 60,
      }),
    ];

    const output = evaluate({ lines, projectType: 'building', site: defaultSite, fy: '2026-27' });
    expect(output.lines[0]?.category).toBe('reinforced_concrete');
    expect(output.lines[0]?.massT).toBe(144); // 60 * 2.4

    expect(output.recs).toHaveLength(1);
    const rec = output.recs[0]!;
    expect(rec.status).toBe('CONDITIONAL');
    expect(rec.ruleId).toBe('R-RCC');
    expect(rec.maxShare).toBe(0.20);
    expect(rec.modelledMassT).toBe(28.8); // 144 * 0.20
    expect(rec.conditions.length).toBeGreaterThan(0);

    expect(() => LineSchema.parse(output.lines[0])).not.toThrow();
    expect(() => RecSchema.parse(rec)).not.toThrow();
  });

  it('enforces negative control: prestressed concrete is strictly NOT_ALLOWED', () => {
    const lines = [
      makeLine({
        lineId: 'line-004',
        itemNo: '4',
        description: 'RCC M30 in prestressed beams',
        unit: 'm3',
        qty: 40,
      }),
    ];

    const output = evaluate({ lines, projectType: 'building', site: defaultSite, fy: '2026-27' });
    expect(output.lines[0]?.flags).toContain('PRESTRESSED');

    expect(output.recs).toHaveLength(1);
    const rec = output.recs[0]!;
    expect(rec.status).toBe('NOT_ALLOWED');
    expect(rec.ruleId).toBe('R-RCC-PRESTRESSED-EXCLUSION');
    expect(rec.maxShare).toBe(0);
    expect(rec.modelledMassT).toBe(0);
    expect(rec.facilityOptions).toEqual([]);

    expect(() => LineSchema.parse(output.lines[0])).not.toThrow();
    expect(() => RecSchema.parse(rec)).not.toThrow();
  });

  it('enforces negative control: RCC M30+ without prestressing is routed to MANUAL_REVIEW', () => {
    const lines = [
      makeLine({
        lineId: 'line-m35',
        itemNo: '10',
        description: 'Reinforced concrete M35 in heavy foundations',
        unit: 'm3',
        qty: 50,
      }),
    ];

    const output = evaluate({ lines, projectType: 'building', site: defaultSite, fy: '2026-27' });
    expect(output.lines[0]?.flags).toContain('STRUCTURAL_BEYOND_LIMIT');

    expect(output.recs).toHaveLength(1);
    const rec = output.recs[0]!;
    expect(rec.status).toBe('MANUAL_REVIEW');
    expect(rec.ruleId).toBe('R-RCC-ABOVE-M25');
    expect(rec.maxShare).toBe(0);
    expect(rec.modelledMassT).toBe(0);

    expect(() => LineSchema.parse(output.lines[0])).not.toThrow();
    expect(() => RecSchema.parse(rec)).not.toThrow();
  });

  it('enforces negative control: concrete with unknown grade is routed to MANUAL_REVIEW', () => {
    const lines = [
      makeLine({
        lineId: 'line-unk',
        itemNo: '11',
        description: 'Reinforced cement concrete in raft slab (grade not specified)',
        unit: 'm3',
        qty: 75,
      }),
    ];

    const output = evaluate({ lines, projectType: 'building', site: defaultSite, fy: '2026-27' });
    expect(output.lines[0]?.flags).toContain('UNKNOWN_GRADE');

    expect(output.recs).toHaveLength(1);
    const rec = output.recs[0]!;
    expect(rec.status).toBe('MANUAL_REVIEW');
    expect(rec.ruleId).toBe('R-RCC-UNKNOWN-GRADE');
    expect(rec.maxShare).toBe(0);

    expect(() => LineSchema.parse(output.lines[0])).not.toThrow();
    expect(() => RecSchema.parse(rec)).not.toThrow();
  });

  it('enforces safety: structural member words alone do not classify as RCC', () => {
    const lines = [
      makeLine({
        lineId: 'line-slab',
        itemNo: '12',
        description: 'Cast in situ roof slabs and lintels',
        unit: 'm3',
        qty: 30,
      }),
    ];

    const output = evaluate({ lines, projectType: 'building', site: defaultSite, fy: '2026-27' });
    // Must NOT classify as reinforced concrete
    expect(output.lines[0]?.category).toBe('ineligible_manual_review');
  });

  it('correctly handles area units with thickness parsing (pavers 80mm)', () => {
    const lines = [
      makeLine({
        lineId: 'line-005',
        itemNo: '5',
        description: 'Interlocking paver blocks 80mm thick in parking area',
        unit: 'm2',
        qty: 800,
      }),
    ];

    const output = evaluate({ lines, projectType: 'building', site: defaultSite, fy: '2026-27' });
    expect(output.lines[0]?.category).toBe('pavers');
    // 800 * (0.08 * 2.4) = 800 * 0.192 = 153.6 t
    expect(output.lines[0]?.massT).toBeCloseTo(153.6, 1);
    expect(output.recs[0]?.status).toBe('MANUAL_REVIEW');
    expect(output.recs[0]?.ruleId).toBe('R-PAVERS-MANUAL');

    expect(() => LineSchema.parse(output.lines[0])).not.toThrow();
    expect(() => RecSchema.parse(output.recs[0]!)).not.toThrow();
  });

  it('flags missing mass factors and excludes them from denominator', () => {
    const lines = [
      makeLine({
        lineId: 'line-006',
        itemNo: '6',
        description: 'Granular sub-base (GSB) for internal roads',
        unit: 'm3',
        qty: 300,
      }),
      makeLine({
        lineId: 'line-008',
        itemNo: '8',
        description: 'Kerbstone precast RCC grade M35',
        unit: 'm',
        qty: 400,
      }),
    ];

    const output = evaluate({ lines, projectType: 'building', site: defaultSite, fy: '2026-27' });

    expect(output.lines[0]?.excludedFromDenominator).toBe(true);
    expect(output.lines[0]?.flags).toContain('MISSING_MASS_FACTOR');
    expect(output.lines[1]?.excludedFromDenominator).toBe(true);
    expect(output.lines[1]?.flags).toContain('MISSING_MASS_FACTOR');

    expect(() => LineSchema.parse(output.lines[0])).not.toThrow();
    expect(() => LineSchema.parse(output.lines[1])).not.toThrow();
  });

  it('excludes non-C&D ineligible materials (metal/steel)', () => {
    const lines = [
      makeLine({
        lineId: 'line-007',
        itemNo: '7',
        description: 'MS structural steel sections for roof',
        unit: 't',
        qty: 25,
      }),
    ];

    const output = evaluate({ lines, projectType: 'building', site: defaultSite, fy: '2026-27' });

    expect(output.lines[0]?.category).toBe('ineligible_manual_review');
    expect(output.lines[0]?.excludedFromDenominator).toBe(true);
    expect(output.lines[0]?.massT).toBe(25);
    expect(output.recs).toHaveLength(0); // non-C&D does not generate recommendations

    expect(() => LineSchema.parse(output.lines[0])).not.toThrow();
  });

  it('seamlessly integrates with computeGap pipeline', () => {
    const lines: Line[] = [
      makeLine({ lineId: 'l1', itemNo: '1', description: 'Lean concrete (1:4:8)', unit: 'm3', qty: 100 }),
      makeLine({ lineId: 'l2', itemNo: '2', description: 'Plain cement concrete M15', unit: 'm3', qty: 80 }),
      makeLine({ lineId: 'l3', itemNo: '3', description: 'RCC M30 in prestressed beams', unit: 'm3', qty: 40 }),
      makeLine({ lineId: 'l4', itemNo: '4', description: 'MS structural steel', unit: 't', qty: 25 }),
      makeLine({ lineId: 'l5', itemNo: '5', description: 'Kerbstones', unit: 'm', qty: 400 }),
    ];

    const evalOutput = evaluate({ lines, projectType: 'building', site: defaultSite, fy: '2026-27' });
    const gap = computeGap({
      lines: evalOutput.lines,
      recs: evalOutput.recs,
      projectType: 'building',
      builtUpAreaM2: 25000,
      fy: '2026-27',
    });

    expect(gap.applicable).toBe(true);
    expect(gap.targetPct).toBe(0.05);
    // Denominator: l1 (180) + l2 (192) + l3 (96) = 468
    expect(gap.denominatorT).toBe(468);
    // Numerator: l1 (180 * 1.0) + l2 (192 * 0.25) = 228
    expect(gap.numeratorT).toBe(228);
    expect(gap.excluded.some((e) => e.lineId === 'l5')).toBe(true);
    expect(gap.excluded.some((e) => e.lineId === 'l4')).toBe(true);
  });
});

/**
 * ReSpec — Rules & Evaluation Benchmark Harness
 *
 * OWNER: Riya (core rules & evaluation)
 *
 * Verifies accuracy, negative control false positive rate (FPR),
 * schema conformance, and evaluation throughput.
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '@respec/core';
import { computeGap } from '@respec/core';
import { LineSchema, RecSchema } from '@respec/contracts';
import { POSITIVE_BASELINE_DATASET } from './datasets/positiveBaseline.js';
import { NEGATIVE_CONTROLS_DATASET } from './datasets/negativeControls.js';
import { REALISTIC_MIXED_BOQ_DATASET } from './datasets/realisticMixedBoq.js';

const DTU_SITE = { lat: 28.7506, lng: 77.1168 };

describe('Evaluation Engine Benchmark Suite', () => {
  it('achieves 100% schema conformance on positive baseline', () => {
    const start = performance.now();
    const output = evaluate({
      lines: POSITIVE_BASELINE_DATASET,
      projectType: 'building',
      site: DTU_SITE,
      fy: '2026-27',
    });
    const durationMs = performance.now() - start;

    expect(output.lines).toHaveLength(POSITIVE_BASELINE_DATASET.length);
    expect(output.recs.length).toBeGreaterThan(0);

    // Validate all outputs against canonical Zod schemas
    for (const line of output.lines) {
      expect(() => LineSchema.parse(line)).not.toThrow();
    }
    for (const rec of output.recs) {
      expect(() => RecSchema.parse(rec)).not.toThrow();
    }

    // Check specific positive classifications
    const leanRec = output.recs.find((r) => r.ruleId === 'R-LEAN');
    expect(leanRec).toBeDefined();
    expect(leanRec?.status).toBe('ELIGIBLE');
    expect(leanRec?.maxShare).toBe(1.0);

    const plainRec = output.recs.find((r) => r.ruleId === 'R-PLAIN');
    expect(plainRec).toBeDefined();
    expect(plainRec?.status).toBe('ELIGIBLE');
    expect(plainRec?.maxShare).toBe(0.25);

    const rccRec = output.recs.find((r) => r.ruleId === 'R-RCC');
    expect(rccRec).toBeDefined();
    expect(rccRec?.status).toBe('CONDITIONAL');
    expect(rccRec?.maxShare).toBe(0.20);

    console.log(`[BENCHMARK] Positive baseline: evaluated in ${durationMs.toFixed(2)} ms`);
  });

  it('guarantees 0.0% False Positive Rate on structural negative controls', () => {
    const output = evaluate({
      lines: NEGATIVE_CONTROLS_DATASET,
      projectType: 'building',
      site: DTU_SITE,
      fy: '2026-27',
    });

    let falsePositiveCount = 0;
    const violations: string[] = [];

    for (const rec of output.recs) {
      if (rec.status === 'ELIGIBLE' || rec.status === 'CONDITIONAL') {
        falsePositiveCount++;
        violations.push(`${rec.lineId} (${rec.ruleId}): incorrectly assigned ${rec.status}`);
      }
    }

    const totalControls = NEGATIVE_CONTROLS_DATASET.length;
    const fpr = (falsePositiveCount / totalControls) * 100;

    console.log(
      `[BENCHMARK] Negative control false-positive rate: ${fpr.toFixed(1)}% (${falsePositiveCount}/${totalControls})`
    );

    if (violations.length > 0) {
      console.error('[SAFETY VIOLATION]', violations);
    }

    // Safety constraint: FPR on dangerous controls MUST be 0%
    expect(falsePositiveCount).toBe(0);
    expect(fpr).toBe(0.0);

    // Prestressed line must be explicitly NOT_ALLOWED
    const pscRec = output.recs.find((r) => r.lineId === 'neg-01');
    expect(pscRec?.status).toBe('NOT_ALLOWED');
    expect(pscRec?.maxShare).toBe(0);

    // M30 and M40 must be MANUAL_REVIEW
    const m30Rec = output.recs.find((r) => r.lineId === 'neg-03');
    expect(m30Rec?.status).toBe('MANUAL_REVIEW');
    expect(m30Rec?.maxShare).toBe(0);
  });

  it('evaluates realistic mixed BOQ and computes compliance gap within latency threshold', () => {
    const start = performance.now();
    const evalOutput = evaluate({
      lines: REALISTIC_MIXED_BOQ_DATASET,
      projectType: 'building',
      site: DTU_SITE,
      fy: '2026-27',
    });

    const gap = computeGap({
      lines: evalOutput.lines,
      recs: evalOutput.recs,
      projectType: 'building',
      builtUpAreaM2: 28000,
      fy: '2026-27',
    });
    const durationMs = performance.now() - start;

    console.log(`[BENCHMARK] Realistic mixed BOQ (15 items) processed in ${durationMs.toFixed(2)} ms`);
    console.log(
      `[GAP METRICS] Denominator: ${gap.denominatorT} t | Numerator: ${gap.numeratorT} t | Modelled: ${
        gap.modelledPct !== null ? (gap.modelledPct * 100).toFixed(1) + '%' : 'N/A'
      }`
    );

    expect(gap.applicable).toBe(true);
    expect(gap.targetPct).toBe(0.05); // 5% target in FY 2026-27
    expect(gap.denominatorT).toBeGreaterThan(500); // substantial concrete mass
    expect(gap.numeratorT).toBeGreaterThan(100);
    expect(gap.modelledPct).toBeGreaterThan(0.1);

    // Metals (Fe-500D steel, structural steel) must be excluded from denominator
    expect(gap.excluded.some((e) => e.lineId === 'boq-12')).toBe(true);
    expect(gap.excluded.some((e) => e.lineId === 'boq-13')).toBe(true);

    // Missing factor lines (kerbstones in m, GSB in m3 without density) must be excluded
    expect(gap.excluded.some((e) => e.lineId === 'boq-08')).toBe(true);
    expect(gap.excluded.some((e) => e.lineId === 'boq-10')).toBe(true);

    // High throughput requirement: sub-50ms execution
    expect(durationMs).toBeLessThan(50);
  });
});

/**
 * ReSpec — Compliance-Gap Calculator
 *
 * OWNER: Divyansh (D2 deliverable)
 *
 * PURPOSE: Given a set of normalised BOQ Lines and evaluated Recommendations,
 * compute how close the project is to its mandatory C&D recycled-material target.
 *
 * REGULATORY BASIS:
 *   - C&D Waste (Management) Rules 2025, Second Schedule (buildings ≥ 20,000 m²):
 *     5% of total construction material in FY 2026-27, 10% in 2027-28, 25% by 2029-30.
 *   - C&D Waste (Management) Rules 2025, Third Schedule (road projects):
 *     5% for 2026-28, 10% for 2028-30, 15% from 2030-31.
 *   Source: MoEF&CC Gazette, egazette.gov.in/WriteReadData/2025/262313.pdf [V secondary]
 *
 * HONEST LIMITS:
 *   - Denominator is [A] (assumption) — total modelled mass excluding metal/wood/glass lines.
 *   - Density values are [E] (estimates) — labelled, not authoritative.
 *   - Lines without a mass factor are excluded from denominator AND listed in missingFactors.
 *   - MANUAL_REVIEW lines never contribute to modelled numerator.
 *   - NOT_ALLOWED lines never contribute.
 *   - Modelled numerator assumes all ELIGIBLE/CONDITIONAL recs are approved —
 *     the actual approved share will be lower if some are rejected.
 *   - This is decision support, NOT a statutory compliance filing.
 *
 * SAFETY:
 *   - Missing or zero denominator → modelledPct = null, not zero or fabricated.
 *   - Unknown project type → not applicable; no target fabricated.
 *   - Ambiguities are surfaced in assumptions[], not silently resolved.
 */

import type { Gap, Line, Rec, ProjectType } from '@respec/contracts';

// ---------------------------------------------------------------------------
// Target schedule [V secondary — confirm Gazette text with mentor]
// ---------------------------------------------------------------------------

/** Returns mandatory target fraction (0–1) for a given project type and FY. */
export function getTargetPct(projectType: ProjectType, fy: string): number | null {
  // Second Schedule — buildings ≥ 20,000 m²
  if (projectType === 'building' || projectType === 'campus') {
    if (fy === '2026-27') return 0.05;
    if (fy === '2027-28') return 0.10;
    if (fy === '2028-29') return 0.10;
    if (fy === '2029-30') return 0.25;
    if (fy >= '2029-30') return 0.25;
    // Prior to rules taking effect
    return null;
  }

  // Third Schedule — road projects
  if (projectType === 'road') {
    if (fy >= '2026-27' && fy <= '2027-28') return 0.05;
    if (fy >= '2028-29' && fy <= '2029-30') return 0.10;
    if (fy >= '2030-31') return 0.15;
    return null;
  }

  return null;
}

/** Returns the regulatory schedule reference string for the UI. */
function getScheduleRef(projectType: ProjectType, fy: string): string {
  if (projectType === 'building' || projectType === 'campus') {
    return `C&D Waste (Management) Rules 2025 — Second Schedule (buildings ≥ 20,000 m²) — FY ${fy}`;
  }
  if (projectType === 'road') {
    return `C&D Waste (Management) Rules 2025 — Third Schedule (road projects) — FY ${fy}`;
  }
  return 'C&D Waste (Management) Rules 2025';
}

// ---------------------------------------------------------------------------
// Applicability check
// ---------------------------------------------------------------------------

/** Returns whether the C&D Rules 2025 mandatory target applies to this project. */
export function isApplicable(
  projectType: ProjectType,
  builtUpAreaM2: number | undefined,
): { applicable: boolean; reason?: string } {
  if (projectType === 'road') {
    return { applicable: true };
  }
  if (projectType === 'building' || projectType === 'campus') {
    if (builtUpAreaM2 === undefined) {
      return {
        applicable: false,
        reason:
          'Built-up area not provided — cannot determine applicability. ' +
          'Projects ≥ 20,000 m² are subject to the Second Schedule target.',
      };
    }
    if (builtUpAreaM2 >= 20_000) {
      return { applicable: true };
    }
    return {
      applicable: false,
      reason:
        `Built-up area ${builtUpAreaM2.toLocaleString()} m² is below the 20,000 m² threshold. ` +
        'Not mandatory under C&D Waste Rules 2025; Delhi 2016 advisory may apply.',
    };
  }
  return {
    applicable: false,
    reason: `Unknown project type '${projectType as string}' — cannot determine applicability.`,
  };
}

// ---------------------------------------------------------------------------
// Main function: computeGap
// ---------------------------------------------------------------------------

export interface ComputeGapInput {
  lines: Line[];
  recs: Rec[];
  projectType: ProjectType;
  builtUpAreaM2?: number;
  fy: string;
}

/**
 * Computes the compliance-gap result from evaluated lines and recommendations.
 *
 * This is a pure function — no AWS, no DB, no side effects.
 * The API handler (Bhavya's B5) calls this after evaluate().
 *
 * Spec §11 denominator: total modelled mass excluding metal/wood lines [A].
 * Spec §11 numerator: Σ line.massT × rec.maxShare for ELIGIBLE/CONDITIONAL lines.
 *
 * IMPORTANT: modelledPct assumes all eligible/conditional recs are maximally used.
 * The actual gap after human rejection will be narrower.
 */
export function computeGap(input: ComputeGapInput): Gap {
  const { lines, recs, projectType, builtUpAreaM2, fy } = input;
  const assumptions: string[] = [];
  const excluded: Gap['excluded'] = [];
  const missingFactors: Gap['missingFactors'] = [];

  // --- Applicability ---
  const { applicable, reason: notApplicableReason } = isApplicable(projectType, builtUpAreaM2);
  const targetPct = applicable ? (getTargetPct(projectType, fy) ?? 0.05) : 0.05;
  const scheduleRef = getScheduleRef(projectType, fy);

  assumptions.push(
    '[V] Target from C&D Waste (Management) Rules 2025 — confirm Gazette text with civil mentor',
    '[A] Denominator = total modelled mass of construction lines, excluding metal, wood, and glass — base to be confirmed with civil mentor',
    '[E] Density factors are engineering estimates; see conversions.json for values and labels',
    '[A] Numerator assumes all ELIGIBLE and CONDITIONAL recommendations are approved at maxShare — actual approved percentage will be lower',
  );

  if (!applicable) {
    return {
      applicable: false,
      notApplicableReason,
      targetPct,
      modelledPct: null,
      denominatorT: 0,
      numeratorT: 0,
      assumptions,
      topLines: [],
      excluded,
      missingFactors,
      scheduleRef,
    };
  }

  // --- Build a map of recId → Rec for quick lookup ---
  const recByLineId = new Map<string, Rec[]>();
  for (const rec of recs) {
    const list = recByLineId.get(rec.lineId) ?? [];
    list.push(rec);
    recByLineId.set(rec.lineId, list);
  }

  // --- Denominator calculation ---
  // Include all lines with a computed massT that are NOT excluded.
  // Excluded: lines with excludedFromDenominator=true, or missing massT.
  let denominatorT = 0;
  for (const line of lines) {
    if (line.excludedFromDenominator) {
      excluded.push({
        lineId: line.lineId,
        reason: line.excludedReason ?? 'Excluded from denominator',
      });
      continue;
    }
    if (line.massT === undefined || line.massT === null) {
      excluded.push({
        lineId: line.lineId,
        reason: `MISSING_MASS_FACTOR: unit=${line.unit} — no mass factor available`,
      });
      missingFactors.push({ lineId: line.lineId, unit: line.unit });
      continue;
    }
    denominatorT += line.massT;
  }

  if (excluded.length > 0) {
    assumptions.push(
      `[A] ${excluded.length} line(s) excluded from denominator — see 'excluded' list for details`,
    );
  }

  // --- Numerator calculation ---
  // Count lines where the best recommendation is ELIGIBLE or CONDITIONAL.
  // Numerator = Σ line.massT × rec.maxShare for those lines.
  // MANUAL_REVIEW and NOT_ALLOWED lines do NOT contribute.
  let numeratorT = 0;
  const topLineMap = new Map<string, {
    lineId: string;
    itemNo: string;
    description: string;
    modelledMassT: number;
    maxShare: number;
  }>();

  for (const line of lines) {
    const lineRecs = recByLineId.get(line.lineId) ?? [];
    if (lineRecs.length === 0) continue;
    if (line.massT === undefined || line.massT === null) continue;
    if (line.excludedFromDenominator) continue;

    // Find the highest-value eligible/conditional rec (by maxShare × massT)
    let bestContribution = 0;
    let bestMaxShare = 0;
    for (const rec of lineRecs) {
      if (rec.status !== 'ELIGIBLE' && rec.status !== 'CONDITIONAL') continue;
      const contribution = line.massT * rec.maxShare;
      if (contribution > bestContribution) {
        bestContribution = contribution;
        bestMaxShare = rec.maxShare;
      }
    }

    if (bestContribution > 0) {
      numeratorT += bestContribution;
      topLineMap.set(line.lineId, {
        lineId: line.lineId,
        itemNo: line.itemNo,
        description: line.description,
        modelledMassT: line.massT,
        maxShare: bestMaxShare,
      });
    }
  }

  // Sort top lines by contribution (massT × maxShare) descending, take top 5
  const topLines = Array.from(topLineMap.values())
    .sort((a, b) => (b.modelledMassT * b.maxShare) - (a.modelledMassT * a.maxShare))
    .slice(0, 5);

  // --- Modelled percentage ---
  let modelledPct: number | null = null;
  if (denominatorT > 0) {
    modelledPct = numeratorT / denominatorT;
    // Cap at 1.0 — should not exceed 100%
    modelledPct = Math.min(1.0, modelledPct);
    // Round to 3 decimal places to avoid floating-point noise
    modelledPct = Math.round(modelledPct * 1000) / 1000;
  } else {
    assumptions.push(
      '[A] Denominator is zero — all lines are excluded or have missing mass factors. modelledPct cannot be calculated.',
    );
  }

  if (missingFactors.length > 0) {
    assumptions.push(
      `[A] ${missingFactors.length} line(s) have missing mass conversion factors and are excluded from both numerator and denominator`,
    );
  }

  assumptions.push(
    `[A] Road project lines would use the Third Schedule; building/campus lines use the Second Schedule`,
  );

  return {
    applicable: true,
    targetPct,
    modelledPct,
    denominatorT: Math.round(denominatorT * 100) / 100,
    numeratorT: Math.round(numeratorT * 100) / 100,
    assumptions,
    topLines,
    excluded,
    missingFactors,
    scheduleRef,
  };
}

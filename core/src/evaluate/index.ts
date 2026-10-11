/**
 * ReSpec — /core/evaluate: Rules Evaluator Interface Stub
 *
 * OWNER: Riya (primary), Divyansh (approves)
 *
 * This file defines the signature that Riya must implement and that
 * Bhavya's API handler (B5) will call.
 *
 * STATUS: STUB — Replace with full implementation.
 */

import type { Line, Rec, ProjectType } from '@respec/contracts';

export interface EvaluateInput {
  lines: Line[];
  projectType: ProjectType;
  site: { lat: number; lng: number };
  fy: string;
}

export interface EvaluateOutput {
  /** Lines with massT, massBasis, excludedFromDenominator populated. */
  lines: Line[];
  /** One recommendation per eligible/conditional line. */
  recs: Rec[];
}

/**
 * Evaluates BOQ lines against the rules engine.
 *
 * Riya implements this function in full. The signature is frozen:
 *   - Input: confirmed lines (after human review and confirm)
 *   - Output: enriched lines (with mass) + recommendations
 *
 * Divyansh's computeGap() is called AFTER evaluate() with the returned output.
 *
 * STUB IMPLEMENTATION — returns empty results until Riya's code is merged.
 */
export function evaluate(_input: EvaluateInput): EvaluateOutput {
  // TODO(Riya): Implement rules evaluator
  // 1. Call normalize() on each line (unit normalisation, grade parsing, structural flag)
  // 2. Call classify() to assign category + categoryConfidence
  // 3. Look up rules.json for each category
  // 4. Compute massT from conversions.json (density × qty or thickness × area × density)
  // 5. Set excludedFromDenominator for metal/wood/glass and missing-factor lines
  // 6. Select nearest facilities by haversine distance
  // 7. Return enriched lines and Rec[] array
  throw new Error('evaluate() not yet implemented — Riya to implement');
}

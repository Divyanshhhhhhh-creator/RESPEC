/**
 * ReSpec — Material Classification
 *
 * Classifies BOQ lines into the 10 canonical MaterialCategory values.
 */

import type { Line, MaterialCategory } from '@respec/contracts';

export function classifyLine(line: Line): Line {
  const text = (line.description || '').toLowerCase();
  const grade = line.gradeParsed;

  let category: MaterialCategory = 'ineligible_manual_review';
  let categoryConfidence = 0.5;

  // 1. Prestressed / Post-tensioned (critical negative control - must evaluate to NOT_ALLOWED)
  if (
    text.includes('prestressed') ||
    text.includes('pre-stressed') ||
    text.includes('post-tensioned') ||
    text.includes('high tensile')
  ) {
    category = 'reinforced_concrete';
    categoryConfidence = 0.98;
  }
  // 2. Ineligible materials (Metal, Wood, Glass, Structural Steel)
  else if (
    text.includes('steel') ||
    text.includes('rebar') ||
    text.includes('reinforcement') ||
    text.includes('tmt') ||
    text.includes('iron') ||
    text.includes('wood') ||
    text.includes('timber') ||
    text.includes('glass')
  ) {
    category = 'ineligible_manual_review';
    categoryConfidence = 0.95;
  }
  // 2. Lean concrete (<M15)
  else if (
    text.includes('lean concrete') ||
    text.includes('lean cement concrete') ||
    text.includes('mud mat') ||
    text.includes('blinding') ||
    text.includes('1:4:8') ||
    (text.includes('pcc') && (text.includes('1:3:6') || text.includes('1:4:8'))) ||
    grade === 'M7.5' ||
    (text.includes('footing') && text.includes('1:4:8'))
  ) {
    category = 'lean_concrete';
    categoryConfidence = 0.95;
  }
  // 3. Reinforced Concrete (RCC) / Prestressed
  else if (
    text.includes('rcc') ||
    text.includes('reinforced') ||
    text.includes('prestressed') ||
    text.includes('post-tensioned')
  ) {
    category = 'reinforced_concrete';
    categoryConfidence = 0.92;
  }
  // 4. Plain Concrete (PCC)
  else if (
    text.includes('plain concrete') ||
    text.includes('plain cement concrete') ||
    text.includes('pcc') ||
    text.includes('plinth protection') ||
    text.includes('apron')
  ) {
    category = 'plain_concrete';
    categoryConfidence = 0.92;
  }
  // 5. Granular Sub-Base (GSB)
  else if (text.includes('granular sub') || text.includes('gsb') || text.includes('sub-base') || text.includes('subbase')) {
    category = 'granular_sub_base';
    categoryConfidence = 0.95;
  }
  // 6. Backfill / Screened Soil
  else if (text.includes('backfill') || text.includes('earthwork') || text.includes('screened soil') || text.includes('soil filling')) {
    category = 'backfill_screened_soil';
    categoryConfidence = 0.9;
  }
  // 7. Pavers
  else if (text.includes('paver') || text.includes('paving block')) {
    category = 'pavers';
    categoryConfidence = 0.92;
  }
  // 8. Kerbstones
  else if (text.includes('kerb') || text.includes('curb')) {
    category = 'kerbstones';
    categoryConfidence = 0.92;
  }
  // 9. Tiles
  else if (text.includes('tile') || text.includes('terrazzo')) {
    category = 'tiles';
    categoryConfidence = 0.9;
  }
  // 10. Masonry / Plaster / Sand
  else if (text.includes('masonry') || text.includes('brick') || text.includes('plaster') || text.includes('sand')) {
    category = 'masonry_plaster_sand';
    categoryConfidence = 0.9;
  }

  return {
    ...line,
    category,
    categoryConfidence,
  };
}

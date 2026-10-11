/**
 * ReSpec — Line Normalization
 *
 * Normalizes units, parses concrete grades, and sets diagnostic flags on Line items.
 */

import type { Line, LineFlag } from '@respec/contracts';

const VALID_UNITS = new Set(['m3', 'm2', 'm', 'nos', 'kg', 't']);

export function normalizeUnit(rawUnit: string): string {
  const clean = (rawUnit || '').trim().toLowerCase();
  if (clean === 'cum' || clean === 'cu.m' || clean === 'm^3' || clean === 'm3' || clean === 'cubic meter' || clean === 'cubic metre') return 'm3';
  if (clean === 'sqm' || clean === 'sq.m' || clean === 'm^2' || clean === 'm2' || clean === 'square meter' || clean === 'square metre') return 'm2';
  if (clean === 'rmt' || clean === 'r.m' || clean === 'm' || clean === 'meter' || clean === 'metre') return 'm';
  if (clean === 'no' || clean === 'nos' || clean === 'number' || clean === 'numbers' || clean === 'each') return 'nos';
  if (clean === 'kg' || clean === 'kgs' || clean === 'kilogram') return 'kg';
  if (clean === 't' || clean === 'ton' || clean === 'tonne' || clean === 'tonnes' || clean === 'mt') return 't';
  return clean;
}

export function parseGrade(description: string): string | null {
  if (!description) return null;
  const text = description.toUpperCase();
  
  // Standard M-grades: e.g. M10, M15, M20, M25, M30, M35
  const mMatch = text.match(/\bM\s*([0-9]{1,2})\b/);
  if (mMatch) {
    return `M${mMatch[1]}`;
  }

  // Nominal mix ratios: 1:4:8, 1:3:6, 1:2:4, 1:1.5:3, 1:1:2
  if (text.includes('1:4:8') || text.includes('1: 4: 8')) return 'M7.5';
  if (text.includes('1:3:6') || text.includes('1: 3: 6')) return 'M10';
  if (text.includes('1:2:4') || text.includes('1: 2: 4')) return 'M15';
  if (text.includes('1:1.5:3') || text.includes('1: 1.5: 3') || text.includes('1:1½:3')) return 'M20';
  if (text.includes('1:1:2') || text.includes('1: 1: 2')) return 'M25';

  return null;
}

export function isPrestressed(description: string): boolean {
  if (!description) return false;
  const lower = description.toLowerCase();
  return (
    lower.includes('prestressed') ||
    lower.includes('pre-stressed') ||
    lower.includes('post-tensioned') ||
    lower.includes('post tensioned') ||
    lower.includes('high tensile') ||
    lower.includes('strand wire')
  );
}

export function isWaterRetaining(description: string): boolean {
  if (!description) return false;
  const lower = description.toLowerCase();
  return (
    lower.includes('water retaining') ||
    lower.includes('water tank') ||
    lower.includes('liquid retaining') ||
    lower.includes('reservoir')
  );
}

export function isRetainingWall(description: string): boolean {
  if (!description) return false;
  const lower = description.toLowerCase();
  return lower.includes('retaining wall');
}

export function isMetalOrWood(description: string): boolean {
  if (!description) return false;
  const lower = description.toLowerCase();
  const exclusions = [
    'steel',
    'rebar',
    'reinforcement',
    'tmt',
    'iron',
    'aluminum',
    'aluminium',
    'copper',
    'wood',
    'timber',
    'plywood',
    'teak',
    'glass',
    'glazing',
    'structural steel',
    'fastener',
    'railing',
    'pipe',
  ];
  return exclusions.some((term) => lower.includes(term));
}

export function normalizeLine(line: Line): Line {
  const normUnit = normalizeUnit(line.unit);
  const grade = line.gradeParsed !== undefined && line.gradeParsed !== null ? line.gradeParsed : parseGrade(line.description);
  const flags = new Set<LineFlag>(line.flags || []);

  if (line.confidence !== null && line.confidence < 0.85) {
    flags.add('LOW_CONFIDENCE');
  }

  if (!VALID_UNITS.has(normUnit)) {
    flags.add('UNKNOWN_UNIT');
  }

  if (isPrestressed(line.description)) {
    flags.add('PRESTRESSED');
  }

  if (isWaterRetaining(line.description)) {
    flags.add('WATER_RETAINING');
  }

  if (isRetainingWall(line.description)) {
    flags.add('RETAINING_WALL');
  }

  const descLower = line.description.toLowerCase();
  const isRCCDesc =
    descLower.includes('rcc') ||
    descLower.includes('reinforced') ||
    descLower.includes('prestressed') ||
    descLower.includes('post-tensioned');

  if (isRCCDesc && !descLower.includes('lean') && !descLower.includes('pcc')) {
    if (grade) {
      const gradeNum = parseInt(grade.replace(/\D/g, ''), 10);
      if (gradeNum > 25) {
        flags.add('STRUCTURAL_BEYOND_LIMIT');
      }
    } else {
      flags.add('UNKNOWN_GRADE');
    }
  }

  let excludedFromDenominator = line.excludedFromDenominator;
  let excludedReason = line.excludedReason;
  let category = line.category;

  if (isMetalOrWood(line.description) && !isPrestressed(line.description)) {
    excludedFromDenominator = true;
    excludedReason = 'Ineligible material (metal/wood/glass) — excluded from C&D recycled content denominator [A per Spec §11]';
    if (!category) {
      category = 'ineligible_manual_review';
    }
  }

  return {
    ...line,
    unit: normUnit,
    gradeParsed: grade,
    flags: Array.from(flags),
    category,
    excludedFromDenominator,
    excludedReason,
  };
}

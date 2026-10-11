import { LineItem } from '../types';
import conversions from '../data/conversions.json';

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

export function parseGrade(description: string): string | undefined {
  const text = description.toUpperCase();
  // Check standard M-grades
  const mMatch = text.match(/\bM\s*([0-9]{1,2})\b/);
  if (mMatch) {
    return `M${mMatch[1]}`;
  }
  // Check nominal mix ratios: 1:4:8, 1:3:6, 1:2:4, 1:1.5:3, 1:1:2
  if (text.includes('1:4:8') || text.includes('1: 4: 8')) return 'M7.5 (1:4:8)';
  if (text.includes('1:3:6') || text.includes('1: 3: 6')) return 'M10 (1:3:6)';
  if (text.includes('1:2:4') || text.includes('1: 2: 4')) return 'M15 (1:2:4)';
  if (text.includes('1:1.5:3') || text.includes('1: 1.5: 3')) return 'M20 (1:1.5:3)';
  if (text.includes('1:1:2') || text.includes('1: 1: 2')) return 'M25 (1:1:2)';
  return undefined;
}

export function isPrestressed(description: string): boolean {
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

export function isStructuralRCC(description: string): boolean {
  const lower = description.toLowerCase();
  return (
    lower.includes('rcc') ||
    lower.includes('reinforced cement concrete') ||
    lower.includes('beam') ||
    lower.includes('column') ||
    lower.includes('slab') ||
    lower.includes('lintel') ||
    lower.includes('footing') ||
    lower.includes('retaining wall') ||
    lower.includes('raft')
  );
}

export function isMetalOrWood(description: string): boolean {
  const lower = description.toLowerCase();
  return conversions.metalWoodExclusions.some((term) => lower.includes(term.toLowerCase()));
}

export function calculateLineMassT(
  description: string,
  unit: string,
  qty: number,
  category?: string
): { massT?: number; massBasis?: string; excluded: boolean } {
  if (isMetalOrWood(description)) {
    return { massT: 0, massBasis: 'Excluded metal/wood/glass [A]', excluded: true };
  }

  const u = normalizeUnit(unit);

  if (u === 't') {
    return { massT: qty, massBasis: 'Direct weight in tonnes [V]', excluded: false };
  }
  if (u === 'kg') {
    return { massT: qty / 1000, massBasis: 'Direct weight converted kg -> t [V]', excluded: false };
  }

  // Volume: m3
  if (u === 'm3') {
    const descLower = description.toLowerCase();
    if (category === 'lean concrete (<M15)' || descLower.includes('lean') || descLower.includes('pcc')) {
      const density = conversions.densities.lean_concrete.value;
      return {
        massT: Math.round(qty * density * 100) / 100,
        massBasis: `Volume × Lean Concrete density (${density} t/m³) [E]`,
        excluded: false,
      };
    }
    if (category === 'plain concrete' || category === 'reinforced concrete' || descLower.includes('concrete')) {
      const density = conversions.densities.concrete.value;
      return {
        massT: Math.round(qty * density * 100) / 100,
        massBasis: `Volume × Concrete density (${density} t/m³) [E]`,
        excluded: false,
      };
    }
    if (category === 'backfill/screened soil' || descLower.includes('earthwork') || descLower.includes('soil')) {
      const density = conversions.densities.soil_backfill.value;
      return {
        massT: Math.round(qty * density * 100) / 100,
        massBasis: `Volume × Compacted Soil density (${density} t/m³) [E]`,
        excluded: false,
      };
    }
    if (category === 'granular sub-base' || descLower.includes('gsb') || descLower.includes('sub-base')) {
      const density = conversions.densities.gsb_aggregate.value;
      return {
        massT: Math.round(qty * density * 100) / 100,
        massBasis: `Volume × GSB density (${density} t/m³) [E]`,
        excluded: false,
      };
    }
    // Default stone/aggregate/masonry density
    const defaultDensity = 2.0;
    return {
      massT: Math.round(qty * defaultDensity * 100) / 100,
      massBasis: `Volume × General Mineral density (${defaultDensity} t/m³) [E]`,
      excluded: false,
    };
  }

  // Area: m2 (pavers, tiles)
  if (u === 'm2') {
    const descLower = description.toLowerCase();
    if (category === 'pavers' || descLower.includes('paver')) {
      // Check if thickness is specified in description (e.g. 60mm or 80mm)
      let thicknessM = conversions.defaultThicknesses.pavers.value; // default 0.08m (80mm)
      const thMatch = descLower.match(/([0-9]{2,3})\s*mm/);
      if (thMatch) {
        thicknessM = parseInt(thMatch[1], 10) / 1000;
      }
      const density = conversions.densities.paver_block.value;
      const mass = qty * thicknessM * density;
      return {
        massT: Math.round(mass * 100) / 100,
        massBasis: `Area × Thickness (${thicknessM * 1000}mm) × Paver density (${density} t/m³) [E]`,
        excluded: false,
      };
    }
    if (category === 'tiles' || descLower.includes('tile')) {
      const thicknessM = conversions.defaultThicknesses.tiles.value; // 0.025m
      const density = conversions.densities.concrete.value;
      const mass = qty * thicknessM * density;
      return {
        massT: Math.round(mass * 100) / 100,
        massBasis: `Area × Thickness (${thicknessM * 1000}mm) × Tile density (${density} t/m³) [E]`,
        excluded: false,
      };
    }
  }

  // For units like 'nos' or 'm' where mass factor cannot be reliably derived without engineer override:
  return {
    massT: undefined,
    massBasis: `Missing mass conversion factor for unit '${u}' — volume/unit only; excluded from gap denominator [A]`,
    excluded: true,
  };
}

export function normalizeLine(
  raw: {
    lineId?: string;
    itemNo?: string;
    description: string;
    unit: string;
    qty: number;
    rate?: number;
    confidence?: number;
  },
  index: number
): LineItem {
  const normUnit = normalizeUnit(raw.unit);
  const grade = parseGrade(raw.description);
  const flags: string[] = [];

  const confidence = raw.confidence !== undefined ? raw.confidence : 0.95;
  if (confidence < 0.85) {
    flags.push('LOW_CONFIDENCE');
  }

  if (!VALID_UNITS.has(normUnit)) {
    flags.push('UNKNOWN_UNIT');
  }

  if (isPrestressed(raw.description)) {
    flags.push('PRESTRESSED');
  }

  if (isStructuralRCC(raw.description)) {
    flags.push('STRUCTURAL_RCC');
    if (grade) {
      const gradeNum = parseInt(grade.replace(/\D/g, ''), 10);
      if (gradeNum > 25) {
        flags.push('STRUCTURAL_LIMIT');
      }
    } else {
      flags.push('UNKNOWN_GRADE');
    }
  }

  const { massT, massBasis, excluded } = calculateLineMassT(
    raw.description,
    normUnit,
    raw.qty
  );

  return {
    lineId: raw.lineId || `line-${index + 1}`,
    itemNo: (raw.itemNo || `${index + 1}`).trim(),
    description: raw.description.trim(),
    unit: normUnit,
    qty: Number(raw.qty) || 0,
    rate: raw.rate ? Number(raw.rate) : undefined,
    confidence,
    gradeParsed: grade,
    flags,
    massT,
    massBasis,
    excludedFromDenominator: excluded,
  };
}

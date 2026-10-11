/**
 * ReSpec — /core/evaluate: Rules Evaluator Implementation
 *
 * OWNER: Riya (core rules & evaluation)
 *
 * Implements the evaluate() engine function:
 *   - Normalizes input lines and parses concrete grades
 *   - Classifies lines into the 10 canonical MaterialCategory values
 *   - Computes mass in tonnes using conversions factors
 *   - Enforces rules and structural safety controls from rules definition
 *   - Dispatches operational facilities using Haversine distance
 *   - Returns enriched lines and recommendations conforming to @respec/contracts
 */

import type { Line, Rec, ProjectType, MaterialCategory } from '@respec/contracts';
import { normalizeLine } from '../normalize/index.js';
import { classifyLine } from '../classify/index.js';
import { CONVERSIONS_DATA, type ConversionsData } from './data/conversionsData.js';
import { RULES_DATA, type RuleDef } from './data/rulesData.js';
import { FACILITIES_DATA, type FacilityDef } from './data/facilitiesData.js';

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

// ---------------------------------------------------------------------------
// Haversine distance
// ---------------------------------------------------------------------------

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ---------------------------------------------------------------------------
// Geometry / Thickness parsing
// ---------------------------------------------------------------------------

function parseThicknessM(description: string, defaultThicknessM: number): number {
  if (!description) return defaultThicknessM;

  const mmMatch = description.match(/\b([1-9][0-9]{1,3})\s*mm\b/i);
  if (mmMatch) {
    const mm = parseFloat(mmMatch[1]);
    if (!isNaN(mm) && mm > 0) {
      return mm / 1000;
    }
  }

  const cmMatch = description.match(/\b([1-9][0-9]?(?:\.[0-9]+)?)\s*cm\b/i);
  if (cmMatch) {
    const cm = parseFloat(cmMatch[1]);
    if (!isNaN(cm) && cm > 0) {
      return cm / 100;
    }
  }

  return defaultThicknessM;
}

// ---------------------------------------------------------------------------
// Mass computation
// ---------------------------------------------------------------------------

function computeMass(
  line: Line,
  conversions: ConversionsData
): {
  massT?: number;
  massBasis?: string;
  excludedFromDenominator?: boolean;
  excludedReason?: string;
  missingFactor?: boolean;
} {
  // If already explicitly marked as non-C&D excluded material (metal, wood, glass)
  if (line.category === 'ineligible_manual_review' && line.excludedFromDenominator) {
    let massT: number | undefined = undefined;
    let massBasis: string | undefined = undefined;
    if (line.unit === 't') {
      massT = line.qty;
      massBasis = 'unit is tonnes — direct';
    } else if (line.unit === 'kg') {
      massT = Math.round(line.qty * 0.001 * 1000) / 1000;
      massBasis = 'unit is kg — factor:0.001 [V]';
    }
    return {
      massT,
      massBasis,
      excludedFromDenominator: true,
      excludedReason:
        line.excludedReason ??
        'Ineligible material (metal/wood/glass) — excluded from C&D recycled content denominator [A per Spec §11]',
    };
  }

  // 1. Direct mass units
  if (line.unit === 't') {
    return {
      massT: line.qty,
      massBasis: 'unit is tonnes — direct',
      excludedFromDenominator: false,
    };
  }

  if (line.unit === 'kg') {
    const mass = Math.round(line.qty * 0.001 * 1000) / 1000;
    return {
      massT: mass,
      massBasis: 'unit is kg — factor:0.001 [V]',
      excludedFromDenominator: false,
    };
  }

  // 2. Volume units (m3)
  if (line.unit === 'm3') {
    const cat = line.category as string;
    const densityEntry = cat ? conversions.densities[cat] : undefined;

    if (densityEntry && densityEntry.value > 0) {
      const mass = Math.round(line.qty * densityEntry.value * 100) / 100;
      const label =
        densityEntry.value === 1.8
          ? 'lean concrete bulk density estimate'
          : cat === 'plain_concrete'
          ? 'plain concrete density estimate'
          : 'RCC density estimate';
      return {
        massT: mass,
        massBasis: `density:${densityEntry.value} t/m³ [E] — ${label}`,
        excludedFromDenominator: false,
      };
    }

    // Missing density factor (e.g. granular_sub_base, backfill, or unknown)
    return {
      massT: undefined,
      massBasis: undefined,
      excludedFromDenominator: true,
      excludedReason: `MISSING_MASS_FACTOR: no density factor for ${cat || 'm3'} in conversions.json [U]`,
      missingFactor: true,
    };
  }

  // 3. Area units (m2)
  if (line.unit === 'm2') {
    const cat = line.category as string;
    const areaDefault = cat ? conversions.areaThicknessDefaults[cat] : undefined;

    if (areaDefault) {
      const thicknessM = parseThicknessM(line.description, areaDefault.defaultThicknessM);
      const density = areaDefault.density;
      const tPerM2 = Math.round(thicknessM * density * 10000) / 10000;
      const mass = Math.round(line.qty * tPerM2 * 100) / 100;

      return {
        massT: mass,
        massBasis: `thickness:${thicknessM}m × density:${density} t/m³ [E] = ${tPerM2} t/m²`,
        excludedFromDenominator: false,
      };
    }

    return {
      massT: undefined,
      massBasis: undefined,
      excludedFromDenominator: true,
      excludedReason: `MISSING_MASS_FACTOR: no area thickness/density factor for ${cat || 'm2'} in conversions.json [U]`,
      missingFactor: true,
    };
  }

  // 4. Non-convertible units (m, nos, unknown)
  return {
    massT: undefined,
    massBasis: undefined,
    excludedFromDenominator: true,
    excludedReason: `MISSING_MASS_FACTOR: no mass factor for ${line.category || 'material'} (${line.unit}) in conversions.json [U]`,
    missingFactor: true,
  };
}

// ---------------------------------------------------------------------------
// Evaluator engine
// ---------------------------------------------------------------------------

export function evaluate(
  input: EvaluateInput,
  overrides?: {
    conversions?: ConversionsData;
    rules?: RuleDef[];
    facilities?: FacilityDef[];
  }
): EvaluateOutput {
  const { lines, site } = input;
  const conversions = overrides?.conversions ?? CONVERSIONS_DATA;
  const rules = overrides?.rules ?? RULES_DATA;
  const facilities = overrides?.facilities ?? FACILITIES_DATA;

  // Find nearest operational facilities
  const operationalFacilities = facilities.filter((f) => f.operational !== false);
  const facilityDistanceMap = operationalFacilities
    .map((f) => ({
      facilityId: f.facilityId,
      distanceKm: haversineDistanceKm(site.lat, site.lng, f.lat, f.lng),
      products: f.products || [],
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const enrichedLines: Line[] = [];
  const recs: Rec[] = [];
  let recCounter = 1;

  for (const rawLine of lines) {
    // 1. Normalize line
    let line = normalizeLine(rawLine);

    // 2. Classify if needed
    if (!line.category || !line.categoryConfidence) {
      line = classifyLine(line);
    }

    // 3. Compute mass and denominator exclusion
    const massResult = computeMass(line, conversions);
    line = {
      ...line,
      massT: massResult.massT,
      massBasis: massResult.massBasis,
      excludedFromDenominator: massResult.excludedFromDenominator,
      excludedReason: massResult.excludedReason,
    };

    if (massResult.missingFactor && !line.flags.includes('MISSING_MASS_FACTOR')) {
      line.flags = [...line.flags, 'MISSING_MASS_FACTOR'];
    }

    enrichedLines.push(line);

    // 4. Skip recommendation generation for lines with missing mass factors or non-C&D ineligible lines
    if (line.excludedFromDenominator && massResult.missingFactor) {
      continue;
    }
    if (line.category === 'ineligible_manual_review' && !line.flags.includes('PRESTRESSED')) {
      continue;
    }

    // 5. Rule matching and recommendation generation
    let matchedRule: RuleDef | undefined = undefined;
    const cat = line.category;
    const flags = line.flags || [];

    if (cat === 'lean_concrete') {
      matchedRule = rules.find((r) => r.id === 'R-LEAN');
    } else if (cat === 'plain_concrete') {
      matchedRule = rules.find((r) => r.id === 'R-PLAIN');
    } else if (cat === 'reinforced_concrete') {
      if (
        flags.includes('PRESTRESSED') ||
        /\b(prestressed|pre-stressed|post-tensioned)\b/i.test(line.description)
      ) {
        matchedRule = rules.find((r) => r.id === 'R-RCC-PRESTRESSED-EXCLUSION');
      } else if (flags.includes('UNKNOWN_GRADE') || !line.gradeParsed) {
        matchedRule = rules.find((r) => r.id === 'R-RCC-UNKNOWN-GRADE');
      } else if (flags.includes('STRUCTURAL_BEYOND_LIMIT')) {
        matchedRule = rules.find((r) => r.id === 'R-RCC-ABOVE-M25');
      } else {
        matchedRule = rules.find((r) => r.id === 'R-RCC');
      }
    } else if (cat === 'pavers') {
      matchedRule = rules.find((r) => r.id === 'R-PAVERS-MANUAL');
    } else if (cat === 'kerbstones') {
      matchedRule = rules.find((r) => r.id === 'R-KERBS-MANUAL');
    } else if (cat === 'tiles') {
      matchedRule = rules.find((r) => r.id === 'R-TILES-MANUAL');
    } else if (cat === 'granular_sub_base') {
      matchedRule = rules.find((r) => r.id === 'R-GSB-MANUAL');
    } else if (cat === 'backfill_screened_soil') {
      matchedRule = rules.find((r) => r.id === 'R-BACKFILL-MANUAL');
    } else if (cat === 'masonry_plaster_sand') {
      matchedRule = rules.find((r) => r.id === 'R-MASONRY-MANUAL');
    }

    if (!matchedRule) {
      continue;
    }

    // Build recommendation
    const recId = `rec-${String(recCounter).padStart(3, '0')}`;
    recCounter++;

    let modelledMassT = 0;
    if (matchedRule.status === 'NOT_ALLOWED') {
      modelledMassT = 0;
    } else if (line.massT !== undefined && line.massT !== null) {
      modelledMassT = Math.round(line.massT * matchedRule.max_share * 100) / 100;
    }

    const conditions: string[] = [];
    if (matchedRule.id === 'R-RCC') {
      conditions.push('Grade ≤ M25 [IS 383:2016 Table 1 clause 4.2.1]');
      conditions.push('Only one type of manufactured coarse aggregate in the structure [IS 383:2016 Note 2]');
      conditions.push(`Approver must confirm grade ${line.gradeParsed || 'M20'} with structural engineer`);
    } else if (matchedRule.id === 'R-PAVERS-MANUAL') {
      conditions.push(
        'Paver product standard and recycled content limits not yet sourced [U] — requires civil mentor review'
      );
    } else if (matchedRule.id === 'R-KERBS-MANUAL') {
      conditions.push(
        'Kerbstone product standard and recycled content limits not yet sourced [U] — requires civil mentor review'
      );
    } else if (matchedRule.id === 'R-TILES-MANUAL') {
      conditions.push(
        'Tile product standard and recycled content limits not yet sourced [U] — requires civil mentor review'
      );
    }

    // Facility options (empty for NOT_ALLOWED)
    const facilityOptions =
      matchedRule.status === 'NOT_ALLOWED'
        ? []
        : facilityDistanceMap.slice(0, 2).map((f) => ({
            facilityId: f.facilityId,
            distanceKm: f.distanceKm,
          }));

    const sourceUrl =
      matchedRule.source_url && matchedRule.source_url.startsWith('http')
        ? matchedRule.source_url
        : 'https://egazette.gov.in/WriteReadData/2025/262313.pdf';

    const rec: Rec = {
      recId,
      lineId: line.lineId,
      ruleId: matchedRule.id,
      status: matchedRule.status,
      product: matchedRule.allowed_product,
      maxShare: matchedRule.max_share,
      modelledMassT,
      conditions,
      source: {
        url: sourceUrl,
        clause: matchedRule.clause,
      },
      ledgerState: 'ELIGIBLE',
      facilityOptions,
    };

    recs.push(rec);
  }

  return {
    lines: enrichedLines,
    recs,
  };
}

import { LineItem, Recommendation, SiteLocation, FacilityOption } from '../types';
import rulesData from '../data/rules.json';
import facilitiesData from '../data/facilities.json';
import { calculateHaversineDistanceKm } from './haversine';
import { isPrestressed, parseGrade } from './normalize';

export function evaluateLines(
  lines: LineItem[],
  site: SiteLocation
): Recommendation[] {
  // Pre-sort facilities by distance to site
  const sortedFacilities: FacilityOption[] = facilitiesData
    .map((fac) => ({
      facilityId: fac.id,
      facilityName: fac.name,
      distanceKm: calculateHaversineDistanceKm(site.lat, site.lng, fac.lat, fac.lng),
      phone: fac.phone,
      location: fac.location,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return lines.map((line, idx) => {
    const recId = `rec-${line.lineId || idx + 1}`;
    const grade = line.gradeParsed || parseGrade(line.description);
    const prestressed = isPrestressed(line.description);

    // Rule 1: Prestressed concrete check
    if (prestressed) {
      const rule = rulesData.find((r) => r.id === 'R-PRESTRESSED')!;
      return {
        recId,
        lineId: line.lineId,
        ruleId: rule.id,
        status: 'NOT_ALLOWED',
        product: rule.allowed_product,
        maxShare: 0,
        modelledMassT: 0,
        conditions: rule.conditions || [
          'Clause 4.2.2 explicitly forbids recycled/manufactured aggregates in prestressed concrete members',
        ],
        source: {
          url: rule.source_url,
          clause: rule.clause,
        },
        ledgerState: 'ELIGIBLE',
        facilityOptions: sortedFacilities,
      };
    }

    // Rule 2: Reinforced concrete evaluation
    if (line.category === 'reinforced concrete' || line.flags.includes('STRUCTURAL_RCC')) {
      if (!grade || line.flags.includes('UNKNOWN_GRADE')) {
        return {
          recId,
          lineId: line.lineId,
          ruleId: 'R-RCC-UNKNOWN-GRADE',
          status: 'MANUAL_REVIEW',
          product: 'Pending grade confirmation',
          maxShare: 0,
          modelledMassT: 0,
          conditions: [
            'Concrete grade cannot be determined from description.',
            'IS 383:2016 only permits RCA in reinforced concrete up to M25.',
            'Structural engineer must verify grade in structural drawings before substitution.',
          ],
          source: {
            url: 'https://civilapps.in/is-383-2016-table-1',
            clause: 'IS 383:2016 Table 1 Safety Constraint',
          },
          ledgerState: 'ELIGIBLE',
          facilityOptions: sortedFacilities,
        };
      }

      // Check numeric grade value
      const numMatch = grade.match(/M\s*([0-9]{2})/);
      const gradeNum = numMatch ? parseInt(numMatch[1], 10) : 0;

      if (gradeNum > 25 || line.flags.includes('STRUCTURAL_LIMIT')) {
        const rule = rulesData.find((r) => r.id === 'R-HIGH-GRADE-RCC')!;
        return {
          recId,
          lineId: line.lineId,
          ruleId: rule.id,
          status: 'NOT_ALLOWED',
          product: rule.allowed_product,
          maxShare: 0,
          modelledMassT: 0,
          conditions: [
            `Grade ${grade} exceeds maximum permissible limit M25 specified in IS 383:2016 Table 1.`,
            'High-strength structural elements (columns, shear walls > M25) must use virgin natural aggregates.',
          ],
          source: {
            url: rule.source_url,
            clause: rule.clause,
          },
          ledgerState: 'ELIGIBLE',
          facilityOptions: sortedFacilities,
        };
      }

      // Valid RCC <= M25 -> CONDITIONAL
      const rule = rulesData.find((r) => r.id === 'R-RCC')!;
      const maxShare = rule.max_share;
      const modelledMassT = line.massT ? Math.round(line.massT * (maxShare / 100) * 100) / 100 : 0;

      return {
        recId,
        lineId: line.lineId,
        ruleId: rule.id,
        status: 'CONDITIONAL',
        product: rule.allowed_product,
        maxShare,
        modelledMassT,
        conditions: [
          `Permitted strictly up to M25 (Grade detected: ${grade}).`,
          'Clause 4.2.2 Note 2: Only one type of manufactured coarse and one fine aggregate permitted.',
          'RCA coarse aggregate only; Recycled Aggregate (RA) from unsegregated demolition is NIL.',
          'Moisture absorption and abrasion tests must be verified on batch samples.',
        ],
        source: {
          url: rule.source_url,
          clause: rule.clause,
        },
        ledgerState: 'ELIGIBLE',
        facilityOptions: sortedFacilities,
      };
    }

    // Rule 3: Lean Concrete (<M15) -> ELIGIBLE
    if (line.category === 'lean concrete (<M15)') {
      const rule = rulesData.find((r) => r.id === 'R-LEAN')!;
      const maxShare = rule.max_share;
      const modelledMassT = line.massT ? Math.round(line.massT * (maxShare / 100) * 100) / 100 : 0;
      return {
        recId,
        lineId: line.lineId,
        ruleId: rule.id,
        status: 'ELIGIBLE',
        product: rule.allowed_product,
        maxShare,
        modelledMassT,
        conditions: [
          'IS 383:2016 Table 1 permits up to 100% RCA (coarse & fine) and 100% RA (coarse) in lean concrete (<M15)',
        ],
        source: {
          url: rule.source_url,
          clause: rule.clause,
        },
        ledgerState: 'ELIGIBLE',
        facilityOptions: sortedFacilities,
      };
    }

    // Rule 4: Plain Concrete -> ELIGIBLE (25%)
    if (line.category === 'plain concrete') {
      const rule = rulesData.find((r) => r.id === 'R-PLAIN')!;
      const maxShare = rule.max_share;
      const modelledMassT = line.massT ? Math.round(line.massT * (maxShare / 100) * 100) / 100 : 0;
      return {
        recId,
        lineId: line.lineId,
        ruleId: rule.id,
        status: 'ELIGIBLE',
        product: rule.allowed_product,
        maxShare,
        modelledMassT,
        conditions: [
          'IS 383:2016 Table 1 permits up to 25% RCA coarse and fine aggregate; RA nil',
        ],
        source: {
          url: rule.source_url,
          clause: rule.clause,
        },
        ledgerState: 'ELIGIBLE',
        facilityOptions: sortedFacilities,
      };
    }

    // Rule 5: Non-structural categories (Pavers, Kerbs, GSB, Backfill, Sand, Tiles) -> MANUAL_REVIEW
    const matchedRule = rulesData.find((r) => r.category === line.category);
    if (matchedRule) {
      const maxShare = matchedRule.max_share;
      const modelledMassT = line.massT ? Math.round(line.massT * (maxShare / 100) * 100) / 100 : 0;
      return {
        recId,
        lineId: line.lineId,
        ruleId: matchedRule.id,
        status: matchedRule.status as any,
        product: matchedRule.allowed_product,
        maxShare,
        modelledMassT,
        conditions: matchedRule.conditions || [
          'Statutory standard clause verification required prior to project procurement sign-off',
        ],
        source: {
          url: matchedRule.source_url,
          clause: matchedRule.clause,
        },
        ledgerState: 'ELIGIBLE',
        facilityOptions: sortedFacilities,
      };
    }

    // Fallback: MANUAL_REVIEW
    const fallbackRule = rulesData.find((r) => r.id === 'R-DEFAULT-UNKNOWN')!;
    return {
      recId,
      lineId: line.lineId,
      ruleId: fallbackRule.id,
      status: 'MANUAL_REVIEW',
      product: 'Manual evaluation required',
      maxShare: 0,
      modelledMassT: 0,
      conditions: [
        'No verified IS or CPWD clause matches this item description.',
        'Default safety protocol requires quantity surveyor and civil engineer review.',
      ],
      source: {
        url: fallbackRule.source_url,
        clause: fallbackRule.clause,
      },
      ledgerState: 'ELIGIBLE',
      facilityOptions: sortedFacilities,
    };
  });
}

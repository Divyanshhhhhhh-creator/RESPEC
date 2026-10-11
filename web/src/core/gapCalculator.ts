import { LineItem, Recommendation, ProjectJob, ComplianceGap } from '../types';

export function computeGap(
  lines: LineItem[],
  recs: Recommendation[],
  project: Partial<ProjectJob>
): ComplianceGap {
  const isMandatory =
    (project.builtUpAreaM2 !== undefined && project.builtUpAreaM2 >= 20000) ||
    project.projectType === 'road';

  let targetPct = 0;
  let applicabilityReason = '';

  if (isMandatory) {
    targetPct = 5.0; // 5% in FY 2026-27 under C&D Waste Rules 2025
    if (project.projectType === 'road') {
      applicabilityReason =
        'Mandatory under C&D Waste Rules 2025 (Third Schedule for Road Projects): 5% recycled material requirement for FY 2026-28.';
    } else {
      applicabilityReason = `Mandatory under C&D Waste Rules 2025 (Second Schedule): Built-up area (${project.builtUpAreaM2?.toLocaleString()} m²) exceeds the 20,000 m² threshold. 5% target binding in FY 2026-27.`;
    }
  } else {
    targetPct = 0;
    applicabilityReason =
      'Not mandatory under statutory 2025 Rules (built-up area < 20,000 m² and non-road). However, Delhi DPCC & CPWD non-mandatory advisories (2%–10%) recommend green substitution.';
  }

  // Map recommendations by lineId
  const recMap = new Map<string, Recommendation>();
  recs.forEach((r) => recMap.set(r.lineId, r));

  let totalDenominatorT = 0;
  let totalNumeratorT = 0;
  let excludedLinesCount = 0;
  let missingMassLinesCount = 0;

  const drivingLines: Array<{
    lineId: string;
    description: string;
    category: string;
    itemNo: string;
    contributionT: number;
    shareOfTargetPct: number;
  }> = [];

  lines.forEach((line) => {
    // If metal or wood or excluded
    if (line.excludedFromDenominator) {
      if (line.massT === undefined) {
        missingMassLinesCount++;
      } else {
        excludedLinesCount++;
      }
      return;
    }

    const mass = line.massT || 0;
    if (mass <= 0) {
      missingMassLinesCount++;
      return;
    }

    totalDenominatorT += mass;

    const rec = recMap.get(line.lineId);
    if (rec) {
      let permittedShare = 0;
      if (rec.status === 'ELIGIBLE' || rec.status === 'CONDITIONAL') {
        // If user made a decision, respect it. If not yet decided, use standard permitted maxShare
        if (rec.decision === 'REJECT') {
          permittedShare = 0;
        } else {
          permittedShare = rec.maxShare;
        }
      }

      const contrib = Math.round(mass * (permittedShare / 100) * 100) / 100;
      if (contrib > 0) {
        totalNumeratorT += contrib;
        drivingLines.push({
          lineId: line.lineId,
          description: line.description,
          category: line.category || 'General',
          itemNo: line.itemNo,
          contributionT: contrib,
          shareOfTargetPct: 0, // computed below
        });
      }
    }
  });

  totalDenominatorT = Math.round(totalDenominatorT * 100) / 100;
  totalNumeratorT = Math.round(totalNumeratorT * 100) / 100;

  const modelledPct =
    totalDenominatorT > 0
      ? Math.round((totalNumeratorT / totalDenominatorT) * 1000) / 10
      : 0;

  // Calculate each driving line's share of total diversion
  drivingLines.forEach((dl) => {
    dl.shareOfTargetPct =
      totalNumeratorT > 0
        ? Math.round((dl.contributionT / totalNumeratorT) * 1000) / 10
        : 0;
  });

  // Sort by highest contribution
  drivingLines.sort((a, b) => b.contributionT - a.contributionT);

  const gapPct = Math.round((targetPct - modelledPct) * 10) / 10;
  const isTargetMet = isMandatory ? modelledPct >= targetPct : true;

  const assumptions = [
    'Denominator excludes structural steel, TMT rebar, shuttering wood, timber, and glass as per C&D Rules scope [A].',
    'Mass calculations apply explicit conversion factors from conversions.json (Concrete: 2.4 t/m³, Lean: 2.2 t/m³, Pavers: 80mm @ 2.3 t/m³) [E].',
    'IS 383:2016 caps RCA in reinforced concrete at 20% (up to M25); high-grade concrete (>M25) and prestressed members are strictly zero [V].',
    'Lines with missing conversion factors (such as unrated unit items) are shown in volume/units only and excluded from denominator [A].',
    'Non-structural lines (pavers, kerbs, sub-base) are tagged MANUAL_REVIEW until standard clauses are verified by project mentors [U].'
  ];

  return {
    applicable: isMandatory,
    applicabilityReason,
    targetPct,
    modelledPct,
    denominatorT: totalDenominatorT,
    numeratorT: totalNumeratorT,
    gapPct,
    isTargetMet,
    assumptions,
    topLines: drivingLines.slice(0, 5),
    excludedLinesCount,
    missingMassLinesCount,
  };
}

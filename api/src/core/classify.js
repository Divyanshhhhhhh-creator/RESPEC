const CATEGORY_RULES = [
  ["BACKFILL", /back\s*fill|earth\s*fill|screened\s*soil/i],
  ["GRANULAR_SUB_BASE", /granular\s+sub.?base|\bgsb\b/i],
  ["LEAN_CONCRETE", /lean\s+concrete|dry\s+lean|\bdlc\b/i],
  ["REINFORCED_CONCRETE", /reinforced|\brcc\b|prestress|retaining|water.?retaining/i],
  ["PLAIN_CONCRETE", /plain\s+cement\s+concrete|\bpcc\b|concrete/i],
  ["BRICKWORK_PLASTER_SAND", /brick\s*work|plaster|masonry|sand/i],
  ["PAVERS", /paver|paving\s+block/i],
  ["KERBSTONES", /kerb|curb/i],
  ["TILES", /tile/i]
];

const HIGH_RISK = /prestress|retaining|water.?retaining|\bm\s*(3[0-9]|[4-9][0-9])\b/i;

export function classifyLine(line) {
  const description = String(line.description ?? "");
  const match = CATEGORY_RULES.find(([, pattern]) => pattern.test(description));
  const category = match?.[0] ?? "MANUAL_REVIEW";
  const highRisk = HIGH_RISK.test(description);
  const hasInputProblem = !line.unit || line.quantity === null || !description;

  return {
    ...line,
    category,
    classificationConfidence: match ? 0.82 : 0.25,
    reviewStatus: highRisk || hasInputProblem || !match ? "MANUAL_REVIEW" : "CLASSIFIED",
    classificationReasons: [
      ...(match ? [`KEYWORD_MATCH:${category}`] : ["NO_SUPPORTED_CATEGORY"]),
      ...(highRisk ? ["SAFETY_CRITICAL_DESCRIPTION"] : []),
      ...(hasInputProblem ? ["INCOMPLETE_LINE_DATA"] : [])
    ]
  };
}

export function classifyLines(lines = []) {
  return lines.map(classifyLine);
}


# Open Questions

> Items awaiting civil mentor or AWS mentor input. Any unresolved question defaults to MANUAL_REVIEW.

## Regulatory / Engineering

| # | Question | Impact | Owner | Status |
|---|---|---|---|---|
| OQ-1 | IS 383:2016 Table 1 limits — are they by mass or volume? | Denominator basis for gap calculator [A] | Civil mentor | OPEN |
| OQ-2 | What is the correct denominator for Second/Third Schedule targets — total material mass, or only construction-material mass excluding finishes? | Gap calculator denominator [A] | Civil mentor | OPEN |
| OQ-3 | Which line types must always be MANUAL_REVIEW (water-retaining structures, foundations in aggressive soils, retaining walls)? | Safety rule completeness | Civil mentor | OPEN |
| OQ-4 | IS 383:2016 Note 2 — exactly what does 'one type of manufactured coarse aggregate in a structure' mean in practice? | CONDITIONAL condition wording for R-RCC | Civil mentor | OPEN |
| OQ-5 | Paver block and kerbstone IS standards for recycled content — which standard and what max share? | R-PAVERS, R-KERBS upgrade from MANUAL_REVIEW to ELIGIBLE/CONDITIONAL | Civil mentor | OPEN |
| OQ-6 | Sub-base and backfill recycled content specifications — MORT&H or state-specific? | R-GSB, R-BACKFILL upgrade | Civil mentor | OPEN |
| OQ-7 | Is the Delhi 2016 advisory (2% building, 10% road, 5% non-structural) still current? | Context display in UI | Team / mentor | OPEN |
| OQ-8 | Gazette text of Second and Third Schedules — confirm the FY-by-FY targets directly | Target percentages [V secondary → needs primary] | Divyansh | OPEN |
| OQ-9 | Which Delhi plants currently supply which specific products? | Facility product list [U] | Team | OPEN |

## AWS / Technical

| # | Question | Impact | Owner | Status |
|---|---|---|---|---|
| OQ-10 | Is async Textract + Step Functions polling the right pattern, or should we use SNS completion events? | B3 architecture | AWS mentor | OPEN |
| OQ-11 | Tips for merged cells and multi-page BOQ tables in Textract? | Extraction quality | AWS mentor | OPEN |
| OQ-12 | Bedrock model and region availability from ap-south-1? | Feature flag decision | AWS mentor | OPEN |

## Default until resolved

All OPEN regulatory questions default to `MANUAL_REVIEW` in the evaluator until confirmed.

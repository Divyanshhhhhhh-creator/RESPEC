# Architecture Decisions

> Owner: Divyansh. All decisions D1–D12 from the Execution Plan resolved here.

| # | Issue | Decision | Rationale | Status |
|---|---|---|---|---|
| D1 | Spec timeline dated Oct 9; current date Oct 10 | Use Section 7 contracts as-is; audit was the first step | Timeline slippage — contracts still valid | ✅ Resolved |
| D2 | CSV/XLSX path: does it still use Step Functions? | Yes — same machine, Choice node skips Textract, AWS stays visible | Keeps AWS demo credible for both paths | ✅ Resolved |
| D3 | Gap needs mass per line but Line/Rec don't carry it | Added optional `massT`, `massBasis`, `excludedFromDenominator`, `excludedReason` to Line (additive, non-breaking) | Clean, non-breaking extension | ✅ Resolved |
| D4 | FLAGGED delivery state vs ledger states | FLAGGED is a delivery-level property, not a ledger state. Rec stays ORDERED; verifiedT sums only VERIFIED deliveries | Keeps ledger clean; flagged deliveries are visible but excluded | ✅ Resolved |
| D5 | When is a rec PLANNED? | APPROVE records decision; POST /plan sets approved recs to PLANNED. planned tonnes exist only after plan generation | Prevents premature PLANNED state | ✅ Resolved |
| D6 | Can MANUAL_REVIEW or NOT_ALLOWED be approved? | No override in MVP — safest option | Safety rule | ✅ Resolved |
| D7 | Can CONDITIONAL be approved? | Yes, only with approver acknowledging each condition | Conditions listed in rec.conditions[] | ✅ Resolved |
| D8 | Editing lines after evaluate | Resets status to NEEDS_REVIEW; discards recs/decisions; lines lock once any order or delivery event exists | Prevents inconsistent state | ✅ Resolved |
| D9 | Auth | Shared demo passcode in `x-demo-passcode` header validated by Lambda; value in env, never in repo | Simplest for hackathon; stated clearly in video | ✅ Resolved |
| D10 | Exports | CSV written to S3 by plan Lambda (presigned URL); PDF via browser print | No server-side PDF rendering needed | ✅ Resolved |
| D11 | Concrete aggregate fraction and density seed values | Riya proposes values in `conversions.json` flagged [E]; Divyansh approves; mentor reviews | Values in place with [E] labels and engineer-override fields | ✅ Resolved |
| D12 | R-DELHI-2016 and R-CPWD percentages | Shown as context only in UI; they do not change eligibility decisions | Avoids using unverified secondary rules | ✅ Resolved |

## Open Regulatory Questions (pending civil mentor)

See [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

# Integration Plan

> Owner: Divyansh. This document defines how the four workstreams integrate into a single product.

## Repository Structure

```
respec/
├── web/           # Aarvi — React/Vite frontend (S1–S6)
├── api/           # Bhavya — Lambda handlers, DynamoDB persistence
├── core/          # Divyansh + Riya — pure domain logic
│   ├── src/gap/       # Divyansh: computeGap()
│   ├── src/ledger/    # Divyansh: applyLedgerEvent(), replayLedger()
│   ├── src/normalize/ # Riya: unit normalisation, grade parsing
│   ├── src/classify/  # Riya: keyword classifier
│   └── src/evaluate/  # Riya: rules evaluator
├── infra/         # Bhavya — AWS SAM template
├── data/          # Riya (with Divyansh approval) — rules.json, conversions.json, facilities.json
├── eval/          # Riya — labelled set, evaluation script
├── contracts/     # Divyansh — shared TypeScript types + Zod schemas
├── fixtures/      # Divyansh — deterministic responses for all endpoints
└── docs/          # All — documentation
```

## Data Flow

```
Frontend (Aarvi)
  →  POST /jobs         (create job, get presigned URL)
  →  S3 PUT             (upload BOQ PDF)
  →  POST /jobs/{id}/start  (trigger pipeline)

API Lambda (Bhavya)
  →  Step Functions     (StartExecution)
      →  Choice: pdf? → Textract → Normalize → Classify → Persist
                rows? → Normalize → Classify → Persist
  →  DynamoDB           (write job + lines)

Frontend polls GET /jobs/{id} until NEEDS_REVIEW
  →  PATCH /jobs/{id}/lines   (human edits)
  →  POST /jobs/{id}/confirm  (lock lines)

API Lambda
  →  evaluate()              (Riya's rules evaluator)
  →  computeGap()            (Divyansh's gap calculator)
  →  POST /jobs/{id}/evaluate → {recommendations, gap}

Frontend (S4/S5)
  →  POST /jobs/{id}/decisions   (human approval)
  →  POST /jobs/{id}/plan        (generate procurement plan)
  →  POST /jobs/{id}/orders      (enter PO ref)
  →  POST /jobs/{id}/evidence-url → presigned URL
  →  S3 PUT (upload evidence)
  →  POST /jobs/{id}/deliveries  (record delivery)
  →  GET /jobs/{id}/impact       (four-state totals)
```

## Integration Rules

1. `/contracts` is the canonical source. No member invents their own shapes.
2. `/fixtures` is deterministic. Frontend uses them in mock mode (`VITE_MOCK=1`).
3. `/core` has zero AWS dependencies. Bhavya imports from `@respec/core`.
4. Any contract change: PR labelled `contract-change`, fixture updated first, announced in chat, Divyansh approves.
5. No concurrent edits to the same file — use short-lived branches.

## CODEOWNERS

| Path | Owner |
|---|---|
| `/core/gap/**`, `/core/ledger/**` | Divyansh |
| `/contracts/**`, `/data/rules.json`, `/data/conversions.json` | Divyansh |
| `/infra/**`, `/api/**` | Bhavya |
| `/core/normalize/**`, `/core/classify/**`, `/core/evaluate/**`, `/data/**` | Riya |
| `/web/**`, `/docs/SOURCES.md`, `README.md` | Aarvi |

## Integration Checkpoints

| Gate | Criteria | Target |
|---|---|---|
| C1 | Contracts frozen; fixtures valid; all 4 can start | Block 0 (done) |
| C2 | PDF→Textract→lines in review table; CSV/paste working | 12:00 |
| C3 | Full workflow on deployed stack with demo BOQ | 16:00 |
| C4 | Feature freeze; clean-browser run; eval complete | 20:00 |

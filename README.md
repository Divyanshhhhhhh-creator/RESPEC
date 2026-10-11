# ReSpec — C&D Waste Compliance BOQ Analyser

**WeMakeDevs Environmental Hacks 2026 — Waste & Energy track**

ReSpec reads a construction Bill of Quantities (BOQ), identifies which lines current Indian standards permit recycled C&D material for, calculates how close the project is to its mandatory compliance target, and tracks delivery evidence through a four-state ledger (ELIGIBLE → PLANNED → ORDERED → VERIFIED).

> **Honest limits:** Decision support only — not structural certification, not a statutory filing service, and not a live marketplace. All displayed facility stock must be confirmed by phone.

---

## Problem

C&D Waste Rules 2025 (effective April 1, 2026) require projects ≥ 20,000 m² built-up area, and all road projects, to use a minimum share of processed C&D waste — 5% of total construction material in FY 2026-27. Delhi generates ~6,054 TPD of C&D waste against 5,150 TPD of plant capacity. Yet MCD reported only 14% of recycled products were utilised in 2024-25. The bottleneck is demand and procurement.

## What ReSpec Does

1. **Reads** a BOQ (PDF via Amazon Textract, or CSV/XLSX/paste)
2. **Reviews** extracted lines — low-confidence cells highlighted for human correction
3. **Classifies** each line against 10 material categories
4. **Evaluates** with deterministic, sourced rules (IS 383:2016, C&D Rules 2025)
5. **Calculates** the compliance gap: modelled % vs mandatory target %
6. **Supports** human approval of each recommendation (structural lines → MANUAL_REVIEW, never auto-approvable)
7. **Exports** a draft procurement plan (CSV + printable, marked DRAFT)
8. **Tracks** deliveries — only evidence-backed deliveries advance verified tonnes

## AWS Architecture

```
React/Vite (Amplify)
  → API Gateway (HTTP API)
    → Lambda (api handler)
    → DynamoDB (jobs, lines, recs, decisions, deliveries)
    → S3 (boq/, evidence/, textract/)
    → Step Functions (Textract → Normalize → Classify → Persist)
      → Amazon Textract (TABLES, ap-south-1)
    → CloudWatch Logs (jobId-correlated)
```

Region: **ap-south-1**. Bedrock: **disabled by default** (feature flag `BEDROCK_ENABLED`).

## Impact Claims — Honest Labels

| Label | Meaning |
|---|---|
| Modelled | Derived from BOQ quantities × density assumptions [A] |
| Planned | Approved and in a procurement plan |
| Ordered | PO reference entered |
| Verified [S] | Delivery record + evidence file (demo evidence is synthetic) |

No CO₂ or energy savings are claimed. Facility stock is unverified [U].

## Regulatory Basis

- **C&D Waste Rules 2025** (MoEF&CC Gazette, effective April 1 2026): Second Schedule (buildings ≥ 20,000 m²) — 5% in 2026-27. Third Schedule (roads) — 5% for 2026-28.
- **IS 383:2016 Table 1**: RCA ≤ 25% in plain concrete, ≤ 20% in reinforced ≤ M25, up to 100% in lean concrete (<M15). Source and clause shown per recommendation.

## Quick Start

```bash
# Prerequisites: Node ≥ 20, AWS CLI (for deployment)
cp .env.example .env   # fill in values — see below
npm install
npm run dev            # starts the Vite frontend in mock mode
```

### Environment Variables (`.env.example`)

```
VITE_API_BASE_URL=http://localhost:3001   # or the deployed API URL
VITE_MOCK=1                               # set to 1 for mock mode (no backend)
DEMO_PASSCODE=changeme                    # shared demo credential (never real auth)
AWS_REGION=ap-south-1
DYNAMODB_TABLE=respec-jobs
S3_BUCKET=respec-boq-evidence
BEDROCK_ENABLED=false
```

### Running Tests

```bash
npm test               # all unit tests
npm run typecheck      # TypeScript check across all workspaces
npm run test:contracts # validate all fixtures against schemas
npm run eval           # run evaluation script on labelled set
```

### AWS Deployment

```bash
cd infra
sam build
sam deploy --guided    # first deploy; creates stack in ap-south-1
# connect /web repo to AWS Amplify for frontend hosting
```

## Known Limitations

- Decision support only — not a CPCB filing, not a structural certification
- Modelled material quantities depend on density assumptions [A] (labelled)
- Rules coverage is limited to sourced clauses (IS 383:2016, C&D Rules 2025)
- Facility stock is unverified [U] — straight-line distance only; confirm by phone
- Demo delivery evidence is synthetic [S]
- Denominator base for compliance target is [A] — confirmed with civil mentor

## Team

| Member | Role |
|---|---|
| Divyansh | Tech lead — contracts, gap calculator, ledger, integration, demo |
| Bhavya | AWS/backend — SAM, S3, DynamoDB, Step Functions, Textract |
| Riya | Domain engine — rules, conversions, facilities, normaliser, classifier, eval |
| Aarvi | Frontend — all 6 screens, docs, video |

## Sources & Attribution

See [`docs/SOURCES.md`](docs/SOURCES.md) and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## AI Tool Disclosure

See [`docs/AI_TOOLS.md`](docs/AI_TOOLS.md).

## Licence

MIT — see [`LICENCE`](LICENCE).

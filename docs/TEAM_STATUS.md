# Team Status Dashboard

> Owner: Divyansh. Updated at every standup (10:30, 12:00, 14:00, 16:00, 18:00, 20:00).

## Current Status (Oct 10, 2026 — Block 1 start)

| Member | Current Task | Status | Blocker | ETA | Evidence |
|---|---|---|---|---|---|
| **Divyansh** | D2 computeGap + D3 ledger | ✅ DONE | None | Done | `core/src/gap/`, `core/src/ledger/` |
| **Bhavya** | B1 SAM template + S3/DynamoDB/HTTP API | 🔴 NOT_STARTED | Waiting for task | C2 | — |
| **Riya** | R1 rules.json seed + R3 normaliser | 🔴 NOT_STARTED | Waiting for task | C2 | — |
| **Aarvi** | A1 /web scaffold + S1/S2 mock mode | 🔴 NOT_STARTED | Waiting for task | C2 | — |

## What Each Member Needs To Start RIGHT NOW

### Bhavya
**Unblocked.** Start B1:
1. Install AWS SAM CLI
2. `cd infra && sam init --name respec --runtime nodejs20.x --app-template hello-world`
3. Replace with the full template (S3 + DynamoDB + HTTP API + Lambdas)
4. Deploy and post the API URL in chat

**Handoff from Divyansh:** `/contracts/src/types.ts` and `/fixtures/*.json` are frozen. Import `@respec/core` in Lambda handlers.

### Riya
**Unblocked.** Start R1 + R3:
1. `data/rules.json` seed is done — add conversions and write the normaliser
2. Write `/core/src/normalize/` (unit normalisation, grade parsing, structural flag)
3. Write `/core/src/classify/` (keyword/fuzzy classifier)
4. Write `/core/src/evaluate/` (rules evaluator producing Rec[] and per-line massT)
5. The evaluate() function must accept `Line[]` and return `{recs: Rec[], lines: Line[]}` where lines have massT populated

**Interface to agree with Divyansh:** `evaluate(lines: Line[], projectType: ProjectType, site: {lat, lng}): {recs: Rec[], lines: Line[]}`

### Aarvi
**Unblocked.** Start A1:
1. `cd web && npm create vite@latest . -- --template react-ts`
2. Build router for S1–S6
3. Build typed API client reading from `/fixtures/*.json` when `VITE_MOCK=1`
4. Build S1 (new project form) and S2 (upload) first
5. S3 review table after Bhavya posts API URL

**Do NOT change contract types — ask Divyansh first.**

## Standing Approvals Required from Divyansh

- [ ] Riya's `evaluate()` function signature (coordinate in chat)
- [ ] Each rule and conversion value in data/
- [ ] Bhavya's IAM policies (D4)
- [ ] Step Functions ASL definition (D4)
- [ ] Final deployment before C4

## Integration Risk Log

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Textract fails on demo PDF (merged cells) | Medium | High | Use rows path for live demo; show Textract on simpler page |
| Riya's evaluate() interface diverges from computeGap() input | Medium | High | Agree signature in chat before coding |
| Bhavya's DynamoDB schema diverges from contracts | Low | High | Contracts frozen; Bhavya imports from /contracts |
| Unit tests fail on install (Zod version, vitest config) | Low | Medium | Check after `npm install` |
| Video recording runs long | Low | High | Use Aarvi's timing sheet; hard cut at 2:52 |

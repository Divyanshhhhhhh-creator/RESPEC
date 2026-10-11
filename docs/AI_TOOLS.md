# AI Tool Disclosure

ReSpec was built with assistance from AI coding tools.

## Tools Used

| Tool | Purpose | Where Used |
|---|---|---|
| Google Antigravity (Gemini / Claude) | Code generation, architecture review, contract design, test writing | `/core`, `/contracts`, `/fixtures`, `/docs`, initial scaffold |
| GitHub Copilot (if used by team members) | Inline code completion | Various — team members to confirm |

## Scope of AI Assistance

- AI tools generated initial versions of TypeScript types, Zod schemas, unit tests, and documentation structures.
- All regulatory content (IS 383:2016 limits, C&D Waste Rules 2025 targets, facility data) was independently verified against cited sources — AI did not determine eligibility rules.
- All rule records in `data/rules.json` were reviewed by the team lead (Divyansh) and are flagged for civil-mentor review.
- AI suggestions were accepted only after review; the team is responsible for all compliance claims and safety decisions.
- No AI model determines eligibility or approves any recommendation. The rules engine is deterministic and sourced.

## What AI Did NOT Do

- AI did not verify regulatory clauses against primary sources.
- AI did not design the compliance-gap formula (that is derived directly from the Spec authored by the team).
- AI did not produce or approve any delivery evidence.
- AI does not run in production — Bedrock is disabled by default.

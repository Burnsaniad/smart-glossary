# Project Progress Tracker

Update after every meaningful planning, design, or implementation change. Mark implementation complete only after inspecting the repository and verifying it.

## Current Phase
**Phase 0 — Repository Audit Complete.** Phased implementation roadmap delivered and awaiting owner approval.

## Current Goal
Await owner approval of the phased roadmap. Then execute Phase 1 (Foundation & Tooling).

## Completed — Documentation Only
- [x] Consolidated product scope and workflows in `project-overview.md` (canonical: `project.md`).
- [x] Documented modular-monolith architecture in `architecture-context.md` (canonical: `architecture.md`).
- [x] Established initial TypeScript/frontend/backend/database/security/testing conventions in `code-standards.md`.
- [x] Added Framer Motion and GSAP usage rules in `ui-context.md`.
- [x] Defined agent procedure in `ai-workflow-rules.md`.
- [x] Recorded sequence, ER, activity, and class diagrams as design references (diagrams **not yet in repo**).
- [x] Created `ANTIGRAVITY-BUILD-PLAYBOOK.md` with Prompts 0–11.
These items do not mean application code has been implemented.

## Completed — Audit & Infrastructure (Phase 0)
- [x] Full repository audit performed and verified (2026-11-25).
- [x] Phased roadmap (11 phases) created in audit-and-roadmap artifact.
- [x] Git history cleaned: `backend/node_modules/` untracked and removed from git history (was incorrectly committed); `.gitignore` corrected and committed.
- [x] Merged `master` → `dev`: all 4 diagram PNGs now present and tracked in `dev` branch.
- [x] All missing project folders created:
  - `docs/diagrams/`
  - `backend/prisma/`
  - `backend/src/config/`
  - `backend/src/middlewares/`
  - `backend/src/modules/`
  - `backend/src/lib/`
  - `frontend/src/app/`
  - `frontend/src/components/`
  - `frontend/src/features/`
  - `frontend/src/hooks/`
  - `frontend/src/lib/`
  - `frontend/src/types/`
- [x] Backend runtime dependencies installed: `@prisma/client`, `cors`, `helmet`, `dotenv`, `zod`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `express-rate-limit`, `qrcode`, `morgan`.
- [x] Backend dev dependencies installed: `prisma`, `typescript@5.8.x`, `@types/*`, `vitest`, `supertest`, `eslint`, `prettier`, `@typescript-eslint/*`. **Note:** TS downgraded from 7.0.2 → 5.8.x because `@typescript-eslint` peer dep caps at TS <6.1.

## Implementation Status (Verified from Repo — 2026-11-25)
- Repository/package manager: **npm 12.2.1 / Node.js 26.12.0**. npm lockfileVersion 3.
- Backend: Express 5.3.0 + TypeScript 5.8.x (downgraded from 7.0.2 for ESLint compat). `app.ts` and `server.ts` exist but are **empty**.
- Frontend: Directory exists but is **completely empty** (no package.json, no Next.js app).
- PostgreSQL/Prisma schema/migrations: **Not present**.
- Authentication/authorization: **Not implemented**.
- Shop approval/catalogue: **Not implemented**.
- Grocery lists/budget: **Not implemented**.
- Order lifecycle: **Not implemented**.
- QR issue/replace/verify: **Not implemented**.
- Cash payment confirmation: **Not implemented**.
- Notifications: **Not implemented**.
- Tests: **None** (test script = error placeholder).
- ESLint/Prettier: **Not configured**.
- `.gitignore`: **Present but empty**.
- `.env.example`: **Absent**.
- `tsconfig.json`: **Absent** (backend and frontend).
- Docs/diagrams: `docs/diagrams/` folder exists and all **4 PNG diagrams confirmed present** (`sequence_diagram.png`, `er-diagram-light-elk.png`, `activity-diagram.png`, `class-diagram-light.png`).
- File alias issue: AGENTS.md references `project.md` and `architecture.md` but actual files are `project-overview.md` and `architecture-context.md`. **Needs renaming or reference update**.

## Next Up (Phase 1 — Pending Owner Approval)
1. Rename `project-overview.md` → `project.md` and `architecture-context.md` → `architecture.md`.
2. Create proper `.gitignore` covering `node_modules`, `.env`, `.next`, `dist`.
3. Add `backend/tsconfig.json` (strict mode, ESM).
4. Add `backend/src/config/env.ts` with Zod env validation.
5. Implement `backend/src/app.ts`: Express app + health route + centralized error handler.
6. Implement `backend/src/server.ts`: server startup.
7. Add `backend/.env.example` with all required placeholder keys.
8. Configure ESLint + Prettier for backend.
9. Configure Vitest + first smoke test.
10. Scaffold Next.js 16 frontend with Tailwind + shadcn/ui (no features yet).
11. Update `README.md` with project overview and dev instructions.

## Open Questions
1. **[BLOCKING Phase 5]** Are grocery lists global or shop-specific? What happens with mixed-shop lists?
2. **[BLOCKING Phase 7]** QR payload: opaque token (recommended) or readable order/customer data?
3. **[BLOCKING Phase 7]** Exact start of 1-hour QR validity (assumed: QR issuance after acceptance).
4. **[BLOCKING Phase 6–7]** Separate no-show/order-expiry duration and timer start point.
5. **[BLOCKING Phase 9]** Email/SMS providers, event-channel matrix, retry/failure policy.
6. **[Needed before Phase 3]** Is Google Sign-In required?
7. **[BLOCKING Phase 6]** Post-preparation change-request timeout/decline behavior.
8. **[Post-MVP unless reprioritized]** Pantry scope, expiration warning window, MVP priority.
9. **[Needs confirmation before Phase 5]** Monthly budget MVP priority.
10. **[Needed before Phase 10]** Final UI branding (palette, fonts, logo, radius), deployment provider.
11. **[Needed before Phase 2]** Please add the 4 diagram PNG files to `docs/diagrams/`.

## Current Architecture Decisions (Confirmed)
- Next.js 16 + TypeScript frontend.
- Express.js 5 + TypeScript 7 backend.
- PostgreSQL + Prisma.
- Modular monolith; no MVP microservices.
- Backend authoritative for business rules, totals, authorization, state transitions.
- One shop per order.
- Multiple staff per shop; one shop membership per staff user.
- QR after acceptance; one-hour initial validity; single use; replacement supported.
- QR verification separate from cash confirmation.
- Order completion only after authorized staff confirms payment.
- Framer Motion for ordinary React UI transitions; GSAP for selective timeline animation.
- No AI/ML prediction/recommendation features.
- npm as package manager.
- Node.js v26.12.0 (runtime confirmed).

## Notes
- `project-overview.md` and `architecture-context.md` are the actual files; AGENTS.md references shorter names. This should be resolved to avoid agent confusion.
- TypeScript 7 ships with a native TS runner — `ts-node`/`tsx` may not be needed; evaluate before adding.
- Express 5 is now stable but confirm `@types/express` v5 compatibility.
- The original progress template contained unrelated SaaS assumptions (Turborepo, Clerk, Stripe, workspaces, RLS, document vault, etc.). Those are not project decisions and have been excluded.

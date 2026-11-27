# Project Progress Tracker

Update after every meaningful planning, design, or implementation change. Mark implementation complete only after inspecting the repository and verifying it.

## Current Phase
**Phase 4 — Shops & Catalogue Management — COMPLETE.**

## Current Goal
Await owner review and approval of Phase 4. Subsequent phases remain unstarted.

---

## Completed — Documentation Only
- [x] Consolidated product scope in `project-overview.md`.
- [x] Documented architecture in `architecture-context.md`.
- [x] Established conventions in `code-standards.md`.
- [x] Added motion rules in `ui-context.md`.
- [x] Defined agent procedure in `ai-workflow-rules.md`.
- [x] Created `ANTIGRAVITY-BUILD-PLAYBOOK.md` with Prompts 0–11.

## Completed — Audit & Infrastructure (Phase 0)
- [x] Full repository audit performed and verified (2026-11-25).
- [x] Phased roadmap (11 phases) created.
- [x] Git history cleaned: `backend/node_modules/` untracked and removed.
- [x] Merged `master` → `dev`: all 4 diagram PNGs now in `dev` branch.
- [x] All missing project folders created (backend/frontend scaffold).
- [x] Backend runtime and dev dependencies installed.

## Completed — Phase 1: Foundation & Database Setup (2026-11-26)

### TypeScript
- [x] `backend/tsconfig.json` — strict mode, `NodeNext` module, ESM, `ES2022` target.
- [x] `backend/tsconfig.build.json` — production build config (excludes test files).
- [x] `backend/tsconfig.test.json` — includes test files for ESLint parser project resolution.

### Scripts (`backend/package.json`)
- [x] `dev` — `tsx watch src/server.ts` for TypeScript development execution with NodeNext `.js` imports.
- [x] `build` — `tsc --project tsconfig.build.json`.
- [x] `type-check` — `tsc --noEmit`.
- [x] `lint` / `lint:fix` — ESLint over `src/`.
- [x] `format` / `format:check` — Prettier.
- [x] `test` / `test:watch` / `test:coverage` — Vitest.
- [x] `db:generate`, `db:migrate`, `db:migrate:deploy`, `db:studio`, `db:reset` — Prisma CLI scripts.

### Express Application Foundation
- [x] `backend/src/app.ts` — `createApp()` factory with:
  - Helmet (security headers)
  - CORS (configured from `CORS_ORIGINS` env var)
  - JSON + URL-encoded body parsing (1 MB limit)
  - Cookie parsing (signed with `COOKIE_SECRET`)
  - Morgan HTTP logging (skipped in test env)
  - `GET /health` endpoint (returns status, env, timestamp, database configured flag)
  - Centralized 404 handler
  - Centralized error handler
- [x] `backend/src/server.ts` — Server entry with graceful SIGTERM/SIGINT shutdown, uncaught exception handling.

### Middleware
- [x] `backend/src/middlewares/errorHandler.ts` — Converts `AppError`, `ZodError`, and unknown errors to consistent JSON. Hides stack traces in production.
- [x] `backend/src/middlewares/notFound.ts` — 404 handler for unmatched routes.

### Shared Libraries
- [x] `backend/src/lib/errors.ts` — `AppError` base class and 7 typed subclasses: `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `UnprocessableEntityError`, `TooManyRequestsError`.
- [x] `backend/src/lib/response.ts` — `ApiSuccessResponse`/`ApiErrorResponse` envelope types and `successResponse()`/`errorResponse()` helpers.

### Config
- [x] `backend/src/config/env.ts` — Zod-validated environment config. Fails fast on startup with readable errors. `DATABASE_URL` optional so server can start without DB.

### Linting & Formatting
- [x] `backend/eslint.config.js` — ESLint flat config with `typescript-eslint` strict + stylistic rules + prettier disables.
- [x] `backend/.prettierrc.json` — Prettier config (single quotes, trailing commas, 100 print width).
- [x] `backend/.prettierignore` — Ignores dist, node_modules, JSON, migrations, generated Prisma code.
- [x] Additional packages installed: `@eslint/js`, `typescript-eslint`.

### Testing
- [x] `backend/vitest.config.ts` — Vitest config with node environment and v8 coverage.
- [x] `backend/src/app.test.ts` — 5 tests:
  - `GET /health` → 200 with correct body
  - 404 for GET unknown route
  - 404 for POST unknown route
  - JSON body parsing doesn't crash
  - CORS OPTIONS preflight returns 200/204

### Database / Prisma
- [x] `backend/prisma/schema.prisma` — Skeleton schema with generator + datasource. No entities yet (Phase 2).
- [x] `backend/prisma.config.ts` — Prisma CLI datasource configuration aligned with Prisma 7.
- [x] `backend/src/lib/db.ts` — Lazy Prisma 7 PostgreSQL adapter singleton; no DB access during import.
- [x] Prisma packages aligned at `prisma`, `@prisma/client`, and `@prisma/adapter-pg` 7.10.1.
- [x] Generated Prisma client verified and excluded from source control and lint/format scans.
- [x] `backend/.env.example` — All placeholder keys documented (no real values).
- [x] `backend/.env` — Local environment may be configured for development; real credentials remain uncommitted.

### Phase 2: Prisma Data Model (2026-11-26)
- [x] `backend/prisma/schema.prisma` — Added User, Shop, ShopStaff, Category, Product, GroceryList, GroceryListItem, CustomerOrder, OrderItem, QRPickup, Payment, Notification, OrderChangeRequest, and OrderChangeItem.
- [x] Added confirmed role, shop, order, payment, notification, and change-request enums.
- [x] Added shop ownership/approval relations and unique staff membership (`ShopStaff.userId`).
- [x] Added grocery-list ownership/items and unresolved mixed-shop scope preserved without splitting orders.
- [x] Added order/shop/customer relations, price and name snapshots, and source-grocery-list optionality.
- [x] Added opaque QR token hash storage, expiry/revoke/consume fields, replacement history support, and one-active-token database constraint.
- [x] Added payment uniqueness per order and staff confirmer relation.
- [x] Added notification delivery/status fields and order-change request/item relations.
- [x] Added monetary and quantity check constraints through a follow-up migration.
- [x] Created and applied migration `20261126085033_phase_2_prisma_data_model`.
- [x] Created and applied migration `20261126085500_phase_2_business_constraints`.
- [x] Ran Prisma format, validate, generate, and migrate status.

### Phase 2 Verified Checks (all run, all pass)
| Command | Result |
|---|---|
| `npx prisma validate` | ✅ Schema valid |
| `npx prisma migrate status` | ✅ 2 migrations; database up to date |
| `npm run db:generate` | ✅ Prisma 7.10.1 client generated |
| `npm test` | ✅ 5/5 tests passed |
| `npm run type-check` | ✅ No errors |
| `npm run lint` | ✅ No errors |
| `npm run format:check` | ✅ All files formatted |
| `npm run build` | ✅ Compiled to `dist/` |

### Verified Checks (all run, all pass)
| Command | Result |
|---|---|
| `npm test` | ✅ 5/5 tests passed |
| `npm run type-check` | ✅ No errors |
| `npm run lint` | ✅ No errors |
| `npm run format:check` | ✅ All files formatted |
| `npm run build` | ✅ Compiled to `dist/` |

### Phase 3: Authentication and Authorization (2026-11-27)
- [x] Customer-only self-registration with Zod validation, normalized email, and bcrypt password hashing.
- [x] Login validation with generic invalid-credential responses and inactive-account rejection.
- [x] Secure signed httpOnly JWT access cookie plus bearer-token support for API clients.
- [x] Logout clears the access cookie.
- [x] `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/logout`, and `/api/v1/auth/me` routes.
- [x] Authentication middleware rehydrates current user state from Prisma on every protected request.
- [x] Role guards for `CUSTOMER`, `SHOP_OWNER`, `SHOP_STAFF`, and `ADMIN`.
- [x] Shop-owner and staff shop-membership guards.
- [x] Client-supplied role/status values are ignored or validated server-side.
- [x] Authentication route rate limiting.
- [x] Google sign-in remains out of scope; no OAuth/OIDC implementation was added.

### Phase 3 Verified Checks (all run, all pass)
| Command | Result |
|---|---|
| `npm test` | ✅ 17/17 tests passed |
| `npm run type-check` | ✅ No errors |
| `npm run lint` | ✅ No errors |
| `npm run format:check` | ✅ All files formatted |
| `npm run build` | ✅ Compiled to `dist/` |

### Phase 4: Shops & Catalogue Management (2026-11-27)
- [x] Authenticated shop registration creates a `PENDING` shop and promotes a customer to `SHOP_OWNER`.
- [x] Administrators can list pending shops and approve or reject them.
- [x] Approved shops are exposed through public shop/catalogue browsing.
- [x] Shop owners can manage their shop profile.
- [x] Shop owners can list, assign, and remove staff for their own shop.
- [x] Staff assignment uses an existing active account and enforces the unique one-shop membership.
- [x] Staff and owner routes enforce role, ownership, and shop membership.
- [x] Shop categories support shop-scoped create, list, update, and delete operations.
- [x] Products support shop-scoped create, list, update, and delete operations.
- [x] Product category ownership is validated against the selected shop.
- [x] Only shop owners can change product price or availability.
- [x] Public catalogue endpoints expose only products from approved shops and available products.
- [x] No image storage, notification, order, QR, payment, or frontend implementation was added.

### Phase 4 Verified Checks (all run, all pass)
| Command | Result |
|---|---|
| `npm test` | ✅ 32/32 tests passed |
| `npm run type-check` | ✅ No errors |
| `npm run lint` | ✅ No errors |
| `npm run format:check` | ✅ All files formatted |
| `npm run build` | ✅ Compiled to `dist/` |
| `npx prisma validate` | ✅ Schema valid |

---

## Implementation Status (Verified — 2026-11-27)
- Repository/package manager: **npm 12.2.1 / Node.js 26.12.0**.
- Backend: Express 5.3.0, TypeScript 5.9.3, fully configured. **Foundation complete.**
- Frontend: Directory scaffolded. **No Next.js app yet (Phase 10).**
- PostgreSQL/Prisma schema: **Phase 2 data model complete; 2 migrations applied.**
- Authentication/authorization: **Phase 3 complete.**
- Shop approval/catalogue: **Phase 4 complete.**
- Grocery lists/budget: **Not implemented (Phase 5).**
- Order lifecycle: **Not implemented (Phase 6).**
- QR issue/replace/verify: **Not implemented (Phase 7).**
- Cash payment confirmation: **Not implemented (Phase 8).**
- Notifications: **Not implemented (Phase 9).**
- Docs/diagrams: All 4 PNG diagrams confirmed present in `docs/diagrams/`.

---

## Steps to Connect the Real Database (Before Phase 2)

1. Create a PostgreSQL database (local or hosted).
2. Set `DATABASE_URL` in `backend/.env`:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
   ```
3. Run `npm run db:generate` to generate the Prisma client (Phase 2 schema must be defined first).
4. Run `npm run db:migrate` to apply the first migration.
5. Verify with `npm run db:studio` to inspect the database.

> **Do not run `db:migrate` until Phase 2 schema is reviewed and approved.**

---

## Open Questions
1. **[BLOCKING Phase 5]** Are grocery lists global or shop-specific? Mixed-shop list behavior?
2. **[BLOCKING Phase 7]** QR payload: opaque token (recommended) or readable order/customer data?
3. **[BLOCKING Phase 7]** Exact start of 1-hour QR validity (assumed: QR issuance after acceptance).
4. **[BLOCKING Phase 6–7]** Separate no-show/order-expiry duration and timer start point.
5. **[BLOCKING Phase 9]** Email/SMS providers, event-channel matrix, retry/failure policy.
6. **[Resolved]** Google Sign-In is not in scope for the current MVP.
7. **[BLOCKING Phase 6]** Post-preparation change-request timeout/decline behavior.
8. **[Post-MVP unless reprioritized]** Pantry scope, expiration window, MVP priority.
9. **[Needs confirmation before Phase 5]** Monthly budget MVP priority.
10. **[Needed before Phase 10]** Final UI branding (palette, fonts, logo, radius), deployment provider.

---

## Current Architecture Decisions (Confirmed)
- Next.js 16 + TypeScript frontend.
- Express.js 5 + TypeScript 5.9.x backend.
- PostgreSQL + Prisma 7.10.1.
- Modular monolith; no MVP microservices.
- Backend authoritative for business rules, totals, authorization, state transitions.
- One shop per order; multiple staff per shop; one shop per staff.
- QR after acceptance; 1-hour validity; single-use; replacement supported.
- QR verification separate from cash confirmation.
- Order completion only after authorized staff confirms payment.
- Framer Motion for ordinary React UI transitions; GSAP for selective timelines.
- No AI/ML prediction/recommendation features.
- npm as package manager; Node.js v26.12.0.

## Notes
- `project-overview.md` and `architecture-context.md` are the actual context files; AGENTS.md references shorter names (`project.md`, `architecture.md`). Rename in a cleanup commit if desired.
- `backend/dist/` is generated by build — not committed (covered by `.gitignore`).
- The `esbuild` install-scripts warning is a Vitest transitive dependency; it's safe to ignore unless strict supply-chain auditing is required.
- 1 high severity vulnerability reported by npm audit — run `npm audit fix` to review before production use.

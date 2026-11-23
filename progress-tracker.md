# Project Progress Tracker

Update after every meaningful planning, design, or implementation change. Mark implementation complete only after inspecting the repository and verifying it.

## Current Phase
Requirements and design-context consolidation. Project architecture and AI-agent documentation baseline prepared. Application implementation status has **not been verified** from the repository in this task.

## Current Goal
Inspect the actual repository, align it with the approved Next.js + Express + Prisma + PostgreSQL modular-monolith architecture, verify available scripts/dependencies, and begin small tested vertical slices.

## Completed — Documentation Only
- [x] Consolidated product scope and workflows in `project.md`.
- [x] Documented modular-monolith architecture in `architecture.md`.
- [x] Established initial TypeScript/frontend/backend/database/security/testing conventions in `code-standards.md`.
- [x] Added Framer Motion and GSAP usage rules in `ui-context.md`.
- [x] Defined agent procedure in `ai-workflow-rules.md`.
- [x] Recorded sequence, ER, activity, and class diagrams as design references.
These items do not mean application code has been implemented.

## Implementation Status (Not Yet Verified)
- Repository/package manager: not inspected.
- Frontend setup: not verified.
- Backend setup: not verified.
- PostgreSQL/Prisma schema/migrations: not verified.
- Authentication/authorization: not verified.
- Shop approval/catalogue: not verified.
- Grocery lists/budget: not verified.
- Order lifecycle: not verified.
- QR issue/replace/verify: not verified.
- Cash payment confirmation: not verified.
- Notifications: not verified.
- Tests and deployment: not verified.

## Next Up
1. Inspect repository structure, package manager, scripts, dependencies, and existing code.
2. Compare actual structure with `architecture.md`; document deviations rather than rewriting unnecessarily.
3. Confirm final MVP boundary, especially monthly budget/history/analytics/notifications.
4. Resolve high-impact open questions below.
5. Verify lint, type-check, test, and build commands.
6. Implement auth and role/shop authorization foundations.
7. Implement shop registration, admin approval, and catalogue.
8. Implement grocery lists and approved budget workflow.
9. Implement order placement and shop acceptance/rejection.
10. Implement preparation, unavailable-item handling, and customer change confirmation.
11. Implement QR issue/replacement/verification and manual order-ID fallback.
12. Implement cash confirmation/completion and notifications.
13. Complete responsive UI, animation polish, integration/security/E2E testing, and deployment.

## Open Questions
- Are grocery lists global or shop-specific? How do mixed-shop lists behave?
- Confirm QR payload option against the client questionnaire: secure token or actual order/customer information.
- Confirm exact start of one-hour QR validity (currently assumed issuance after acceptance).
- Confirm separate no-show/order-expiry duration and timer start.
- Confirm notification event/channel mapping, providers, retries.
- Is Google sign-in required?
- Confirm post-preparation change-request timeout/decline behavior.
- Confirm pantry scope/expiration warning if included.
- Confirm final design assets, palette, typography, and deployment provider.
- Confirm release boundary for monthly budget, history, analytics, notifications.

## Current Architecture Decisions
- Next.js 16 + TypeScript frontend.
- Express.js + TypeScript backend.
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

## Notes
The original progress template contained unrelated SaaS assumptions (Turborepo, Clerk, Stripe, workspaces, RLS, document vault, etc.). Those are not project decisions and have been excluded. An indicative eight-week schedule is not evidence of completed implementation.

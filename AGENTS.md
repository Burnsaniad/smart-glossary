# Smart Grocery Planner — Antigravity Workspace Instructions

This repository contains the Smart Grocery Planner & QR Pickup System.

## Required context
Before planning or changing code, read:
- `project.md`
- `architecture.md`
- `code-standards.md`
- `ui-context.md`
- `progress-tracker.md`
- `ai-workflow-rules.md`

Inspect the four diagrams in `docs/diagrams/` when changing data relationships, workflows, order states, or domain models.

## Non-negotiable constraints
- Follow `ai-workflow-rules.md` and all project context files.
- Frontend: Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui.
- Backend: Express.js + TypeScript. Database: PostgreSQL + Prisma.
- Use a modular monolith; do not introduce microservices.
- Backend is authoritative for validation, authorization, prices, totals, order states, QR verification, and payment confirmation.
- Each order belongs to exactly one shop.
- A shop may have multiple staff; each staff member belongs to only one shop.
- Only approved shops operate. Only shop owners change product prices and availability.
- QR is issued only after shop acceptance, initially valid for one hour, single-use, and replaceable. Replacing it revokes the previous QR.
- QR verification does not confirm payment. Authorized shop staff must separately confirm cash payment before order completion.
- Do not add AI/ML prediction or recommendation features.
- Use Framer Motion for ordinary React UI transitions and GSAP selectively for orchestrated timelines. Follow `ui-context.md`.
- Never invent missing business rules. Record open questions in `progress-tracker.md`.

## Agent procedure
1. Inspect the repository before proposing structural changes.
2. Work in small phases and feature units. Do not build the entire app in one pass.
3. Before each phase, state scope, affected modules, assumptions, risks, acceptance criteria, and tests.
4. Prefer test-driven implementation for business logic.
5. Do not modify unrelated files or perform broad refactors.
6. Run the repository's actual test, type-check, lint, and build commands; do not guess command names.
7. Never claim checks passed unless they were run.
8. Update `progress-tracker.md` and relevant context files after each completed phase.
9. Stop on failed tests/builds and diagnose root causes before continuing.
10. Protect secrets, production data, and destructive database operations. Ask before destructive actions or external publishing/deployment.

## Definition of done
A phase is complete only when its acceptance criteria are met, relevant tests pass, applicable type/lint/build checks pass, docs are updated, and remaining risks/open questions are reported.

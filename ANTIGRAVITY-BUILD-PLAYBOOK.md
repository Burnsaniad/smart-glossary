# Antigravity Build Playbook — Smart Grocery Planner & QR Pickup System

## How to use
1. Open your actual project repository as an Antigravity workspace.
2. Put the six canonical context files and diagrams in the repository.
3. Add the supplied `AGENTS.md` to the repository root.
4. Start with Prompt 0. Do not request a one-shot full application build.
5. Review the audit and approve the plan, then run one phase prompt at a time.
6. Review code changes and test results before moving to the next phase.

---

## Prompt 0 — Repository audit and phased plan (READ-ONLY)

You are the lead software architect and senior full-stack engineer for this project.

First read `AGENTS.md`, then all six documents: `project.md`, `architecture.md`, `code-standards.md`, `ui-context.md`, `progress-tracker.md`, and `ai-workflow-rules.md`. Inspect the four diagrams under `docs/diagrams/` if present.

Perform a READ-ONLY audit. Do not implement features or restructure the repository yet.

Inspect the actual repository: folder structure, package manager, Node version requirements, scripts, dependencies, TypeScript configs, environment examples, lint/format/test setup, Next.js app, Express app, Prisma schema/migrations, and existing tests. Do not assume the repo is empty.

Compare implementation with the specifications and identify gaps, risks, and diagram/spec discrepancies. Explicitly report unresolved decisions: (1) grocery-list scope and mixed-shop list behavior; (2) QR payload choice; (3) exact start of the one-hour QR timer; (4) separate no-show/order expiry duration; (5) notification providers, event/channel mapping and retry policy; (6) Google sign-in; (7) post-preparation change-request timeout/decline behavior; (8) pantry scope; (9) monthly budget MVP priority; (10) final UI branding/deployment decisions. Do not guess answers.

Deliver:
1. Repository audit: existing, missing, risky, inconsistent.
2. Spec and diagram discrepancies.
3. Recommended architecture based on the actual repository.
4. Dependency gap list (do not install yet).
5. Data model review with relationship/cardinality/uniqueness notes.
6. API/module breakdown.
7. Phased roadmap with dependencies and acceptance criteria.
8. Testing/security strategy.
9. First smallest implementation task.

Return the plan only. Do not write feature code or silently change specifications.

---

## Prompt 1 — Repository foundation

Proceed with the approved foundation phase only. Inspect the existing repository first. Establish or repair frontend/backend structure only where needed; verify runtime and package manager; configure strict TypeScript, environment validation, scripts, lint/format and test infrastructure using compatible current dependencies. Create minimal Next.js/Express entry points only if missing. Configure Express health check, safe logging, centralized error handling, request parsing and environment-based CORS. Configure PostgreSQL and Prisma baseline only after the data model is approved. Add `.env.example` placeholders; never write real secrets. Do not implement auth, shop workflows, orders, QR, or payment yet. Test all added behavior, run actual checks, update progress, and stop for review.

## Prompt 2 — Prisma data model

Inspect current Prisma schema and migrations. Before editing, summarize the proposed entities/relations and compare them to `docs/diagrams/er-diagram-light-elk.png` and confirmed business rules. Do not guess unresolved relationships. Pay special attention to User, Shop, ShopStaff (many staff per shop, unique staff user membership), Category, Product, GroceryList/Item, CustomerOrder/OrderItem snapshots, QRPickup replacement history, Payment, Notification, and OrderChangeRequest/Item. Use safe monetary types, FKs, indexes, uniqueness constraints, and explicit optionality. Explain destructive migration risks; do not reset valuable DB data. Create migrations, validate/generate Prisma, and test critical constraints. Update docs/progress.

## Prompt 3 — Authentication and authorization

Implement customer registration/login and role authorization only. Inspect existing auth code/dependencies. Hash passwords with a maintained algorithm; use secure cookie/session or token handling consistent with architecture. Implement validation, auth middleware, `CUSTOMER`, `SHOP_OWNER`, `SHOP_STAFF`, and `ADMIN` roles, safe logout/session invalidation where applicable, and backend role/ownership/shop membership enforcement. Prevent client-controlled role escalation. Do not implement Google sign-in until confirmed. Never expose password hashes or secrets. Add tests for valid/invalid credentials, duplicate accounts, unauthorized access, wrong roles, and privilege escalation. Update docs/progress.

## Prompt 4 — Shops, approval, staff and catalogue

Implement shop application/registration, admin approval/rejection, shop owner management, staff membership, categories, products, and customer catalogue browsing. A shop can have multiple staff; one staff user belongs to only one shop. Only shop owner changes price and availability. Every shop-side request must enforce owner/staff membership. Customers may order only from approved shops. Do not add image-storage providers unless approved. Add ownership/role tests and update docs/progress.

## Prompt 5 — Grocery lists and budget (budget scope must be confirmed)

Check `project.md` and `progress-tracker.md` for the approved monthly-budget MVP decision and grocery-list scope. If unresolved, do not implement ambiguous behavior; report the blocker and implement only independently specified list features. Customers may create/manage multiple lists; lists use catalogue references and quantities, never custom/free-text products. Recalculate estimates when quantities change. Preserve the keep-or-clear choice after ordering. If budget is approved, support monthly budget, changes during month, compare estimated total with remaining budget, and ask for confirmation when over budget. Per requirements analysis, count spending after payment/completion. No predictions/recommendations. Test ownership, quantities, totals, retention/clearing, and budget boundaries.

## Prompt 6 — Order placement and lifecycle

Implement one-shop-per-order. Backend validates shop approval, product/shop ownership, availability and quantities; loads authoritative prices; calculates totals; creates `PENDING` order and purchase-time item snapshots transactionally. Shop can accept/reject; rejected orders get no QR. Customer changes/cancellation follow confirmed stage rules. After preparation starts, changes require customer confirmation. During preparation, unavailable products are removed, order total recalculated, and customer informed. Mark ready only when preparation completes. Implement explicit server-side transition rules; reject arbitrary status updates. Do not implement QR/payment yet beyond clean integration points. Test price tampering, wrong-shop products, invalid transitions, duplicate submissions, and cancellation boundaries.

## Prompt 7 — QR pickup lifecycle

Implement secure QR issue, replacement, validation, and pickup verification. Generate only after shop acceptance (unless the owner explicitly approves a changed stage). Initial validity one hour, single-use, replacement revokes previous token and issues a fresh one-hour token. Prefer cryptographically secure opaque tokens and store hashes/non-reversible credentials. Validate expiry, consumed/revoked status, order state and staff/shop membership. Support manual order-ID fallback. Consume atomically to prevent concurrent/repeated scans. QR verification must not mark payment complete. If QR payload choice remains unresolved, stop and ask before implementation. Test valid, expired, reused, revoked, wrong-shop, invalid-state, replacement, and concurrent scan cases.

## Prompt 8 — Cash payment and completion

Implement cash-at-pickup confirmation only. Authorized staff from the order's shop confirms cash. QR verification and payment confirmation are separate. Enforce required pickup/order state. Record payment and set `COMPLETED` atomically; prevent duplicate/concurrent confirmation. Do not add online payment. Test wrong role/shop, duplicate requests, rollback, and invalid state.

## Prompt 9 — Notifications

Implement only after event/channel mapping and providers are confirmed. Keep domain events independent of provider code. Persist business state before sending email/SMS; never hold DB transactions open during external calls. Add retries/outbox only where approved. Test delivery failure, retry, idempotency, and in-app access rules.

## Prompt 10 — Frontend UI and motion

Implement customer, shop, and admin UI using `ui-context.md`, existing client design references, Tailwind, shadcn/ui, TanStack Query, and RHF/Zod where appropriate. Mobile usability is especially important for QR display and shop-side pickup. Use Framer Motion for ordinary React transitions, overlays, list/layout changes, and micro-interactions. Use GSAP selectively for true multi-element timelines. Never let both libraries animate the same element/property. Clean up GSAP timelines/listeners. Respect `prefers-reduced-motion`; do not delay checkout, QR, scanning or payment. Do not invent permanent branding while design is TBD. Verify responsive behavior, accessibility, loading/empty/error/success states and browser console/network.

## Prompt 11 — Integration, security and release review

Review all critical flows against the six docs and diagrams: registration, shop approval, catalogue, grocery list, one-shop ordering, authoritative prices/snapshots, transitions, preparation, QR expiry/reuse/replacement/wrong-shop, manual fallback, separate cash confirmation, completion, notifications, responsive UI, accessibility and reduced motion. Review auth/authorization, IDOR, secrets, CORS, rate limits, logging, error handling, and migration safety. Run actual full tests, type-check, lint and production builds. Use browser E2E if configured. Fix root causes; never weaken tests. Produce release checklist, known limitations, and updated progress. Do not deploy or publish without explicit approval.

---

## Starting message for Antigravity

Read `AGENTS.md` and all six context documents. We are starting at Phase 0. Follow Prompt 0 in `ANTIGRAVITY-BUILD-PLAYBOOK.md`. Inspect the repository and return the audit and phased implementation plan only. Do not modify application code yet.

## Message for each subsequent phase

Proceed with Prompt [N] from `ANTIGRAVITY-BUILD-PLAYBOOK.md`. Implement only this phase. Follow the project rules, use tests for new behavior, run relevant repository checks, update `progress-tracker.md`, and stop for my review before starting the next phase.

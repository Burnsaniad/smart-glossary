# AI Workflow Rules

## 1. Purpose and Source of Truth

Build the **Smart Grocery Planner & QR Pickup System** incrementally using a spec-driven workflow.

The project's context files define product behavior, architecture, code conventions, UI decisions, and implementation progress. Read the relevant context before making changes.

Use this precedence when sources disagree:
1. Explicit, recent instruction from the project owner in the current task.
2. Confirmed requirements recorded in `project.md` and the other current context files.
3. Approved architecture and code standards.
4. Supplied sequence, ER, activity, and class diagrams as design references.
5. Your own assumptions or general engineering preferences.

A diagram is a design reference, not permission to violate a confirmed business rule. If a diagram conflicts with a confirmed requirement, stop on the affected decision, explain the conflict, and ask for clarification. Do not silently reconcile it.

Implement only behavior supported by the project context. Do not invent product features, workflows, providers, or visual decisions.

## 2. Project Architecture Rules

- Frontend: Next.js 16 App Router, TypeScript, Tailwind CSS, and shadcn/ui.
- Backend: Express.js with TypeScript.
- Database: PostgreSQL through Prisma ORM.
- Architecture: modular monolith. Do not split the backend into microservices for the MVP.
- Keep frontend, backend, database, and external notification integrations clearly separated.
- The backend is authoritative for business rules, authorization, prices, totals, order state transitions, QR validation, and payment confirmation.
- Keep provider-specific email/SMS code behind an integration boundary.
- Do not add infrastructure or dependencies without a concrete requirement and documented approval.

## 3. Incremental Implementation

- Work on one small, verifiable feature unit at a time.
- Before coding, inspect the relevant existing files and understand the current implementation.
- State the intended scope, affected modules/files, assumptions, and verification plan.
- Prefer small vertical slices that can be tested end to end.
- Do not combine unrelated UI, API, database, authentication, and notification changes into one oversized task.
- Avoid broad refactors while implementing a feature.
- Preserve existing working behavior unless the task explicitly changes it.
- Do not scaffold the entire application in one speculative step.
- Do not claim completion until implementation and verification are actually done.

## 4. Handling Missing or Ambiguous Requirements

- Do not guess product behavior.
- If a requirement is ambiguous, identify the exact decision and its impact.
- Record unresolved questions in `progress-tracker.md` or the appropriate context file.
- Ask the project owner when the ambiguity affects architecture, data integrity, security, user-visible behavior, or scope.
- You may proceed with unrelated work while an unrelated question remains open.
- If a temporary assumption is explicitly approved, document it and keep it easy to change.
- Do not infer visual design decisions that are not documented in `ui-context.md` or supplied design references.

Important unresolved areas include:
- Whether grocery lists are shop-specific or can contain products from multiple shops.
- Whether QR content is an opaque token (recommended) or readable order/customer data as originally described.
- Exact no-show/order-expiry duration and timer start point; this is separate from the one-hour QR validity.
- Email/SMS providers, event-channel mapping, and retry policy.
- Whether Google sign-in is required.
- Pantry expiration warning window and MVP priority.
- Customer response behavior for post-preparation order changes.

## 5. Mandatory Business Invariants

Never weaken or bypass these rules:

### Shops and staff
- Only administrator-approved shops can operate.
- Each shop manages its own catalog.
- A shop can have multiple staff members.
- A staff member can belong to only one shop.
- Only the shop owner can change product prices and availability.
- Staff actions must be authorized against their own shop.

### Products and orders
- Each order belongs to exactly one shop.
- Customers can order catalog products only; do not add arbitrary custom products.
- Backend validates product ownership, availability, and quantities.
- Backend loads authoritative prices and calculates totals; never trust frontend totals or prices.
- Preserve purchase-time product-name and unit-price snapshots in order items.
- Customers may modify/cancel before preparation starts, subject to server-side rules.
- After preparation starts, changes require customer confirmation.
- If a product is unavailable during preparation, remove it, recalculate the total, and inform the customer, following the currently adopted workflow.
- When ordering from a grocery list, preserve the customer's keep-or-clear choice.

### QR pickup
- Generate a QR only after shop acceptance.
- Initial QR validity is one hour.
- QR is one-time use.
- Replacement QR is supported and must revoke the previous token.
- Validate expiry, revocation, prior consumption, order state, and staff/shop authorization.
- Provide manual order-ID fallback if scanning fails.
- Make token consumption atomic/concurrency-safe.
- Prefer an opaque, unpredictable QR token; do not expose personal data or order details in the QR unless the project owner explicitly approves that security trade-off.

### Payment
- MVP payment is cash at pickup.
- QR verification is not payment confirmation.
- Only authorized shop staff can confirm payment.
- Mark an order `COMPLETED` only after payment confirmation.
- Make payment confirmation and order completion transaction-safe and resistant to duplicate requests.

### Scope
- Do not add AI/ML predictions or recommendations.
- Do not add online payment gateways for the MVP.
- Do not implement microservices.
- Do not silently split mixed-shop grocery lists into multiple orders.

## 6. Backend Engineering Rules

- Keep route definitions, controllers, services, validation schemas, and persistence concerns separated where useful.
- Controllers should translate HTTP requests/responses; business logic belongs in services.
- Validate all untrusted request input on the backend.
- Enforce authentication, role authorization, resource ownership, and shop membership on every protected operation.
- Never rely on frontend route guards or hidden buttons as authorization.
- Prevent IDOR access to other customers' orders or other shops' resources.
- Use Prisma transactions for operations that must succeed or fail together.
- Use database constraints for uniqueness and referential integrity.
- Use centralized error handling and consistent API error responses.
- Avoid unnecessary repository abstractions or class hierarchies. Use functions/modules where they fit the Express codebase.
- Use versioned API routes under `/api/v1`.
- Do not expose stack traces, secrets, password hashes, or raw QR tokens in API responses or logs.
- Keep external network calls (email/SMS) outside open database transactions.
- Use Prisma migrations for schema changes; do not use production schema mutation shortcuts.

## 7. Frontend Engineering Rules

- Use Next.js App Router conventions.
- Prefer Server Components when interactivity is not needed; use Client Components for interactive UI.
- Use TanStack Query for server state and API caching; do not create duplicate ad-hoc fetching layers with `useEffect`.
- Keep API calls in a dedicated client/service layer.
- Use TypeScript types for API inputs and outputs; do not spread `any`.
- Use React Hook Form and Zod for forms when appropriate.
- Reuse existing shadcn/ui components and project design tokens.
- Preserve the approved design; do not redesign unrelated screens.
- Display loading, empty, error, and success states for data-driven screens.
- Treat frontend validation as user experience, not a replacement for backend validation.
- Do not store long-lived authentication secrets in local storage.

## 8. Database and Prisma Rules

- Inspect the current Prisma schema and migrations before editing.
- Check schema changes against the supplied ER diagram and confirmed invariants.
- Keep `ShopStaff.shopId` non-unique so a shop can have multiple staff; ensure the staff user's membership is unique to enforce one shop per staff member.
- Preserve order-item snapshots for product name and unit price.
- Support QR replacement history without allowing multiple simultaneously usable tokens for one pickup.
- Model payment constraints consistently with the MVP's cash-only, one-confirmation workflow.
- Use explicit relations, appropriate indexes, foreign keys, and uniqueness constraints.
- Avoid destructive migrations unless explicitly approved and accompanied by a safe migration plan.
- Never edit generated Prisma client files manually.
- Regenerate generated artifacts using the project's configured commands after schema changes.

## 9. Security and Privacy Rules

- Hash passwords with a suitable password-hashing algorithm; never store plaintext passwords.
- Use secure session/token handling as defined by the approved architecture.
- Protect cookies appropriately and apply CSRF protections where relevant to the chosen authentication design.
- Validate and normalize all untrusted input.
- Apply rate limits to authentication and sensitive endpoints.
- Keep secrets in environment variables; never commit real credentials.
- Provide `.env.example` with placeholders only.
- Do not log passwords, authentication tokens, raw QR secrets, or sensitive personal data.
- Ensure every customer can access only their own protected resources, and shop users only the resources permitted by their shop membership and role.

## 10. Testing and Verification

For every implementation unit:
1. Identify expected behavior and relevant invariants.
2. Add or update tests before or alongside implementation.
3. Test success paths and important failure/authorization paths.
4. Test boundary conditions such as invalid quantities, unavailable products, wrong-shop staff, expired QR, reused QR, and duplicate payment confirmation where relevant.
5. Run the narrowest relevant test suite first.
6. Run the project's type-check, lint, test, and build commands that are available and relevant.
7. Report commands actually run and their results.
8. Do not claim a test passed if it was not run.
9. Do not weaken, skip, or delete tests merely to make a change pass.
10. For concurrency-sensitive operations (QR consumption and payment completion), verify atomicity/idempotency through appropriate tests.

## 11. Protected Files and Change Boundaries

Do not modify these without a clear need and explicit task scope:
- Generated shadcn/ui component internals under `components/ui/*`.
- Third-party library internals.
- Generated Prisma client artifacts.
- Lockfiles or package configuration unrelated to the task.
- Existing context/design files unrelated to the task.

Do not perform broad formatting or refactoring across unrelated files.

## 12. Documentation Synchronization

Update context documentation when a decision or implementation changes:

- Product scope, roles, workflow, or business rules → `project.md`
- Module boundaries, API contracts, data ownership, persistence, or security architecture → `architecture.md`
- Naming, formatting, TypeScript, testing, and coding conventions → `code-standards.md`
- Visual design, layout, components, and responsive behavior → `ui-context.md`
- Current implementation state, completed work, blockers, and open questions → `progress-tracker.md`
- Agent behavior and implementation workflow → `ai-workflow-rules.md`

Keep documentation concise, factual, and consistent. Do not mark a feature complete until it is implemented and verified.

## 13. Required Working Procedure for Each Agent Task

### Before implementation
1. Read `project.md`.
2. Read the relevant parts of `architecture.md`, `code-standards.md`, `ui-context.md`, and `progress-tracker.md` if present.
3. Inspect the actual repository; do not assume files or dependencies exist.
4. Identify the smallest useful implementation unit.
5. List affected files and relevant business invariants.
6. Identify unresolved requirements and ask before making consequential assumptions.
7. State a short implementation and test plan.

### During implementation
1. Make only the scoped changes.
2. Follow existing code patterns unless they conflict with a documented rule.
3. Keep code readable and avoid unnecessary abstractions.
4. Add tests for the changed behavior.
5. Update types, validation, and API contracts together where required.
6. Do not introduce unrelated features or dependencies.

### After implementation
1. Review the diff for unrelated changes, secrets, and accidental behavior changes.
2. Run relevant tests, type-check, lint, and build commands.
3. Fix regressions caused by the change.
4. Update relevant context files and `progress-tracker.md`.
5. Summarize what changed, files touched, tests run, results, and remaining risks/open questions.
6. Stop and report blockers honestly if verification cannot be completed.

## 14. Definition of Done

A feature unit is done only when:
- It matches the documented requirement.
- Its backend authorization and validation are enforced where applicable.
- Its database changes are migrated safely.
- Relevant tests pass.
- Type-check/lint/build checks pass where configured and applicable.
- No confirmed business invariant is violated.
- Documentation and progress tracker are updated.
- The final report distinguishes completed work from remaining work and assumptions.

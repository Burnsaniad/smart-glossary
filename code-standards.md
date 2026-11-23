# Code Standards

These are initial conventions. Inspect the repository's existing scripts/configuration first and preserve compatible established patterns. Record approved deviations here.

## Principles and Naming
- Prefer readable, maintainable code and focused functions/modules.
- Use TypeScript in frontend and backend.
- Components/files: `PascalCase`; variables/functions/hooks: `camelCase`; types/interfaces/enums: `PascalCase`; true module constants: `UPPER_SNAKE_CASE`; feature directories/routes: `kebab-case`.
- Boolean names should communicate meaning (`isAvailable`, `canCancel`).
- Use domain names consistently: `CustomerOrder`, `OrderItem`, `ShopStaff`, `QRPickup`.

## TypeScript
- Avoid `any`; use `unknown` for untrusted values and narrow explicitly.
- Define explicit API/domain boundary types; infer simple local variables.
- Use discriminated unions for stateful outcomes where useful.
- Avoid non-null assertions unless the invariant is guaranteed/documented.
- Types do not replace runtime validation.
- Keep frontend/backend API contracts synchronized.

## Frontend
- Follow Next.js App Router.
- Prefer Server Components; add `"use client"` only for state, browser APIs, event handlers, or animation.
- Use TanStack Query for server state; keep HTTP calls in a dedicated API layer.
- Use React Hook Form + Zod for complex forms.
- Compose reusable shadcn/ui components; preserve existing tokens/design.
- Use semantic HTML, accessible labels, keyboard interactions, visible focus, and adequate contrast.
- Implement loading, empty, error, success, and pending/disabled states.
- Frontend validation is UX only; backend validation remains mandatory.

## Backend
- Separate routes, controllers, services, validation, and persistence where useful.
- Controllers handle HTTP mapping; services own domain workflows.
- Validate every untrusted request at API boundary.
- Centralize safe error handling; do not expose stack traces/database internals.
- Enforce role, ownership, and shop membership on protected operations.
- Use Prisma transactions for multi-step invariants.
- Avoid unnecessary repository abstractions and class hierarchies.
- Keep external network calls outside DB transactions.

## Database / Prisma
- Inspect schema and migrations before editing.
- Use Prisma migrations; never edit generated client files manually.
- Add appropriate foreign keys, indexes, and uniqueness constraints.
- Do not make `ShopStaff.shopId` unique; enforce one shop membership per staff user.
- Preserve order name/price snapshots.
- Use decimal-safe currency handling; avoid floating-point arithmetic for authoritative money calculations.
- Avoid destructive migrations without approval and a safe plan.

## Formatting and Testing
- Follow configured ESLint, formatter, TypeScript, and package scripts; do not add/replace tools without reason.
- Unit-test domain rules; integration-test APIs, authorization, persistence, and transactions.
- Cover success, failure, wrong role/shop/owner, unavailable product, invalid quantity, expired/reused QR, and duplicate payment cases as relevant.
- Test concurrency-sensitive QR consumption/payment completion.
- Run relevant tests, type-check, lint, and build. Report exact commands/results; never claim an unrun check passed.
- Never weaken/delete tests just to get green.

## Security
- Hash passwords; never store plaintext.
- Validate/normalize untrusted input.
- Do not log credentials, tokens, or raw QR secrets.
- Secrets belong in environment variables; commit placeholders only.
- Rate-limit authentication/sensitive operations.
- Prevent IDOR and enforce ownership/shop scope.
- Do not store long-lived auth secrets in localStorage.
- Configure secure cookies and CSRF protections appropriate to the auth design.

## Change Hygiene
Keep diffs focused. Do not reformat/refactor unrelated files. Do not modify generated UI/Prisma files or third-party internals without clear need. Do not commit secrets, local env files, or build artifacts. Follow repository commit-message conventions; otherwise use concise imperative messages.

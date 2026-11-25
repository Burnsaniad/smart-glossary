# Architecture Context

## Architecture Style
Use a **modular monolith**: one Express application, one PostgreSQL database, feature-oriented modules. No microservices for MVP. Next.js owns UI/rendering; Express owns business rules, authorization, transactions, and persistence; external providers are accessed through adapters.

## Stack
| Layer | Technology | Responsibility |
|---|---|---|
| Web | Next.js 16 App Router + TypeScript | Customer/shop/admin UI |
| UI | Tailwind CSS + shadcn/ui | Styling/components |
| Animation | Framer Motion + GSAP | UI motion; see `ui-context.md` |
| Server state | TanStack Query | API cache/mutations |
| Forms | React Hook Form + Zod | Form state/validation |
| API | Node.js + Express.js + TypeScript | REST/business rules |
| ORM/DB | Prisma + PostgreSQL | Persistence/migrations |
| QR | Library to be selected | QR generation/scanning |
| Tests | Select after repo inspection | Unit/integration/E2E |

Do not assume Clerk, Turborepo, Stripe, workspace tenancy, S3/R2, or unrelated SaaS infrastructure. These are not approved project decisions.

## Suggested Repository
```text
grocery-planner/
├── frontend/src/{app,components,features,hooks,lib,types}/
├── backend/
│   ├── prisma/{schema.prisma,migrations/}
│   └── src/{config,middlewares,modules,lib,app.ts,server.ts}
└── docs/diagrams/
```
Inspect the actual repository first; adapt without unnecessary restructuring.

## Backend Modules
`auth`, `users`, `shops`, `categories`, `products`, `grocery-lists`, `orders`, `qr-pickup`, `payments`, `notifications`, `admin`; `shop-staff`, `budgets`, and `pantry` may be separate modules when scope justifies them.

A feature module may contain routes, controllers, services, schemas, and types. Add repositories only where useful, not mechanically.

## Responsibility Boundaries
- Routes map HTTP methods/paths to middleware/controllers.
- Middleware handles authentication, authorization, validation, rate limiting.
- Controllers map HTTP requests/responses; no domain workflow logic.
- Services own business rules, state transitions, and transaction coordination.
- Prisma handles persistence/transactions.
- Integrations isolate QR, email, SMS, and other providers.
- Frontend feature modules contain UI, hooks, API functions, schemas, and types.

## Authentication and Authorization
Roles: `CUSTOMER`, `SHOP_OWNER`, `SHOP_STAFF`, `ADMIN`. Application-managed auth is the current direction. Customer registration/login is required; confirm whether Google sign-in is required before adding OAuth/OIDC. Hash passwords. Use secure cookie/session or token handling; no long-lived secrets in localStorage. Only admin-approved shops operate. Each staff member belongs to one shop; a shop can have many staff. Verify role, resource ownership, and shop membership on every protected request. OAuth 2.0 is an authorization framework; OpenID Connect supplies third-party sign-in identity.

## Data and Persistence
PostgreSQL + Prisma stores users, shops/staff, categories/products, lists/items, orders/items, payments, QR metadata, notifications; budgets/pantry depend on release scope.
- Preserve order item name and unit-price snapshots.
- Store QR token hash/non-reversible credential, order link, expiry, consumed/revoked timestamps.
- Use foreign keys, unique constraints, indexes, and transactions.
- Use Prisma migrations for schema changes.
- `ShopStaff.shopId` must not be unique; `ShopStaff.userId` must be unique.
- Each order belongs to exactly one shop.
- QR replacement history may have multiple rows; only one active usable token.
- Payment confirmation is scoped to the order's shop.

## API Design
- Base path `/api/v1`.
- Resource areas: `/auth`, `/users`, `/shops`, `/categories`, `/products`, `/grocery-lists`, `/orders`, `/qr`, `/payments`, `/notifications`, `/admin`; add `/budgets` and `/pantry` only if approved.
- REST/JSON over HTTPS.
- Define DTOs, validation, pagination, error envelope, and status-code conventions consistently.
- Never expose Prisma internals/stack traces.
- Never accept client-authoritative prices, totals, roles, payment status, or order status.

## Critical Transactions
- Order placement: validate shop/product/availability/quantity, load prices, calculate total, create order and item snapshots transactionally.
- QR: issue after acceptance; one-hour validity; replacement revokes prior token; validate expiry/use/revocation/order/staff shop; consume atomically.
- Payment: QR is not payment; authorized staff confirms cash; record payment and complete order atomically/idempotently.
- Notifications: persist business change first; send email/SMS outside DB transaction. Consider outbox/retries only when requirements justify.

## Invariants
Backend is authoritative; one shop per order; approved shops only; owner-only price/availability changes; staff shop-scoped; state transitions enforced server-side; post-preparation changes require customer confirmation; QR one-hour/single-use/replacement; payment separate from QR; completion requires payment; concurrency-safe QR/payment; no AI predictions/recommendations; no external notification call inside DB transaction.

## Open Architecture Decisions
Auth/session details and Google OIDC; QR library and scan-device support; email/SMS providers/retries; test/E2E tools; deployment and image storage; API error/pagination conventions; transactional outbox need.

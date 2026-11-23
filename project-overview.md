# Smart Grocery Planner & QR Pickup System

## 1. Project Overview

The Smart Grocery Planner & QR Pickup System is a web application that helps customers plan grocery purchases and place pre-orders with participating grocery shops. Customers browse an approved shop's catalog, select products and quantities, submit an order, and receive a QR code after the shop accepts the order. Shop staff use the QR code (or a manual order-ID fallback) to verify pickup. Cash payment is confirmed separately by authorized shop staff.

The goal is to reduce customer waiting time at grocery shops by allowing shops to review and prepare accepted orders before customers arrive.

This is a **multi-shop application**, not a workspace-based SaaS tenancy product. Each shop manages its own catalog and staff. Each order belongs to exactly one shop.

## 2. Product Goals

1. Let customers register, sign in, browse approved grocery shops, and view each shop's catalog.
2. Let customers create and manage multiple grocery lists.
3. Let customers place orders using products from a shop's catalog.
4. Let shop owners and staff process incoming orders and prepare accepted orders.
5. Provide secure, time-limited, one-time QR pickup verification.
6. Record cash payment confirmation separately from QR verification.
7. Provide administrators with shop approval and platform-management capabilities.
8. Keep the system understandable and maintainable as a modular monolith.
9. Support responsive use on mobile, tablet, and desktop.
10. Keep the first release English-only.

## 3. Technology Stack

### Frontend
- Next.js 16 with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query for server-state/API data
- React Hook Form and Zod where form validation is needed

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

### Integrations
- QR-code generation and scanning support
- In-app notifications
- Email provider (provider not yet selected)
- SMS gateway (provider not yet selected)

Do not introduce additional frameworks, infrastructure, or third-party services without checking the existing architecture/context files and recording the decision.

## 4. User Roles

The application has four roles:

- `CUSTOMER`: browses shops, manages grocery lists, places and tracks orders, and presents the pickup QR code.
- `SHOP_OWNER`: manages their shop, catalog, prices, product availability, and shop staff; processes shop orders.
- `SHOP_STAFF`: works for one shop and performs authorized order, pickup, and cash-payment operations.
- `ADMIN`: reviews and approves shop registrations and performs platform-level administration.

### Staff and shop membership rules
- A shop can have multiple staff members.
- A staff member can work for only one shop.
- A shop must be approved by an administrator before it can operate.
- Only the shop owner can change product prices and product availability.
- Staff actions must be authorized and scoped to the staff member's own shop.

## 5. Mandatory MVP Features

The client questionnaire identifies these as mandatory:

1. Customer registration and login.
2. Grocery lists.
3. Product catalog.
4. Order placement.
5. Shop dashboard.
6. QR-code pickup.
7. Payment confirmation.

### Additional requested features
These were requested but are not part of the mandatory core order-processing flow. Confirm priority before including them in the MVP:
- Monthly grocery budget and budget checking.
- Pantry inventory.
- Product expiration alerts.
- Shopping history.
- Spending reports and historical analytics.
- Notifications.

Budget and pantry capabilities should be treated as post-MVP unless the project owner explicitly reprioritizes them.

## 6. Core User Workflows

### 6.1 Customer registration and browsing
1. Customer registers or signs in.
2. Customer browses shops that have been approved by an administrator.
3. Customer opens a shop and browses its categories and available products.
4. Product prices and availability shown to the customer come from the backend catalog.

### 6.2 Grocery lists
- A customer can create and manage multiple grocery lists.
- A list contains catalog product references and quantities.
- Customers can choose to place an order using items from a grocery list.
- When placing an order from a list, ask whether the customer wants to keep or clear that list.
- The order itself belongs to one shop. A grocery list may contain products associated with different shops unless the product owner confirms a shop-specific list rule. Do not silently split a list into multiple orders or assume it is shop-specific.

### 6.3 Order placement
1. Customer selects one shop.
2. Customer selects catalog products and quantities, or uses eligible grocery-list items.
3. Frontend submits product identifiers and quantities; it must not be trusted to supply authoritative prices or totals.
4. Backend validates that the shop is approved, products belong to the selected shop, products are available, and quantities are valid.
5. Backend loads current authoritative prices and calculates the total.
6. Backend creates an order and order-item snapshots with status `PENDING`.
7. The order stores the purchase-time product name and unit-price snapshots so later catalog edits do not rewrite order history.
8. Customer is asked whether to keep or clear the source grocery list when applicable.
9. Shop receives a new-order notification.

### 6.4 Shop acceptance or rejection
- Shop owner/staff reviews the pending order.
- The shop can accept or reject it.
- If rejected, update the order status to `REJECTED`, notify the customer, and do not generate a QR code.
- Generate a QR code only after the shop accepts the order.
- The shop dashboard is the operational interface for reviewing, accepting/rejecting, preparing, and handing over orders.

### 6.5 Preparation and unavailable products
- Shop staff starts preparation and the order moves to the preparation state.
- The customer can modify or cancel the order before preparation starts, subject to backend validation.
- After preparation starts, changes require customer confirmation.
- If a product is unavailable during preparation, remove it from the order, recalculate the total, and inform the customer. This is the adopted working rule; do not invent an alternative substitution workflow.
- Once preparation is complete, mark the order `READY_FOR_PICKUP`.

### 6.6 QR pickup
- QR generation happens only after shop acceptance.
- Initial QR validity is one hour.
- QR is single-use.
- Replacement QR generation is supported. Reissuing a QR must revoke the previous token and create a new one-hour token.
- Shop staff scans the QR to verify pickup.
- If scanning fails, staff can use the manual order-ID fallback.
- Backend verifies token validity, expiry, unused/revoked state, order state, and that the staff member belongs to the order's shop.
- QR consumption must be atomic so concurrent/repeated scans cannot consume the same token successfully more than once.
- An expired, invalid, revoked, consumed, or wrong-shop QR must be rejected.

#### QR payload security decision
The original client workflow describes order information being available through the QR. The recommended implementation is to encode only an opaque, unpredictable token in the QR, not customer personal information or a complete order payload. The backend uses the token to retrieve and validate the order. Treat this as a security recommendation that needs explicit product-owner approval if the client requires a different payload.

### 6.7 Payment and completion
- MVP payment method is cash at pickup.
- QR verification is not proof of payment.
- Authorized shop staff confirms cash payment separately.
- The backend records payment confirmation and changes the order to `COMPLETED` only after payment is confirmed.
- Payment confirmation and order completion should be performed atomically and safely against duplicate/concurrent requests.
- Historical spending/analytics should use confirmed payment amounts, not pending order totals.

## 7. Order States and Business Invariants

The diagrams currently show the following order states:
- `PENDING`
- `ACCEPTED`
- `REJECTED`
- `PREPARING`
- `READY_FOR_PICKUP`
- `CANCELLED`
- `COMPLETED`
- `EXPIRED`

Use the existing project diagrams and architecture decisions as the reference when implementing transitions. Do not add or rename states without documenting and approving the change. In particular:
- One order belongs to one shop.
- Only approved shops can operate.
- Backend calculates totals using authoritative prices.
- Order items retain product-name and unit-price snapshots.
- QR is created only after acceptance, is initially valid for one hour, and is single-use.
- Replacing a QR revokes the previous QR token.
- QR verification and payment confirmation are separate operations.
- An order is completed only after payment confirmation.
- Staff operations are restricted to their own shop.
- Only the shop owner changes product prices and availability.
- Customer changes/cancellation are restricted once preparation starts; later changes require customer confirmation.
- Enforce all state transitions and authorization rules on the backend, not only in the UI.

The diagrams include an order-change request concept. Use it to guide the customer-confirmation workflow after preparation starts, but do not expand it into an elaborate approval subsystem unless the approved requirements and implementation plan call for it.

## 8. Notifications

The selected notification channels are:
- In-app
- Email
- SMS

Important events include:
- New order received by the shop.
- Order accepted or rejected.
- Order ready for pickup.
- Payment confirmed / order completed.

The exact provider, delivery strategy, retry policy, and channel-by-event matrix have not yet been finalized. Keep provider-specific code behind a notification integration boundary. Do not hold a database transaction open while making external email/SMS network calls. Persist the business change first, then dispatch notifications through an appropriate reliable mechanism.

## 9. Architecture

### 9.1 Architectural style
Use a **modular monolith** for the Express.js backend:
- One deployable Express application.
- Feature-oriented modules with clear responsibilities.
- Shared PostgreSQL database accessed through Prisma.
- No microservices for the MVP.

### 9.2 Suggested repository structure

```text
grocery-planner/
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── lib/
│       └── types/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── config/
│       ├── middlewares/
│       ├── modules/
│       ├── lib/
│       ├── app.ts
│       └── server.ts
└── docs/
```

Adapt names only when the existing repository or approved code standards require it.

### 9.3 Suggested backend modules
- `auth`
- `users`
- `shops`
- `shop-staff` (may be part of the shops module if that is clearer)
- `categories`
- `products` / catalog
- `grocery-lists`
- `orders`
- `qr-pickup`
- `payments`
- `notifications`
- `admin`

Each module may contain routes, controllers, services, schemas, and types. Add repositories only where they provide a useful abstraction; do not create layers mechanically.

### 9.4 Responsibility boundaries
- Frontend: rendering, interaction, client-side form feedback, and API consumption.
- Express middleware: authentication, authorization, request validation, and centralized error handling.
- Controllers: HTTP request/response mapping; keep business logic out.
- Services: business rules, workflows, state transitions, and transaction coordination.
- Prisma/data access: database reads/writes and transactions.
- PostgreSQL: persistent relational data and constraints.
- Notification integration: in-app persistence and external email/SMS delivery.
- QR module: secure token creation, expiry, replacement, and verification.

### 9.5 Frontend conventions
- Use Next.js App Router.
- Prefer Server Components for non-interactive rendering and Client Components where interaction/state requires them.
- Use TanStack Query for server state rather than ad-hoc duplicated fetching with `useEffect`.
- Keep API calls in a dedicated API/client layer.
- Use React Hook Form and Zod for complex forms where appropriate.
- Preserve the approved visual design and existing Tailwind/shadcn patterns.

## 10. API Resource Areas

Use versioned routes under `/api/v1`. The following are resource areas, not a finalized endpoint contract:

- `/auth`
- `/users`
- `/shops`
- `/categories`
- `/products`
- `/grocery-lists`
- `/orders`
- `/qr`
- `/payments`
- `/notifications`
- `/admin`

Define exact endpoint names, request/response DTOs, pagination conventions, and error formats in the architecture/API documentation before or alongside implementation.

## 11. Data Model Reference

The supplied ER and class diagrams are the current visual design references. They include these main entities/classes:

- `User`
- `Shop`
- `ShopStaff`
- `Category`
- `Product`
- `GroceryList`
- `GroceryListItem`
- `CustomerOrder`
- `OrderItem`
- `QRPickup`
- `Payment`
- `Notification`
- `OrderChangeRequest`
- `OrderChangeItem`

The diagrams also show role/status/payment enumerations. Treat the diagrams as design references, not permission to ignore relational constraints or business invariants.

Important relationship constraints:
- One shop has many staff; a staff user's membership is unique because each staff member works for only one shop. `shopId` on the staff-membership record must not be unique.
- A shop has its own categories and products.
- An order belongs to one shop and has one customer.
- An order contains one or more order items.
- QR records may have multiple historical rows per order to support replacement/revocation history; only one current valid token should be usable.
- An order has at most one confirmed cash-payment record for the MVP unless a future requirement explicitly introduces split payments or multiple attempts.
- A customer can own multiple grocery lists; a list has multiple list items.
- Staff/payment confirmation must be scoped to the order's shop.

Before changing schema fields, cardinalities, or uniqueness constraints, compare the proposed change with the ER diagram and document any necessary correction.

## 12. Security and Reliability Requirements

- Hash passwords using a suitable password-hashing algorithm; never store plaintext passwords.
- Use secure authentication/session or token handling consistent with the approved architecture.
- Do not store long-lived authentication secrets in browser local storage.
- Validate and normalize all untrusted input on the backend.
- Enforce authorization and resource ownership on every protected operation.
- Never trust client-supplied prices, totals, roles, shop IDs, payment status, or order status.
- Scope shop operations to the authenticated owner/staff membership.
- Prevent insecure direct object reference (IDOR) access to another customer's order or another shop's resources.
- Use database constraints and transactions for critical invariants.
- Make QR verification and payment completion concurrency-safe and idempotent where appropriate.
- Apply rate limiting to authentication and sensitive endpoints.
- Avoid logging passwords, raw QR secrets, session tokens, or other sensitive data.
- Keep secrets in environment variables and provide an example environment file without real credentials.
- Use Prisma migrations for schema evolution; do not use production schema mutation shortcuts.
- Do not call email/SMS providers while holding a database transaction open.

## 13. Explicitly Out of Scope / Not Approved

- AI/ML predictions, demand forecasting, automated recommendations, or predictive restocking.
- Microservices architecture for the MVP.
- Online payment gateways for the MVP; cash at pickup is the selected method.
- Custom/free-text grocery products outside the shop catalog.
- Automatic splitting of a mixed-shop grocery list into multiple orders unless confirmed.
- Unspecified integrations or product behavior.

Do not add features merely because they are common in grocery or SaaS applications.

## 14. Open Questions — Do Not Guess

Record answers in `progress-tracker.md` or the appropriate context file before implementing affected behavior:

1. Should grocery lists be global customer lists or scoped to a particular shop? What should happen when a list contains products from multiple shops?
2. Does the QR encode only an opaque token (recommended) or does the client explicitly require readable order/customer details in the QR?
3. What exact event starts the one-hour QR validity period? The current working assumption is QR issuance after acceptance.
4. What is the separate no-show/order-expiry duration and when does its timer begin? This is distinct from the QR's one-hour expiry.
5. Which email and SMS providers will be used, and which events use which channels?
6. What retry/failure behavior is required for email/SMS delivery?
7. Is Google sign-in required, or are email/phone and password sufficient for the first release?
8. What are the pantry expiration warning window and exact pantry MVP requirements, if pantry is reprioritized?
9. What are the final visual design specifications and hosting/deployment provider?
10. What is the exact behavior when a customer does not respond to a post-preparation order-change request?

Do not block unrelated work because an unrelated question is open. Do not implement behavior affected by an unresolved question until it is resolved or explicitly assigned a documented working assumption.

## 15. Supplied Design References

The project owner supplied these diagrams as the current design references:

- `sequence_diagram.png` — sequence diagram for authentication, product selection, order placement, shop acceptance, QR generation, preparation, pickup verification, payment, and completion.
- `er-diagram-light-elk.png` — ER diagram showing the current entities, attributes, keys, and relationships.
- `activity-diagram.png` — activity diagram showing Customer, Shop Owner/Shop Staff, and System workflows.
- `class-diagram-light.png` — class diagram showing classes, attributes, methods, and enumerations.

When these image files are available in the repository, keep them under a documented location such as `docs/diagrams/`. Do not assume the AI agent can access images that have not been added to its working repository/context. If a diagram conflicts with a confirmed business rule, flag the conflict and ask for a decision rather than silently changing either.

## 16. Success Criteria

The core MVP is successful when:
1. A customer can register/sign in and browse approved shops.
2. A shop owner can manage their shop catalog, categories, prices, and availability.
3. A customer can create/manage grocery lists.
4. A customer can place an order with one shop using valid catalog products.
5. The backend validates the order and calculates its total from authoritative prices.
6. The shop can accept or reject the order.
7. A QR is issued only after acceptance, with one-hour initial validity and one-time use.
8. Shop staff can verify pickup by QR or manual order-ID fallback, with shop-membership authorization.
9. The system handles unavailable items and recalculates the order total according to the agreed rule.
10. QR verification does not itself mark payment as complete.
11. Authorized staff can confirm cash payment, after which the order becomes `COMPLETED`.
12. Critical state changes and notifications are recorded reliably.
13. Protected operations enforce authentication, authorization, ownership, and shop boundaries.
14. Relevant automated tests cover critical business rules and concurrency-sensitive flows.
15. The frontend is responsive and follows the approved UI context.

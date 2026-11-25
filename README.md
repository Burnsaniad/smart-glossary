# Smart Grocery Planner & QR Pickup System

A web application that lets customers plan grocery purchases and place pre-orders with participating grocery shops. Shop staff verify pickup via QR code; cash payment is confirmed separately.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui |
| Animation | Framer Motion + GSAP |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Backend | Node.js + Express.js 5 + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |

## Project Structure

```
Smart_Glossary/
├── frontend/           # Next.js 16 App Router application
│   └── src/
│       ├── app/        # App Router pages
│       ├── components/ # Shared UI components
│       ├── features/   # Feature-specific modules
│       ├── hooks/      # Custom React hooks
│       ├── lib/        # API client, utilities
│       └── types/      # Shared TypeScript types
├── backend/            # Express.js REST API
│   ├── prisma/         # Prisma schema & migrations
│   └── src/
│       ├── config/     # Env validation, app config
│       ├── middlewares/ # Auth, error handling, rate limiting
│       ├── modules/    # Feature modules (auth, shops, orders, qr, ...)
│       └── lib/        # Utilities (jwt, password, qr tokens)
└── docs/
    └── diagrams/       # Design reference diagrams
```

## Getting Started

> Setup instructions will be added after Phase 1 is complete.

## Context Documents

- `project-overview.md` — Full product specification
- `architecture-context.md` — Architecture decisions
- `code-standards.md` — Coding conventions
- `ui-context.md` — UI/UX and animation rules
- `progress-tracker.md` — Implementation progress
- `ai-workflow-rules.md` — Agent workflow rules
- `ANTIGRAVITY-BUILD-PLAYBOOK.md` — Phased build prompts


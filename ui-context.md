# UI Context

## Product UI Areas
- Customer: approved shop discovery, catalogue, grocery lists, budget (if in release), checkout, order tracking, QR pickup.
- Shop dashboard: order queue/details, preparation, pickup verification, cash payment confirmation.
- Admin: shop approval and platform administration.
This is not a generic workspace/document-vault/billing SaaS UI.

## Theme and Tokens
The client will provide visual style/logo/preferences in Markdown. Until received, use existing Tailwind/shadcn/ui theme tokens; do not invent a permanent brand palette or a second token system. Light/dark mode, exact colors, typography, radius scale, spacing, and breakpoints remain TBD.

## Components and Icons
- shadcn/ui is the primary component library; Tailwind CSS is the styling system.
- Reuse existing components and theme tokens.
- Do not modify generated shadcn/ui internals without a clear task requirement.
- Use the icon package already installed (Lucide if present); inspect package configuration before adding another.

## Layout and Responsive Behavior
- Provide role-appropriate navigation for customer, shop, and admin.
- Customer screens prioritize mobile use in-store, especially order status and QR display.
- Shop dashboard prioritizes order queue, preparation, pickup verification, and payment.
- Admin screens prioritize clear approval/review workflows.
- Support mobile, tablet, desktop. Exact dimensions and breakpoints await the client design context.

## Animation Requirements: Framer Motion + GSAP
The project owner explicitly requested basic UI animations using **Framer Motion and GSAP**. Motion should improve feedback and continuity, not decorate every element.

### Framer Motion (default for React UI)
Use for component enter/exit, simple page transitions where App Router supports them, modal/drawer transitions when not already supplied by Radix/shadcn, small list/layout changes, and subtle hover/tap/status feedback.

### GSAP (selective timeline use)
Use for a small number of orchestrated sequences: landing/intro hero, onboarding illustration, multi-element SVG/DOM timeline, or a genuinely useful scroll-triggered sequence. Do not use GSAP for routine button hover, modal, or list transitions when Framer Motion is sufficient.

### Motion safety and implementation
- Never animate the same element/property with Framer Motion and GSAP simultaneously; assign one owner per element/property.
- Prefer Framer Motion for React state/lifecycle-driven motion; GSAP for isolated, timeline-based sequences.
- Keep animation code in small client components; do not convert entire pages to client components for one animated child.
- Use refs and lifecycle cleanup for GSAP; kill timelines, ScrollTriggers, and listeners on unmount.
- Avoid direct DOM mutations that conflict with React rendering.
- Avoid scroll hijacking, excessive parallax, large-list stagger overload, layout shifts, and motion that blocks task completion.
- Respect `prefers-reduced-motion`; provide reduced/no-motion behavior.
- Do not make QR scanning, payment, or critical controls harder to use.
- Check if packages are already installed before adding them; use the repository's package manager and update lockfiles normally.
- Verify keyboard use, reduced-motion behavior, and mobile performance.

Suggested starting durations (guidance, not fixed design tokens): micro-interactions 120–200 ms; small enter/exit 160–240 ms; panels/overlays 180–300 ms. Prefer opacity/transform; avoid excessive bounce/overshoot.

## Accessibility and UI States
Use semantic HTML, accessible labels, keyboard support, visible focus, sufficient contrast. Do not communicate status by animation alone. Data-driven screens need loading, empty, error/recovery, success, and pending/disabled states.

## Open UI Decisions
Client logo, palette, visual references; light/dark mode; fonts/radius; final navigation/layout per role; exact breakpoints; which selected screens warrant GSAP timelines.

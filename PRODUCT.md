# Product

## Register

product

## Users

**Students (primary):** Veterinary undergraduates who access VetSim during their semester to fill in castration round data (male/female/shelter counts), track their simulation outcomes, and monitor their gamified progress (XP, VIDA balance, levels, streaks). They use the app during class or homework sessions, typically on a laptop.

**Teachers and Admins (primary):** University instructors who create and close rounds for each semester cohort, import student lists via CSV, monitor round progress, and review population simulation graphs to evaluate student decisions. They need efficient bulk-management tools and clear data overviews.

## Product Purpose

VetSim simulates veterinary population management. Students input real-world-style data per round; the system runs a Python population-growth model and produces individual graphs showing how their decisions affect animal population over time. The gamification layer (XP, VIDA currency, levels, streaks) drives engagement and rewards consistent participation. Success means students complete rounds, understand simulation outcomes, and develop intuition for population control strategy.

## Brand Personality

Engaging, modern, educational — gamified progression with academic weight. Feels like a serious university tool that's also genuinely motivating to use. Not cartoonish or childish; not a dry enterprise CRUD panel.

Reference spirit: Duolingo's engagement mechanics (XP, streaks, progress bars, currency) applied to a dark, precise, data-forward UI. The fun is in learning and seeing your decisions play out in a simulation, not in visual gimmicks.

## Anti-references

- Generic Bootstrap admin templates out of the box (flat, no personality, everything the same visual weight)
- Cartoonish gamification (pastel-heavy, mascot-driven, emoji-stuffed interfaces)
- Classic ERP / hospital management software (sterile, gray, overwhelming forms)
- SaaS landing page aesthetics bleeding into the app (cream backgrounds, soft gradients, lifestyle copy)

## Design Principles

1. **Stakes feel real.** The simulation outcomes (population graphs, VIDA balance, castration counts) should feel consequential. Gamification reinforces learning, not escapism. The data is the hero; visual decoration supports it.
2. **Earn the dark.** The dark theme is not a style reflex — it's a deliberate data-forward environment where charts, numbers, and status indicators pop. Color carries meaning: teal = healthy action, accent = positive outcome.
3. **Both roles feel respected.** Students and teachers have fundamentally different workflows. Student screens prioritize personal progress and task completion. Teacher/admin screens prioritize triage, bulk action, and class-wide visibility. Neither role should feel like they're navigating the other's tool.
4. **Gamification with academic gravity.** XP, VIDA, levels, and streaks motivate without trivializing veterinary subject matter. Progression mechanics should feel earned, not random. Progress should be legible at a glance.
5. **Clarity over cleverness.** Round creation, data entry, and graph review are time-sensitive workflows. Forms, tables, and primary actions must be immediately scannable. No interaction should require explanation.

## Accessibility & Inclusion

WCAG AA minimum across all surfaces. Reduced motion support required (`@media (prefers-reduced-motion: reduce)` alternatives for every animation). Language: Brazilian Portuguese throughout. Color should never be the sole information carrier — icons, labels, and text reinforce all status states.

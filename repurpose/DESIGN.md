# DESIGN.md — Repurpose Visual & Motion System

Premium = restraint + consistency + physics. Not more animation.

## Typography
- Display: Instrument Serif (headings, hero, "Sounds like…" summaries)
- Body/UI: Geist Sans
- Mono: Geist Mono (char counts, usage numbers, code)
- Headings: tracking -0.02em, line-height 1.1
- Body: line-height 1.6, max 65ch for reading text
- Scale: 12 / 13 / 14 / 16 / 18 / 22 / 28 / 36 / 48 / 64

## Color (dark-first)
- bg-0: #0A0A0B (page)     bg-1: #111113 (cards)     bg-2: #18181B (nested)     bg-3: #202024 (hover)
- border: rgba(255,255,255,0.08)   border-strong: rgba(255,255,255,0.14)
- fg-0: #FAFAFA   fg-1: #A1A1AA (secondary)   fg-2: #71717A (muted)   — never pure gray, always zinc-tinted
- accent: #C8FF3D (electric lime)   accent-fg: #0A0A0B
- success: #4ADE80   warning: #FBBF24   danger: #F87171
- Inner top highlight on raised surfaces: inset 0 1px 0 rgba(255,255,255,0.06)

## Radii
6 (inputs, chips) / 10 (buttons, small cards) / 16 (cards) / 24 (panels, modals)
Nested elements use the next-smaller radius than their parent.

## Spacing
4px grid. Card padding 20–24. Section gaps 48–96 on marketing, 24–32 in app.

## Motion principles
1. Springs only. ui: stiffness 300 / damping 30. soft: 200 / 26. page: 260 / 32.
2. Enter = opacity 0→1 + translateY 8→0. Stagger 40ms per item. Exit is faster than enter.
3. Hover: lift ≤ 2px, scale ≤ 1.02, border brightens to border-strong.
4. Animate transform and opacity ONLY. Never width/height/top/left.
5. Every animation respects prefers-reduced-motion (primitives handle this).
6. Animation communicates state (loading, arrival, success). Never decorative idle motion in-app.
7. layoutId morphs are reserved for signature moments: generate button → progress pill,
   textarea → video card, pricing toggle pill.

## Component states (every data view must have all four)
loading (skeleton matching shape) / empty (illustration + CTA) / error (human message + retry) / populated

## Focus
Custom 2px accent ring, offset 2px. Never removed.
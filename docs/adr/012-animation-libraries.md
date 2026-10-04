# ADR-012: Animation libraries and the JS budget

- Status: Accepted
- Date: 2026-10-04

## Context

The build brief lists gsap and framer motion. The technical document does not mention either, and it sets a budget of about 150 KB compressed initial JS on core pages for slow connections on mid-range Android phones. Shipping both libraries on core pages would use a large share of that budget for decoration.

## Decision

- Motion (the `motion` package, formerly framer motion) is the animation library for the app. It is used only inside client components, through `LazyMotion` with the `domAnimation` feature set and the `m` component, so the cost stays small.
- Animations respect `prefers-reduced-motion`.
- gsap is not installed now. If a marketing page needs an effect that Motion cannot do well, gsap may be added for that page only, loaded with a dynamic import so it never reaches core app pages. That change is noted in the PR that adds it.
- CSS transitions are preferred for simple hover, press and fade states.

## Alternatives considered

- Both libraries everywhere: blows the budget.
- No animation library: fine for the MVP, but the brief asks for one and Motion is cheap when lazy-loaded.

## Consequences

- The performance budget check in CI guards against regressions.

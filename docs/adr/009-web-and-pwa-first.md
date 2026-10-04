# ADR-009: Web app plus PWA before native apps

- Status: Accepted
- Date: 2026-10-04

## Context

Users are on mid-range Android phones with patchy data. App store installs are a barrier, and native apps double the surface to build.

## Decision

Ship a mobile-first web app with an installable PWA manifest and, later, a service worker for the app shell and web push. Native apps wait until PWA limits are proven.

## Alternatives considered

- React Native or Expo from day one: two codebases to keep in sync before liquidity is proven.

## Consequences

- Page weight and JavaScript size are product requirements.
- Push on iOS is limited; SMS covers critical provider events.

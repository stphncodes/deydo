# ADR-005: Location as a seeded hierarchy, PostGIS deferred

- Status: Accepted
- Date: 2026-10-04

## Context

People in the wedge city describe where they are by area, estate or market name, not coordinates. Precise coordinates also create privacy risk.

## Decision

`locations` is a seeded hierarchy: country, state, city, area. All 36 states plus FCT are seeded nationally. Cities and areas are seeded only for the wedge city. Providers list the areas they serve. PostGIS, GPS and radius search are deferred.

## Alternatives considered

- PostGIS with radius search from day one: more complex, more private data, not needed for one city.

## Consequences

- Matching is a simple join on area or parent city.
- The move to PostGIS later is additive (a geography column plus a GiST index).

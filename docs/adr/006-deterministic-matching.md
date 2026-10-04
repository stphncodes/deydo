# ADR-006: Deterministic SQL matching in the MVP

- Status: Accepted
- Date: 2026-10-04

## Context

There is no outcome data yet, so any learned ranking would be guesswork. Ops must be able to explain why a provider did or did not see a request.

## Decision

`match_providers` is a SQL function with hard filters (approved, active, offers the category, available, mode compatible, serves the area or its city, not already matched, not blocked) and a weighted score. Weights live in a config table so they can be tuned without a deploy. Free text maps to categories through synonyms with trigram similarity. No LLM parsing and no ML ranking in the MVP.

## Alternatives considered

- LLM request parsing: cost and unpredictability before we have labelled data to evaluate it.
- Learning-to-rank: no training data.

## Consequences

- Matching is debuggable and testable with pgTAP.
- Every match, response and outcome is recorded so later models have ground truth.

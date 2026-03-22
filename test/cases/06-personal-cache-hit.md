## Input

had my salmon traybake for dinner

## Expected behaviour

- Recognises food tracking intent
- Matches "salmon traybake" from personal-foods.yaml (not individual "salmon" from popular-foods.yaml)
- Logs as a single composite dish, NOT split into individual ingredients
- Calories ~1014 (single serving)
- Protein ~62g, fat ~55g, carbs ~52g
- Source: cache_lookup, confidence: 0.95
- Responds with today's running total

## Purpose

Tests two-file cache priority: personal-foods.yaml MUST be checked before popular-foods.yaml. "Salmon traybake" exists in personal-foods.yaml as a composite dish. If the skill matches "salmon" from popular-foods.yaml instead, the priority is wrong.

## Ablation note

Without skill: bare model will estimate salmon + potatoes + etc. separately, likely different totals.
With skill: should match the personal cache entry and return consistent values.

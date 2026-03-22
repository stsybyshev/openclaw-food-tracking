## Input

what's my daily average this week?

## Expected behaviour

- Recognises this as a summary request, NOT a new food log entry
- Reads from the pre-loaded log which contains 3 tracked dates:
  - 2026-03-13: FASTING (0 kcal)
  - 2026-03-14: salmon traybake (1014 kcal)
  - 2026-03-15: scrambled eggs + black coffee (218 kcal)
- Counts all 3 dates in the denominator (including the fasting day)
- Daily average ≈ 411 kcal/day ((0 + 1014 + 218) ÷ 3)
- Does NOT skip the fasting day as "untracked"
- Does NOT append any new entry

## Purpose

Tests that fasting days are included in average calculations. Without the FASTING marker, the denominator would be 2 (only days with food entries), giving a misleading ~616 kcal/day average. With the marker, all 3 tracked days are counted.

## Ablation note

Without skill: bare model cannot read the log file — will respond generically.
With skill: should produce an average that includes the fasting day in the denominator.

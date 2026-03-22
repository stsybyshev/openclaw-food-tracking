## Input

fasting today

## Expected behaviour

- Recognises fasting intent
- Logs a single FASTING marker row with all macros and kcal = 0
- food = "FASTING", unit = "day", qty = 1
- Does NOT log water, tea, or coffee separately
- Does NOT ask "what did you eat?" or try to estimate food
- Confirms the fasting day was logged
- Source: cache_lookup, confidence: 1.0

## Purpose

Tests fasting day marker support. The FASTING entry ensures the day is counted in average calculations as a 0-calorie day rather than being skipped as untracked.

## Ablation note

Without skill: bare model will likely ask clarifying questions or refuse to log.
With skill: should produce a single FASTING marker row with zeros.

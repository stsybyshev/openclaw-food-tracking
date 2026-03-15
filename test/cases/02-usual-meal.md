## Input

had my usual breakfast

## Expected behaviour

- Recognises food tracking intent
- Attempts cache lookup for "usual breakfast"
- If cache miss: asks "What's your usual breakfast?" rather than guessing
- Does NOT silently log incorrect data when input is ambiguous
- If cache hit (in a seeded test): logs the matched entry and confirms it

## Ablation note

Without skill: bare model may guess what "usual breakfast" means (e.g. toast, cereal) — this is the failure mode the skill should prevent.
With skill: should look up cache first, ask if not found.

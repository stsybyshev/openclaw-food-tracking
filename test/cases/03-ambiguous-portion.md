## Input

had a big bowl of pasta for lunch

## Expected behaviour

- Recognises food tracking intent
- "big bowl" is ambiguous — should estimate a reasonable portion (e.g. 250–400g cooked)
- Calories in range 350–700 (wide range to accommodate portion uncertainty)
- Source field should be: estimate (not cache)
- Confidence field should be: low or medium (not high)
- Response should acknowledge the uncertainty, e.g. note the assumed portion size

## Ablation note

Without skill: bare model may produce calories but will likely not set source/confidence fields or follow the log format.
With skill: should produce a structured entry with explicit uncertainty markers.

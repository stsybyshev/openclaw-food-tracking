## Input

what have I eaten today?

## Expected behaviour

- Recognises this as a summary request, not a new food log entry
- Reads from the current monthly log (or acknowledges no entries if log is empty)
- Returns aggregated totals: total kcal, protein, fat, carbs for today
- Does NOT append a new log entry

## Ablation note

Without skill: bare model cannot read the log file (has no file access in test context) — will respond with "I don't have access to...".
With skill: should acknowledge the log read mechanism and either produce a summary or explain how to retrieve it.

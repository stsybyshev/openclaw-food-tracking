## Input

just had 3 scrambled eggs and a black coffee

## Expected behaviour

- Recognises this as a food tracking request (not general conversation)
- Logs an entry for eggs: calories in range 180–320, protein >= 15g
- Logs an entry for black coffee: calories <= 10
- All required fields present: food name, qty, calories, protein, fat, carbs
- Responds with today's running total
- Does NOT ask clarifying questions for this unambiguous input

## Ablation note

Without skill: bare model may produce a response but likely free-form text, not a structured log entry.
With skill: should produce a structured entry matching the log format.

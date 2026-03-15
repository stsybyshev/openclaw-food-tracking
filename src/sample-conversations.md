# Sample Conversations — Source Draft

<!-- Annotated examples of expected skill behaviour.
     These inform the SKILL.md instruction writing and double as test case seeds.
     Design commentary is welcome here. -->

---

## Case 01 — Simple meal, text only

**User:** just had 3 scrambled eggs and a black coffee

**Expected agent behaviour:**
- Recognises this as a food tracking request (not general food chat)
- Looks up "egg" in popular-foods cache → cache hit
- Black coffee: ~0 calories, logs it anyway
- Appends entry to current month's log file
- Responds with the logged entry + today's running total

**Expected log entry (approximate):**
| 08:30 | scrambled eggs | 3 | egg | 210 | 18g | 15g | 1g | cache | high |
| 08:30 | black coffee   | 1 | cup |   2 |  0g |  0g | 0g | cache | high |

---

## Case 02 — Recurring meal ("my usual")

**User:** had my usual breakfast

**Expected agent behaviour:**
- Recognises "my usual" as a cache lookup trigger
- Looks up user's most common breakfast in popular-foods cache
- If found: logs it and confirms ("Logged your usual: 3 eggs + coffee, 212 kcal")
- If not found: asks for clarification ("What's your usual breakfast?")

---

## Case 03 — Ambiguous food / portion

**User:** had a big bowl of pasta for lunch

**Expected agent behaviour:**
- Recognises food tracking intent
- "big bowl" is ambiguous — should estimate a reasonable portion (e.g. 300g cooked)
- Estimates calories/macros for generic pasta with low confidence
- Logs with confidence: low, source: estimate
- Responds noting the uncertainty ("Logged ~480 kcal for pasta — let me know the portion if you want to adjust")

---

## Case 04 — Photo mention (MVP: text fallback)

**User:** [attaches photo of a burger and fries] lunch!

**Expected agent behaviour (MVP):**
- If vision available: attempt to identify items from photo
- If vision not available or uncertain: ask user to describe the meal in text
- Log with confidence: low if estimated from photo, note source: photo

---

## Case 05 — Daily summary request

**User:** what have I eaten today?

**Expected agent behaviour:**
- Reads today's entries from the current monthly log
- Returns a summary: list of meals + running totals (kcal, protein, fat, carbs)
- NOT a food tracking request — should not append a new log entry

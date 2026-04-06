# Monthly Food Log Template — Source Draft

<!-- Design notes:
     - Flat table, no day headings — optimised for agent parsing, not human readability
     - One row per food item, datetime prefix used for daily aggregation
     - Both per-unit and per-entry-total columns: per-unit for audit/recalc, total for quick sums
     - Confidence is numeric 0–1 (cache_lookup ~0.95, text_estimate ~0.6, photo_estimate ~0.3)
     - Source enum: cache_lookup | text_estimate | photo_label | photo_estimate
     - File naming: YYYY-MM.md (one file per month)
     - The agent creates a new file on the first entry of each month
     - The agent appends rows to an existing table (never rewrites the file)
-->

<!-- CLEAN VERSION (no commentary) goes to dist/openclaw-food-tracker/assets/monthly-template.md -->

# Food Log — March 2026

| Datetime         | Food                   | Qty | Unit    | Protein/u | Fat/u | Carbs/u | Kcal/u | Protein | Fat   | Carbs | Kcal  | Source       | Confidence |
|:-----------------|:-----------------------|----:|:--------|----------:|------:|--------:|-------:|--------:|------:|------:|------:|:-------------|:-----------|
| 15-03-2026 08:30 | Scrambled eggs         |   3 | egg     |       6.0 |   5.0 |     0.5 |     70 |    18.0 |  15.0 |   1.5 |   210 | cache_lookup | 0.95       |
| 15-03-2026 08:30 | Black coffee           |   1 | cup     |       0.0 |   0.0 |     0.0 |      2 |     0.0 |   0.0 |   0.0 |     2 | cache_lookup | 0.99       |
| 15-03-2026 13:00 | Pasta with tomato sauce|   1 | serving |      12.0 |   5.0 |    70.0 |    380 |    12.0 |   5.0 |  70.0 |   380 | text_estimate| 0.55       |

<!-- Field reference:
     Datetime        — DD-MM-YYYY HH:MM (24h, from message timestamp or user statement)
     Food            — name and brief description, capitalised first letter
     Qty             — numeric quantity
     Unit            — serving unit (egg, cup, 100g, g, kg, tsp, tbsp, serving, slice, etc.)
     protein_unit    — grams of protein per unit
     fat_unit        — grams of fat per unit
     carbs_unit      — grams of carbs per unit
     kcal_unit       — kilocalories per unit
     protein_total   — qty × protein_unit
     fat_total       — qty × fat_unit
     carbs_total     — qty × carbs_unit
     kcal_total      — qty × kcal_unit
     source          — cache_lookup | text_estimate | photo_label | photo_estimate
     confidence      — float 0–1 (higher = more certain)
-->

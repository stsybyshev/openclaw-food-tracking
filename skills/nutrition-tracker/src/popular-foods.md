# Popular Foods Cache — Source Draft

<!-- PURPOSE:
     Read-only seed data for consistent calorie/macro lookups on common foods.
     Checked SECOND after personal-foods.yaml during skill execution.
     The skill MUST NOT write to this file — learned entries go to
     personal-foods.yaml instead.

     WHY KEEP SEED DATA?
     Even small models "know" common food values, but they vary across
     invocations (eggs might be 70, 72, 75, 78 kcal). A cache ensures
     consistency for trend tracking.

     SCHEMA:
     - name:             canonical name for matching and display
     - aliases:          list of alternate phrasings to recognise
     - qty_default:      assumed quantity when user doesn't specify
     - unit:             default serving unit (egg, cup, 100g, serving, etc.)
     - kcal_per_unit:    kilocalories per unit
     - protein_per_unit: grams of protein per unit
     - fat_per_unit:     grams of fat per unit
     - carbs_per_unit:   grams of carbs per unit
     - notes:            optional (cooking method, size assumption, etc.)
     - source:           always "seed" in this file

     DIET: Pescatarian — no meat or poultry entries.
     VALUES: approximate, based on USDA FoodData Central.

     COMPANION FILE: personal-foods.yaml (user-writable, checked first)
-->

Canonical data lives in `dist/openclaw-food-tracker/references/popular-foods.yaml` (~50 entries).
Edit that file directly; this source draft documents schema and design rationale only.

Companion file: `dist/openclaw-food-tracker/references/personal-foods.yaml` (user-writable, checked first at runtime).

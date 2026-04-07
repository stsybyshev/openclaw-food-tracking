# Quantified Life — Dashboard Data Contract

## Overview

Each skill's `generate.py` reads Markdown log files + `config.yaml` and
produces a single `dashboard/data.json`. The portal loads this file and
feeds each section to the corresponding widget renderer.

```
skills/nutrition-tracker/
├── SKILL.md
├── data/
│   ├── my-dishes.yaml
│   └── nutrition/
│       ├── 2026-01.md
│       ├── 2026-02.md
│       ├── 2026-03.md
│       └── 2026-04.md
├── dashboard/
│   ├── manifest.yaml          ← widget declarations
│   ├── config.yaml            ← user targets and thresholds
│   ├── data.json              ← precomputed data (output of generate.py)
│   └── generate.py            ← reads data/*.md + config.yaml → writes data.json
└── scripts/
    └── ...
```

---

## config.yaml

User-editable targets. generate.py reads this and embeds it in data.json
so the portal can use targets for progress bars, color thresholds, etc.

```yaml
body_weight_kg: 90
calories_target: 2500
protein_target_g: 144
fat_target_g: 78
carbs_target_g: 295
protein_per_kg_target: 1.6
macro_split_target:
  protein: 25
  fat: 28
  carbs: 47
heatmap:
  fasting_max: 0
  low_max: 2000
  normal_max: 2500
  elevated_max: 3000
timeline_start_hour: 6
timeline_end_hour: 22
```

---

## data.json — Envelope

```json
{
  "skill_id": "nutrition",
  "generated_at": "2026-04-06T09:30:00Z",
  "data_range": {
    "first_log": "2026-01-02",
    "last_log": "2026-04-06",
    "total_days_logged": 96
  },
  "config": { ... },
  "widgets": {
    "summary_cards": { ... },
    "yearly_heatmap": { ... },
    "todays_macros": { ... },
    "todays_meals": { ... },
    "meal_timing": { ... },
    "macro_comp": { ... },
    "monthly_insights": { ... }
  }
}
```

The `config` field is a copy of config.yaml as JSON, so the portal
can access targets without a separate file fetch.

---

## Widget data shapes

### 1. summary_cards

Monthly averages for the current month, with percentage delta from
the previous month. Displayed as four cards across the top.

```json
{
  "period": "2026-04",
  "prev_period": "2026-03",
  "cards": [
    {
      "label": "Avg Daily Calories",
      "value": 2340,
      "display": "2,340",
      "unit": "kcal",
      "delta_pct": 3.2,
      "delta_display": "+3.2%",
      "trend_up": true
    },
    {
      "label": "Avg Protein",
      "value": 98,
      "display": "98",
      "unit": "g/day",
      "delta_pct": -5.1,
      "delta_display": "−5.1%",
      "trend_up": false
    },
    {
      "label": "Avg Fat",
      "value": 95,
      "display": "95",
      "unit": "g/day",
      "delta_pct": 2.8,
      "delta_display": "+2.8%",
      "trend_up": true
    },
    {
      "label": "Avg Carbs",
      "value": 285,
      "display": "285",
      "unit": "g/day",
      "delta_pct": 1.4,
      "delta_display": "+1.4%",
      "trend_up": true
    }
  ]
}
```

Notes:
- `trend_up: true` → orange (eating more), `false` → green (eating less)
- For protein, trend_up=false means protein dropped — color is green
  because the convention is "green = change toward deficit/less" but
  generate.py could flip this for protein if desired
- `value` is raw number for any computation; `display` is formatted string


### 2. yearly_heatmap

All 365 days of the year. Each day has a calorie value (or null if not
logged). Grouped by month for rendering as rows.

```json
{
  "year": 2026,
  "months": [
    {
      "name": "Jan",
      "days_in_month": 31,
      "has_data": true,
      "avg_kcal": 2356,
      "fasting_days": 1,
      "over_3000_days": 3,
      "days": [
        { "day": 1, "kcal": 2150 },
        { "day": 2, "kcal": 0 },
        { "day": 3, "kcal": null },
        ...
        { "day": 31, "kcal": 1980 }
      ]
    },
    {
      "name": "Feb",
      "days_in_month": 28,
      "has_data": true,
      ...
      "days": [
        { "day": 1, "kcal": 2200 },
        ...
        { "day": 28, "kcal": 2050 },
        { "day": 29, "kcal": null },
        { "day": 30, "kcal": null },
        { "day": 31, "kcal": null }
      ]
    },
    ...
    {
      "name": "Dec",
      "days_in_month": 31,
      "has_data": false,
      "avg_kcal": 0,
      "fasting_days": 0,
      "over_3000_days": 0,
      "days": [
        { "day": 1, "kcal": null },
        ...
        { "day": 31, "kcal": null }
      ]
    }
  ]
}
```

Notes:
- Always 12 months × 31 days = 372 entries (pad short months with null)
- `kcal: 0` = fasting day (intentional, renders as purple)
- `kcal: null` = no data / future date (renders as gray placeholder)
- Portal uses `config.heatmap` thresholds for color mapping
- Tooltip on hover shows: "Mar 3: 2,786 kcal" or "Mar 5: Fasting"
- `avg_kcal`, `fasting_days`, `over_3000_days` render at the right of each row
- `has_data` controls whether the month label is bright or dimmed
- Total payload: ~372 objects × ~30 bytes ≈ 11KB. Negligible.


### 3. todays_macros

Today's macro totals with progress against targets from config.

```json
{
  "date": "2026-04-06",
  "macros": [
    {
      "label": "Calories",
      "value": 1847,
      "display": "1,847",
      "target": 2500,
      "unit": ""
    },
    {
      "label": "Protein",
      "value": 94,
      "display": "94g",
      "target": 144,
      "unit": "g"
    },
    {
      "label": "Fat",
      "value": 62,
      "display": "62g",
      "target": 78,
      "unit": "g"
    },
    {
      "label": "Carbs",
      "value": 198,
      "display": "198g",
      "target": 295,
      "unit": "g"
    }
  ],
  "protein_per_kg": {
    "value": 1.04,
    "target": 1.6,
    "body_weight_kg": 90
  }
}
```

Notes:
- Portal computes progress bar percentage: `value / target * 100`
- `protein_per_kg.value` = `protein.value / body_weight_kg`
- Colored amber if below target, green if at or above
- Targets come from config.yaml but are denormalized here for
  convenience — generate.py copies them in


### 4. todays_meals

Today's meal log as a table. Full width card.

```json
{
  "date": "2026-04-06",
  "meals": [
    {
      "time": "08:30",
      "dish": "Porridge, honey, banana",
      "kcal": 350,
      "protein": 8,
      "fat": 6,
      "carbs": 60
    },
    {
      "time": "10:15",
      "dish": "Protein shake (whey + milk)",
      "kcal": 180,
      "protein": 32,
      "fat": 3,
      "carbs": 8
    },
    ...
  ],
  "totals": {
    "kcal": 1847,
    "protein": 108,
    "fat": 62,
    "carbs": 198
  }
}
```

Notes:
- Table auto-extends with as many rows as needed
- `totals` is the sum of all meal rows — generate.py computes this
- Full width card because dish names can be long


### 5. meal_timing

Monthly average calorie and protein distribution across three time
slots. Displayed as horizontal stacked bars.

```json
{
  "period": "2026-04",
  "slots": [
    {
      "label": "Morning",
      "time_range": "6–11am",
      "avg_kcal": 530,
      "avg_protein_g": 40
    },
    {
      "label": "Midday",
      "time_range": "11am–3pm",
      "avg_kcal": 820,
      "avg_protein_g": 58
    },
    {
      "label": "Evening",
      "time_range": "3–10pm",
      "avg_kcal": 790,
      "avg_protein_g": 22
    }
  ],
  "insight": "Evening protein low (22g avg) — 74% consumed before 3pm"
}
```

Notes:
- These are monthly averages, not today's values
- Bar width proportional to kcal (relative to the highest slot)
- Blue portion of bar = protein kcal (`avg_protein_g × 4 / avg_kcal`)
- Time slot boundaries use `config.timeline_start_hour` and
  `config.timeline_end_hour` to define the range
- Slots should cover the full timeline range without gaps
- `insight` is a short observation generated by the LLM or by
  simple rules (e.g. "if evening protein < 30% of total, flag it")


### 6. macro_comp

Macro percentage split comparison: previous month (left donut) →
current month (right donut). Reading order: past → present.

```json
{
  "prev_month": {
    "label": "March",
    "period": "2026-03",
    "protein_pct": 19,
    "fat_pct": 34,
    "carbs_pct": 47,
    "avg_kcal": 2180,
    "avg_kcal_display": "2,180"
  },
  "this_month": {
    "label": "April",
    "period": "2026-04",
    "protein_pct": 23,
    "fat_pct": 30,
    "carbs_pct": 47,
    "avg_kcal": 2040,
    "avg_kcal_display": "2,040"
  },
  "insight": "Protein up 4% from March — fat down 4%. Carbs stable."
}
```

Notes:
- Percentages are of total calories: `(nutrient_g × kcal_per_g) / total_kcal × 100`
  where kcal_per_g is 4 for protein, 9 for fat, 4 for carbs
- Portal renders as two donut charts: prev_month on left, this_month on right
  with an arrow (→) between them
- `insight` is a one-line summary of the shift


### 7. monthly_insights

Free-form insights generated by Veda (LLM) scanning all log files.
Cached — not generated on every refresh.

```json
{
  "generated_at": "2026-04-05T21:00:00Z",
  "log_count": 95,
  "period_display": "Jan–Apr 2026",
  "insights": [
    {
      "icon": "⚠",
      "text": "Protein averages 1.04 g/kg — below the 1.6–2.2 g/kg range recommended for resistance training."
    },
    {
      "icon": "📉",
      "text": "Weekend protein drops 35% — Saturday/Sunday average is 68g vs 112g on weekdays."
    },
    {
      "icon": "🔁",
      "text": "Dietary variety is low — top 6 foods account for 82% of your calories."
    },
    {
      "icon": "🕐",
      "text": "Protein distribution is front-loaded — 74% consumed before 3pm."
    }
  ]
}
```

Notes:
- Generated by calling the LLM with all monthly log files in context
- Runs on a schedule (weekly or monthly), not on every generate.py run
- generate.py caches the result in `dashboard/insights_cache.json`
  and copies it into data.json
- To regenerate: delete the cache file and run generate.py with
  `--refresh-insights` flag (triggers LLM call)
- Keep to 3–5 insights maximum


---

## How generate.py works

```python
#!/usr/bin/env python3
"""
Reads nutrition/*.md + config.yaml → writes dashboard/data.json

Run:     python dashboard/generate.py
Cron:    */30 * * * * cd ~/skills/nutrition-tracker && python dashboard/generate.py
Refresh: python dashboard/generate.py --refresh-insights
"""

import json, yaml
from pathlib import Path
from datetime import date, datetime

SKILL_DIR = Path(__file__).parent.parent
DATA_DIR = SKILL_DIR / "data" / "nutrition"
CONFIG_FILE = Path(__file__).parent / "config.yaml"
OUTPUT = Path(__file__).parent / "data.json"
INSIGHTS_CACHE = Path(__file__).parent / "insights_cache.json"

def load_config():
    return yaml.safe_load(CONFIG_FILE.read_text())

def parse_month_file(path: Path) -> list[dict]:
    """Parse a YYYY-MM.md file into daily entries with meals."""
    # Each entry: {"date": "2026-04-06", "meals": [{time, dish, kcal, p, f, c}]}
    pass

def build_summary_cards(this_month_days, prev_month_days):
    """Compute monthly averages and deltas."""
    pass

def build_heatmap(all_days, config):
    """Build 12×31 grid with kcal values and monthly stats."""
    pass

def build_todays_macros(today_meals, config):
    """Sum today's macros, compute protein/kg."""
    pass

def build_todays_meals(today_meals):
    """Format today's meal list with totals."""
    pass

def build_meal_timing(this_month_days):
    """Average kcal and protein by time-of-day slot."""
    pass

def build_macro_comp(this_month_days, prev_month_days):
    """Compute P/F/C percentage split per month."""
    pass

def load_or_generate_insights(all_days, config, force=False):
    """Load cached insights or generate via LLM."""
    if INSIGHTS_CACHE.exists() and not force:
        return json.loads(INSIGHTS_CACHE.read_text())
    # Call LLM with all monthly logs in context
    # Save result to INSIGHTS_CACHE
    pass

def main():
    config = load_config()

    # Read all monthly log files
    all_days = []
    for md_file in sorted(DATA_DIR.glob("*.md")):
        all_days.extend(parse_month_file(md_file))

    # Partition by month
    today = date.today()
    this_month = [d for d in all_days if d["date"].startswith(today.strftime("%Y-%m"))]
    prev_month_str = (today.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")
    prev_month = [d for d in all_days if d["date"].startswith(prev_month_str)]
    today_entries = [d for d in all_days if d["date"] == today.isoformat()]

    data = {
        "skill_id": "nutrition",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "data_range": {
            "first_log": all_days[0]["date"] if all_days else None,
            "last_log": all_days[-1]["date"] if all_days else None,
            "total_days_logged": len(all_days),
        },
        "config": config,
        "widgets": {
            "summary_cards": build_summary_cards(this_month, prev_month),
            "yearly_heatmap": build_heatmap(all_days, config),
            "todays_macros": build_todays_macros(today_entries, config),
            "todays_meals": build_todays_meals(today_entries),
            "meal_timing": build_meal_timing(this_month),
            "macro_comp": build_macro_comp(this_month, prev_month),
            "monthly_insights": load_or_generate_insights(all_days, config),
        }
    }

    OUTPUT.write_text(json.dumps(data, indent=2))
    print(f"Generated {OUTPUT} ({len(all_days)} days)")

if __name__ == "__main__":
    main()
```

---

## How the portal consumes it

```javascript
// Load data
const data = await fetch('dashboard/data.json').then(r => r.json());
const cfg = data.config;

// Render each widget by passing its data section
renderSummaryCards(data.widgets.summary_cards);
renderHeatmap(data.widgets.yearly_heatmap, cfg.heatmap);
renderMacros(data.widgets.todays_macros);
renderLog(data.widgets.todays_meals);
renderMealTiming(data.widgets.meal_timing);
renderMacroComp(data.widgets.macro_comp);
renderInsights(data.widgets.monthly_insights);
```

---

## Contract rules

1. **generate.py owns all computation.** The portal never parses
   Markdown, never computes averages, never converts units.

2. **data.json is the single interface.** The portal reads one file.
   config.yaml is embedded inside it as `data.config`.

3. **Pre-format display strings.** Include both raw `value` (for
   progress bars, calculations) and `display` (for text rendering).

4. **Insights are cached.** generate.py calls the LLM only when
   the cache is missing or `--refresh-insights` is passed.

5. **Dates are ISO 8601.** `YYYY-MM-DD` for dates, `YYYY-MM-DDTHH:MM:SSZ`
   for timestamps.

6. **Null means no data.** `kcal: null` = not logged / future date.
   `kcal: 0` = intentional fasting day. The portal renders them
   differently (gray vs purple).

7. **Additive evolution.** New fields can be added to any widget's
   data without breaking existing renderers. Renderers destructure
   only what they need.

8. **Heatmap always has 12 months × 31 days.** Pad short months
   and future months with null entries. This keeps the grid uniform.

9. **Targets live in config, not hardcoded.** generate.py reads
   config.yaml. The portal reads `data.config`. Nobody hardcodes
   2500 or 144.

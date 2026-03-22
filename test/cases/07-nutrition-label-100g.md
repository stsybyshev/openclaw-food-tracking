## Input

Had 300g of granola, label says per 100g: 450 kcal, 8g protein, 18g fat, 65g carbs

## Expected behaviour

- Recognises as food tracking with label-provided values
- Uses unit = `100g` (not `g`)
- qty = 3 (300g ÷ 100)
- Per-unit values copied directly from label: kcal_unit=450, protein_unit=8, fat_unit=18, carbs_unit=65
- Totals: kcal_total=1350, protein_total=24, fat_total=54, carbs_total=195
- Does NOT divide label values by 100 to get per-gram values
- Source: photo_label or text_estimate

## Purpose

Tests the `100g` unit convention. Label values should be stored directly as per-unit values — the model multiplies by qty, never divides. This is critical for small model reliability.

## Ablation note

Without skill: bare model may produce correct totals but is unlikely to use the `100g` unit convention.
With skill: should produce a structured row with unit=100g and label values in per-unit columns.

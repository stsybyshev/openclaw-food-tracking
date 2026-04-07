# Food Log — Edge Cases

| Datetime         | Food                   | Qty | Unit    | Protein/u | Fat/u | Carbs/u | Kcal/u | Protein | Fat   | Carbs | Kcal  | Source       | Confidence |
|:-----------------|:-----------------------|----:|:--------|----------:|------:|--------:|-------:|--------:|------:|------:|------:|:-------------|:-----------|
| 10-01-2026 07:00 | Espresso               |   1 | serving |      0.1  |  0.0  |    0.1  |    3   |    0.1  |  0.0  |  0.1  |    3  | cache_lookup | 0.95       |
| 10-01-2026 23:30 | Late night snack       |   1 | serving |      5.0  |  8.0  |   30.0  |  210   |    5.0  |  8.0  | 30.0  |  210  | text_estimate| 0.60       |
| 11-01-2026 12:00 | Short row              |   1 | serving |
| 12-01-2026 08:00 | Membrillo with cheese  | 0.5 | 100g    |     <0.5  | <0.5  |   67.7  |  283   |   <0.5  | <0.5  | 33.9  |  142  | cache_lookup | 0.90       |

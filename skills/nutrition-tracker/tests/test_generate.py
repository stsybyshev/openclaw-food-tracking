"""Tests for dashboard/generate.py — all 7 widget builder functions."""

import pytest
from generate import (
    build_summary_cards,
    build_yearly_heatmap,
    build_todays_macros,
    build_todays_meals,
    build_meal_timing,
    build_macro_comp,
    build_monthly_insights,
)


# ── Fixture data (hand-computed from test fixtures) ──
# March fixture: 5 days (01, 02, 15, 20, 29-fasting)
#   Day 01: kcal=1070, protein=61, fat=37, carbs=120
#   Day 02: kcal=520,  protein=43, fat=15, carbs=52
#   Day 15: kcal=3200, protein=90, fat=117, carbs=276
#   Day 20: kcal=170,  protein=32, fat=2, carbs=5
#   Day 29: kcal=0 (fasting), protein=0, fat=0, carbs=0
#   Totals: kcal=4960, protein=226, fat=171, carbs=453
#   Avgs:   kcal=992,  protein=45.2, fat=34.2, carbs=90.6
#
# April fixture: 3 days (01, 02, 03)
#   Day 01: kcal=432, protein=22.8, fat=18.5, carbs=42.4 (includes <0.5 → 0.5)
#   Day 02: kcal=486, protein=36.9, fat=19, carbs=41.2
#   Day 03: kcal=590, protein=42, fat=13, carbs=75
#   Totals: kcal=1508, protein=101.7, fat=50.5, carbs=158.6
#   Avgs:   kcal≈502.7, protein≈33.9, fat≈16.8, carbs≈52.9


# ── build_summary_cards ──


class TestSummaryCards:
    def test_shape(self, march_days, april_days):
        result = build_summary_cards(april_days, march_days)
        assert "period" in result
        assert "prev_period" in result
        assert len(result["cards"]) == 4

    def test_card_labels(self, march_days, april_days):
        result = build_summary_cards(april_days, march_days)
        labels = [c["label"] for c in result["cards"]]
        assert labels == ["Avg Daily Calories", "Avg Protein", "Avg Fat", "Avg Carbs"]

    def test_delta_math(self, march_days, april_days):
        result = build_summary_cards(april_days, march_days)
        kcal_card = result["cards"][0]
        # April avg ≈ 502.7, March avg = 992
        # delta = (502.7 - 992) / 992 * 100 ≈ -49.3%
        assert kcal_card["delta_pct"] is not None
        assert kcal_card["delta_pct"] < 0  # April is lower than March
        assert kcal_card["trend_up"] is False

    def test_no_prev_month(self, april_days):
        result = build_summary_cards(april_days, {})
        for card in result["cards"]:
            assert card["delta_pct"] is None
            assert card["delta_display"] is None

    def test_display_format(self, march_days, april_days):
        result = build_summary_cards(april_days, march_days)
        for card in result["cards"]:
            assert isinstance(card["display"], str)
            assert isinstance(card["value"], int)

    def test_periods(self, march_days, april_days):
        result = build_summary_cards(april_days, march_days)
        assert result["period"] == "2026-04"
        assert result["prev_period"] == "2026-03"


# ── build_yearly_heatmap ──


class TestYearlyHeatmap:
    def test_12x31(self, march_days, sample_config):
        all_days = {**march_days}
        result = build_yearly_heatmap(all_days, sample_config, 2026)
        assert result["year"] == 2026
        assert len(result["months"]) == 12
        for m in result["months"]:
            assert len(m["days"]) == 31

    def test_fasting_zero(self, march_days, sample_config):
        result = build_yearly_heatmap(march_days, sample_config, 2026)
        march = result["months"][2]  # March = index 2
        day_29 = march["days"][28]  # 0-indexed
        assert day_29["day"] == 29
        assert day_29["kcal"] == 0  # fasting = 0, not null

    def test_future_null(self, march_days, sample_config):
        result = build_yearly_heatmap(march_days, sample_config, 2026)
        december = result["months"][11]
        assert december["has_data"] is False
        assert all(d["kcal"] is None for d in december["days"])

    def test_month_stats(self, march_days, sample_config):
        result = build_yearly_heatmap(march_days, sample_config, 2026)
        march = result["months"][2]
        assert march["has_data"] is True
        assert march["fasting_days"] == 1
        assert march["over_3000_days"] == 1  # Day 15 has 3200 kcal

    def test_pad_short_months(self, march_days, sample_config):
        """February should pad days 29-31 with null."""
        result = build_yearly_heatmap(march_days, sample_config, 2026)
        feb = result["months"][1]
        assert feb["days_in_month"] == 28
        assert feb["days"][28]["kcal"] is None  # day 29
        assert feb["days"][29]["kcal"] is None  # day 30
        assert feb["days"][30]["kcal"] is None  # day 31


# ── build_todays_macros ──


class TestTodaysMacros:
    def test_shape(self, sample_config):
        meals = [
            {"time": "08:00", "food": "Eggs", "protein": 18, "fat": 12, "carbs": 1, "kcal": 180},
            {"time": "12:00", "food": "Salad", "protein": 20, "fat": 8, "carbs": 15, "kcal": 210},
        ]
        result = build_todays_macros(meals, sample_config)
        assert "date" in result
        assert len(result["macros"]) == 4
        assert "protein_per_kg" in result

    def test_protein_per_kg(self, sample_config):
        meals = [
            {"time": "08:00", "food": "Shake", "protein": 45, "fat": 2, "carbs": 5, "kcal": 220},
        ]
        result = build_todays_macros(meals, sample_config)
        assert result["protein_per_kg"]["value"] == pytest.approx(45 / 90, abs=0.01)
        assert result["protein_per_kg"]["body_weight_kg"] == 90

    def test_empty_day(self, sample_config):
        result = build_todays_macros([], sample_config)
        assert result["macros"][0]["value"] == 0  # kcal
        assert result["macros"][1]["value"] == 0  # protein
        assert result["protein_per_kg"]["value"] == 0

    def test_targets_embedded(self, sample_config):
        result = build_todays_macros([], sample_config)
        assert result["macros"][0]["target"] == 2500  # calories
        assert result["macros"][1]["target"] == 144  # protein


# ── build_todays_meals ──


class TestTodaysMeals:
    def test_totals_sum(self):
        meals = [
            {"time": "08:00", "food": "Eggs", "protein": 18.5, "fat": 12, "carbs": 1, "kcal": 180},
            {"time": "12:00", "food": "Salad", "protein": 20, "fat": 8.3, "carbs": 15, "kcal": 210},
        ]
        result = build_todays_meals(meals)
        assert result["totals"]["kcal"] == 390
        assert result["totals"]["protein"] == 38  # round(18.5 + 20) = round(38.5) = 38
        assert len(result["meals"]) == 2

    def test_empty(self):
        result = build_todays_meals([])
        assert result["meals"] == []
        assert result["totals"] == {"kcal": 0, "protein": 0, "fat": 0, "carbs": 0}

    def test_meal_structure(self):
        meals = [
            {"time": "09:00", "food": "Porridge", "protein": 8, "fat": 3, "carbs": 45, "kcal": 240},
        ]
        result = build_todays_meals(meals)
        m = result["meals"][0]
        assert m["time"] == "09:00"
        assert m["dish"] == "Porridge"
        assert m["kcal"] == 240


# ── build_meal_timing ──


class TestMealTiming:
    def test_three_slots(self, april_days, sample_config):
        result = build_meal_timing(april_days, sample_config)
        assert len(result["slots"]) == 3
        labels = [s["label"] for s in result["slots"]]
        assert labels == ["Morning", "Midday", "Evening"]

    def test_slot_assignment(self, sample_config):
        """08:00 → Morning, 12:00 → Midday, 19:00 → Evening."""
        days = {
            "2026-04-01": {
                "date": "2026-04-01",
                "meals": [
                    {"time": "08:00", "food": "A", "protein": 10, "fat": 5, "carbs": 20, "kcal": 170},
                    {"time": "12:00", "food": "B", "protein": 20, "fat": 10, "carbs": 40, "kcal": 340},
                    {"time": "19:00", "food": "C", "protein": 30, "fat": 15, "carbs": 60, "kcal": 510},
                ],
                "totals": {"protein": 60, "fat": 30, "carbs": 120, "kcal": 1020},
                "is_fasting": False,
            }
        }
        result = build_meal_timing(days, sample_config)
        # 1 day, so avg = total
        assert result["slots"][0]["avg_kcal"] == 170  # Morning
        assert result["slots"][1]["avg_kcal"] == 340  # Midday
        assert result["slots"][2]["avg_kcal"] == 510  # Evening

    def test_insight_nonempty(self, april_days, sample_config):
        result = build_meal_timing(april_days, sample_config)
        assert isinstance(result["insight"], str)
        assert len(result["insight"]) > 0

    def test_period(self, april_days, sample_config):
        result = build_meal_timing(april_days, sample_config)
        assert result["period"] == "2026-04"


# ── build_macro_comp ──


class TestMacroComp:
    def test_percentages_sum(self, march_days, april_days):
        result = build_macro_comp(april_days, march_days)
        this = result["this_month"]
        total = this["protein_pct"] + this["fat_pct"] + this["carbs_pct"]
        assert total == pytest.approx(100, abs=2)  # rounding tolerance

    def test_calculation(self, march_days):
        """Hand-verify March macro split.
        Avgs: P=45.2g, F=34.2g, C=90.6g
        Macro kcal: 45.2*4 + 34.2*9 + 90.6*4 = 180.8 + 307.8 + 362.4 = 851
        P%=180.8/851*100≈21, F%=307.8/851*100≈36, C%=362.4/851*100≈43
        """
        result = build_macro_comp(march_days, {})
        this = result["this_month"]
        assert this["protein_pct"] == pytest.approx(21, abs=1)
        assert this["fat_pct"] == pytest.approx(36, abs=1)
        assert this["carbs_pct"] == pytest.approx(43, abs=1)

    def test_no_prev(self, april_days):
        result = build_macro_comp(april_days, {})
        prev = result["prev_month"]
        assert prev["protein_pct"] is None
        assert prev["fat_pct"] is None

    def test_labels(self, march_days, april_days):
        result = build_macro_comp(april_days, march_days)
        assert result["this_month"]["label"] == "April"
        assert result["prev_month"]["label"] == "March"

    def test_insight_string(self, march_days, april_days):
        result = build_macro_comp(april_days, march_days)
        assert isinstance(result["insight"], str)
        assert len(result["insight"]) > 0


# ── build_monthly_insights ──


class TestMonthlyInsights:
    def test_placeholder(self):
        result = build_monthly_insights()
        assert result["generated_at"] is None
        assert len(result["insights"]) == 1
        assert "Coming soon" in result["insights"][0]["text"]
        assert result["insights"][0]["icon"] == "\U0001f6a7"


# ── Full pipeline envelope ──


class TestFullPipelineEnvelope:
    def test_all_widget_keys(self, march_days, april_days, sample_config):
        """Simulate the full build and verify envelope structure."""
        widgets = {
            "summary_cards": build_summary_cards(april_days, march_days),
            "yearly_heatmap": build_yearly_heatmap({**march_days, **april_days}, sample_config, 2026),
            "todays_macros": build_todays_macros([], sample_config),
            "todays_meals": build_todays_meals([]),
            "meal_timing": build_meal_timing(april_days, sample_config),
            "macro_comp": build_macro_comp(april_days, march_days),
            "monthly_insights": build_monthly_insights(),
        }
        expected_keys = {
            "summary_cards", "yearly_heatmap", "todays_macros",
            "todays_meals", "meal_timing", "macro_comp", "monthly_insights",
        }
        assert set(widgets.keys()) == expected_keys

    def test_all_widgets_serializable(self, march_days, april_days, sample_config):
        """All widgets must be JSON-serializable."""
        import json
        widgets = {
            "summary_cards": build_summary_cards(april_days, march_days),
            "yearly_heatmap": build_yearly_heatmap({**march_days, **april_days}, sample_config, 2026),
            "todays_macros": build_todays_macros([], sample_config),
            "todays_meals": build_todays_meals([]),
            "meal_timing": build_meal_timing(april_days, sample_config),
            "macro_comp": build_macro_comp(april_days, march_days),
            "monthly_insights": build_monthly_insights(),
        }
        # This should not raise
        serialized = json.dumps(widgets)
        assert len(serialized) > 100

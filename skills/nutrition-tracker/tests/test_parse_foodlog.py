"""Tests for parse_foodlog.py — both original and rich parser functions."""

import pytest
from parse_foodlog import (
    _safe_float,
    _ddmmyyyy_to_iso,
    parse_log,
    parse_log_rich,
    group_by_date,
    group_by_date_rich,
)


# ── _safe_float ──


class TestSafeFloat:
    def test_normal(self):
        assert _safe_float("3.5") == 3.5

    def test_less_than(self):
        assert _safe_float("<0.5") == 0.5

    def test_integer(self):
        assert _safe_float("283") == 283.0

    def test_zero(self):
        assert _safe_float("0.0") == 0.0

    def test_whitespace(self):
        assert _safe_float("  12.5  ") == 12.5

    def test_invalid_raises(self):
        with pytest.raises(ValueError):
            _safe_float("abc")


# ── _ddmmyyyy_to_iso ──


class TestDateConversion:
    def test_basic(self):
        assert _ddmmyyyy_to_iso("01-04-2026") == "2026-04-01"

    def test_single_digit_preserved(self):
        # Input is always zero-padded in log files
        assert _ddmmyyyy_to_iso("29-03-2026") == "2026-03-29"


# ── parse_log_rich ──


class TestParseLogRich:
    def test_count(self, fixtures_dir):
        entries = parse_log_rich(fixtures_dir / "2026-03.md")
        assert len(entries) == 11  # 11 rows in March fixture

    def test_date_iso(self, fixtures_dir):
        entries = parse_log_rich(fixtures_dir / "2026-03.md")
        assert entries[0]["date_iso"] == "2026-03-01"
        assert entries[-1]["date_iso"] == "2026-03-29"

    def test_time_extracted(self, fixtures_dir):
        entries = parse_log_rich(fixtures_dir / "2026-03.md")
        assert entries[0]["time"] == "08:15"
        assert entries[1]["time"] == "12:30"

    def test_food_name(self, fixtures_dir):
        entries = parse_log_rich(fixtures_dir / "2026-03.md")
        assert entries[0]["food"] == "Porridge with honey"
        assert entries[1]["food"] == "Grilled salmon fillet"

    def test_macros(self, fixtures_dir):
        entries = parse_log_rich(fixtures_dir / "2026-03.md")
        first = entries[0]
        assert first["protein"] == 8.0
        assert first["fat"] == 3.0
        assert first["carbs"] == 45.0
        assert first["kcal"] == 240.0

    def test_fasting(self, fixtures_dir):
        entries = parse_log_rich(fixtures_dir / "2026-03.md")
        fasting = [e for e in entries if e["is_fasting"]]
        assert len(fasting) == 1
        assert fasting[0]["kcal"] == 0.0
        assert fasting[0]["date_iso"] == "2026-03-29"

    def test_less_than_values(self, fixtures_dir):
        """<0.5 in total columns should parse as 0.5."""
        entries = parse_log_rich(fixtures_dir / "2026-04.md")
        membrillo = entries[1]  # Membrillo paste row
        assert membrillo["food"] == "Membrillo paste"
        assert membrillo["protein"] == 0.5  # <0.5 → 0.5
        assert membrillo["fat"] == 0.5  # <0.5 → 0.5

    def test_short_row_skipped(self, fixtures_dir):
        """Rows with fewer than 13 columns should be silently skipped."""
        entries = parse_log_rich(fixtures_dir / "edge-cases.md")
        foods = [e["food"] for e in entries]
        assert "Short row" not in foods

    def test_edge_cases_count(self, fixtures_dir):
        """Edge cases file: 2 normal + 1 short (skipped) + 1 with <0.5 = 3 entries."""
        entries = parse_log_rich(fixtures_dir / "edge-cases.md")
        assert len(entries) == 3

    def test_empty_file(self, fixtures_dir):
        entries = parse_log_rich(fixtures_dir / "empty.md")
        assert entries == []

    def test_late_time_captured(self, fixtures_dir):
        """23:30 entry should be captured correctly."""
        entries = parse_log_rich(fixtures_dir / "edge-cases.md")
        late = [e for e in entries if e["time"] == "23:30"]
        assert len(late) == 1
        assert late[0]["food"] == "Late night snack"


# ── group_by_date_rich ──


class TestGroupByDateRich:
    def test_grouping(self, march_entries):
        days = group_by_date_rich(march_entries)
        assert len(days) == 5  # 5 distinct dates in March fixture

    def test_meals_populated(self, march_days):
        day1 = march_days["2026-03-01"]
        assert len(day1["meals"]) == 3

    def test_totals_sum(self, march_days):
        day1 = march_days["2026-03-01"]
        # 240 + 250 + 580 = 1070 kcal
        assert day1["totals"]["kcal"] == pytest.approx(1070.0)
        # 8 + 35 + 18 = 61 protein
        assert day1["totals"]["protein"] == pytest.approx(61.0)

    def test_fasting_flag(self, march_days):
        assert march_days["2026-03-29"]["is_fasting"] is True
        assert march_days["2026-03-01"]["is_fasting"] is False

    def test_fasting_day_zero_totals(self, march_days):
        fasting = march_days["2026-03-29"]
        assert fasting["totals"]["kcal"] == 0.0
        assert fasting["totals"]["protein"] == 0.0

    def test_date_field(self, march_days):
        assert march_days["2026-03-01"]["date"] == "2026-03-01"


# ── backward compatibility ──


class TestBackwardCompat:
    def test_original_parse_log(self, fixtures_dir):
        """Original parse_log() must still work and return tuples."""
        entries = parse_log(fixtures_dir / "2026-03.md")
        assert len(entries) == 11
        date_str, protein, fat, carbs, kcal, is_fasting = entries[0]
        assert date_str == "01-03-2026"  # original DD-MM-YYYY format
        assert protein == 8.0
        assert is_fasting is False

    def test_original_group_by_date(self, fixtures_dir):
        entries = parse_log(fixtures_dir / "2026-03.md")
        daily = group_by_date(entries)
        assert len(daily) == 5
        assert daily["01-03-2026"]["kcal"] == pytest.approx(1070.0)

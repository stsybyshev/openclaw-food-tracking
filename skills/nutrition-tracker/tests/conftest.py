import sys
from pathlib import Path

import pytest

# Make scripts/ importable
SKILL_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(SKILL_DIR / "scripts"))
sys.path.insert(0, str(SKILL_DIR / "dashboard"))

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def fixtures_dir():
    return FIXTURES_DIR


@pytest.fixture
def sample_config():
    return {
        "body_weight_kg": 90,
        "calories_target": 2500,
        "protein_target_g": 144,
        "fat_target_g": 78,
        "carbs_target_g": 295,
        "protein_per_kg_target": 1.6,
        "macro_split_target": {"protein": 25, "fat": 28, "carbs": 47},
        "heatmap": {
            "fasting_max": 0,
            "low_max": 2000,
            "normal_max": 2500,
            "elevated_max": 3000,
        },
        "meal_timing": {
            "timeline_start": 6,
            "timeline_end": 22,
            "morning_end": 11,
            "midday_end": 15,
        },
    }


@pytest.fixture
def march_entries(fixtures_dir):
    from parse_foodlog import parse_log_rich
    return parse_log_rich(fixtures_dir / "2026-03.md")


@pytest.fixture
def april_entries(fixtures_dir):
    from parse_foodlog import parse_log_rich
    return parse_log_rich(fixtures_dir / "2026-04.md")


@pytest.fixture
def march_days(march_entries):
    from parse_foodlog import group_by_date_rich
    return group_by_date_rich(march_entries)


@pytest.fixture
def april_days(april_entries):
    from parse_foodlog import group_by_date_rich
    return group_by_date_rich(april_entries)

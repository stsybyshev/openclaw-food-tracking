"""Food cache operations: search and append over personal-foods.yaml and popular-foods.yaml."""

import fcntl
from pathlib import Path

import yaml


def load_yaml(path: str | Path) -> list[dict]:
    """Read a YAML food cache file and return list of food entries."""
    p = Path(path)
    if not p.exists():
        return []
    with open(p) as f:
        data = yaml.safe_load(f)
    if not isinstance(data, list):
        return []
    return data


def _matches(query: str, entry: dict) -> bool:
    """Check if query matches entry name or any alias (case-insensitive substring)."""
    q = query.lower().strip()
    if not q:
        return False
    name = entry.get("name", "").lower()
    if q in name or name in q:
        return True
    for alias in entry.get("aliases", []):
        a = str(alias).lower()
        if q in a or a in q:
            return True
    return False


def _entry_to_result(entry: dict, source: str) -> dict:
    """Convert a YAML entry to a clean result dict."""
    return {
        "name": entry.get("name", ""),
        "aliases": entry.get("aliases", []),
        "qty_default": entry.get("qty_default", 1),
        "unit": entry.get("unit", "serving"),
        "kcal_per_unit": entry.get("kcal_per_unit", 0),
        "protein_per_unit": entry.get("protein_per_unit", 0),
        "fat_per_unit": entry.get("fat_per_unit", 0),
        "carbs_per_unit": entry.get("carbs_per_unit", 0),
        "notes": entry.get("notes", ""),
        "source": source,
    }


def search_foods(query: str, personal_path: str, popular_path: str) -> list[dict]:
    """Search both food caches. Personal matches come first.

    Returns all matching entries (usually 1-3).
    """
    results = []

    personal = load_yaml(personal_path)
    for entry in personal:
        if _matches(query, entry):
            results.append(_entry_to_result(entry, "personal"))

    popular = load_yaml(popular_path)
    for entry in popular:
        if _matches(query, entry):
            results.append(_entry_to_result(entry, "seed"))

    return results


def append_personal_food(
    entry: dict,
    path: str,
) -> dict:
    """Append a new food entry to personal-foods.yaml.

    Validates required fields, checks for alias collisions, and appends atomically.
    Returns the saved entry on success, or an error dict.
    """
    required = ["name", "unit", "kcal_per_unit", "protein_per_unit", "fat_per_unit", "carbs_per_unit"]
    missing = [f for f in required if f not in entry or entry[f] is None]
    if missing:
        return {"error": f"Missing required fields: {', '.join(missing)}"}

    new_aliases = [str(a).lower() for a in entry.get("aliases", [])]
    new_name = str(entry["name"]).lower()

    existing = load_yaml(path)
    for ex in existing:
        ex_name = str(ex.get("name", "")).lower()
        ex_aliases = [str(a).lower() for a in ex.get("aliases", [])]
        all_existing = [ex_name] + ex_aliases
        all_new = [new_name] + new_aliases

        for n in all_new:
            if n in all_existing:
                return {"error": f"Alias '{n}' already exists in entry '{ex.get('name')}'"}

    record = {
        "name": entry["name"],
        "aliases": entry.get("aliases", []),
        "qty_default": entry.get("qty_default", 1),
        "unit": entry["unit"],
        "kcal_per_unit": entry["kcal_per_unit"],
        "protein_per_unit": entry["protein_per_unit"],
        "fat_per_unit": entry["fat_per_unit"],
        "carbs_per_unit": entry["carbs_per_unit"],
        "notes": entry.get("notes", ""),
        "source": "learned",
    }

    yaml_block = "\n" + yaml.dump([record], default_flow_style=False, allow_unicode=True)

    p = Path(path)
    with open(p, "a") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            f.write(yaml_block)
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)

    return {"status": "ok", "entry": record}

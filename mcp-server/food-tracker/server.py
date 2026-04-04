"""MCP server for food cache lookup and management.

Wraps personal-foods.yaml and popular-foods.yaml behind two tools:
  - lookup_food: fuzzy search across both caches
  - add_personal_food: append-only write to personal-foods.yaml
"""

import os

from mcp.server.fastmcp import FastMCP

from food_cache import append_personal_food, search_foods

# --- Config from env vars ---
PERSONAL_FOODS_PATH = os.environ.get(
    "PERSONAL_FOODS_PATH",
    os.path.expanduser("~/.openclaw/workspace/food-tracker/personal-foods.yaml"),
)
POPULAR_FOODS_PATH = os.environ.get(
    "POPULAR_FOODS_PATH",
    os.path.expanduser(
        "~/.openclaw/workspace/skills/openclaw-food-tracker/references/popular-foods.yaml"
    ),
)

mcp = FastMCP(
    "food-cache",
    instructions="Food cache lookup and management. Use lookup_food to find nutrition info for foods. Use add_personal_food to save new foods for future reuse.",
)


@mcp.tool()
def lookup_food(query: str) -> list[dict]:
    """Search for a food in the user's personal foods cache and the seed database.

    Returns matching entries with nutrition info (kcal, protein, fat, carbs per unit).
    Personal foods are returned first. Returns empty list if no match found.

    Args:
        query: Food name to search for (e.g. "omelette", "cortado", "salmon")
    """
    return search_foods(query, PERSONAL_FOODS_PATH, POPULAR_FOODS_PATH)


@mcp.tool()
def add_personal_food(
    name: str,
    unit: str,
    kcal_per_unit: float,
    protein_per_unit: float,
    fat_per_unit: float,
    carbs_per_unit: float,
    aliases: list[str] | None = None,
    qty_default: float = 1,
    notes: str = "",
) -> dict:
    """Save a new food to the user's personal foods cache for future reuse.

    Only call this when the user explicitly asks to save/remember a food.
    The food will be available via lookup_food in future queries.
    Rejects duplicates if the name or any alias already exists.

    Args:
        name: Canonical name for the food (e.g. "eggs benedict")
        unit: Serving unit (e.g. "serving", "100g", "cup", "slice")
        kcal_per_unit: Kilocalories per unit
        protein_per_unit: Grams of protein per unit
        fat_per_unit: Grams of fat per unit
        carbs_per_unit: Grams of carbs per unit
        aliases: Alternative names to match (e.g. ["eggs benny", "benny"])
        qty_default: Default quantity when user doesn't specify (default: 1)
        notes: Optional context (recipe, portion source, etc.)
    """
    entry = {
        "name": name,
        "aliases": aliases or [],
        "qty_default": qty_default,
        "unit": unit,
        "kcal_per_unit": kcal_per_unit,
        "protein_per_unit": protein_per_unit,
        "fat_per_unit": fat_per_unit,
        "carbs_per_unit": carbs_per_unit,
        "notes": notes,
    }
    return append_personal_food(entry, PERSONAL_FOODS_PATH)


if __name__ == "__main__":
    mcp.run()

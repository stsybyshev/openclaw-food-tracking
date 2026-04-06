#!/usr/bin/env python3
"""Test harness for openclaw-food-tracker skill.

Usage:
    export ANTHROPIC_API_KEY=sk-ant-...
    python3 test/run-tests.py

    # or pass key as argument:
    python3 test/run-tests.py sk-ant-...

Options (env vars):
    MODEL      Claude model to use (default: claude-haiku-4-5-20251001)
    ABLATION   Set to "1" to also run each case without the skill (bare model)

Example:
    MODEL=claude-sonnet-4-6 ABLATION=1 python3 test/run-tests.py
"""

import json, subprocess, sys, os, time

# ── Paths (relative to repo root) ────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(SCRIPT_DIR)

SKILL_PATH = os.path.join(BASE, "dist/openclaw-food-tracker/SKILL.md")
PERSONAL_CACHE_PATH = os.path.join(BASE, "dist/openclaw-food-tracker/references/personal-foods.yaml")
CACHE_PATH = os.path.join(BASE, "dist/openclaw-food-tracker/references/popular-foods.yaml")
CASES_DIR = os.path.join(BASE, "test/cases")
RESULTS_DIR = os.path.join(BASE, "test/results")

# ── Config ────────────────────────────────────────────────────────────────────

API_KEY = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("ANTHROPIC_API_KEY", "")
MODEL = os.environ.get("MODEL", "claude-haiku-4-5-20251001")
ABLATION = os.environ.get("ABLATION", "0") == "1"
DELAY = float(os.environ.get("DELAY", "20"))  # seconds between API calls (rate limit safety)

# ── Colours ───────────────────────────────────────────────────────────────────

GREEN = "\033[0;32m"
RED = "\033[0;31m"
YELLOW = "\033[1;33m"
CYAN = "\033[0;36m"
NC = "\033[0m"

# ── Cost table (USD per million tokens) ───────────────────────────────────────

PRICING = {
    "claude-haiku-4-5-20251001": (0.80, 4.00),
    "claude-sonnet-4-6": (3.00, 15.00),
    "claude-opus-4-6": (15.00, 75.00),
}

# ── Load skill + cache ───────────────────────────────────────────────────────

def load_skill_system_prompt():
    if not os.path.isfile(SKILL_PATH):
        print(f"{YELLOW}SKIP: {SKILL_PATH} not found. Author SKILL.md first.{NC}")
        sys.exit(0)

    with open(SKILL_PATH) as f:
        skill_md = f.read()
    with open(PERSONAL_CACHE_PATH) as f:
        personal_yaml = f.read()
    with open(CACHE_PATH) as f:
        foods_yaml = f.read()

    return skill_md + """

---

## Available Files (pre-loaded)

### Contents of {baseDir}/references/personal-foods.yaml:

```yaml
""" + personal_yaml + """
```

### Contents of {baseDir}/references/popular-foods.yaml:

```yaml
""" + foods_yaml + """
```

### Contents of food-tracker/2026-03.md:

# Food Log — March 2026

| Datetime         | Food                   | Qty | Unit    | Protein/u | Fat/u | Carbs/u | Kcal/u | Protein | Fat   | Carbs | Kcal  | Source       | Confidence |
|:-----------------|:-----------------------|----:|:--------|----------:|------:|--------:|-------:|--------:|------:|------:|------:|:-------------|:-----------|
| 13-03-2026 08:00 | FASTING                |   1 | day     |       0.0 |   0.0 |     0.0 |      0 |     0.0 |   0.0 |   0.0 |     0 | cache_lookup | 1.0        |
| 14-03-2026 12:00 | Salmon traybake        |   1 | serving |      62.0 |  55.0 |    52.0 |   1014 |    62.0 |  55.0 |  52.0 |  1014 | cache_lookup | 0.95       |
| 15-03-2026 08:30 | Scrambled eggs         |   3 | egg     |       6.3 |   4.8 |     0.4 |     72 |    18.9 |  14.4 |   1.2 |   216 | cache_lookup | 0.95       |
| 15-03-2026 08:30 | Black coffee           |   1 | cup     |       0.3 |   0.0 |     0.0 |      2 |     0.3 |   0.0 |   0.0 |     2 | cache_lookup | 0.99       |

### Current date and time: 2026-03-15 13:00
"""

# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_input(filepath):
    """Extract ## Input section from a test case file."""
    with open(filepath) as f:
        lines = f.readlines()
    capture = False
    result = []
    for line in lines:
        if line.strip().startswith("## Input"):
            capture = True
            continue
        if capture and line.strip().startswith("## "):
            break
        if capture:
            result.append(line)
    return "".join(result).strip()


def call_api(system_prompt, user_message):
    """Call Claude API and return (response_text, metadata)."""
    payload = {"model": MODEL, "max_tokens": 1024, "messages": [{"role": "user", "content": user_message}]}
    if system_prompt:
        # Use structured system content with cache_control for prompt caching
        payload["system"] = [
            {"type": "text", "text": system_prompt, "cache_control": {"type": "ephemeral"}}
        ]

    result = subprocess.run(
        ["curl", "-s", "https://api.anthropic.com/v1/messages",
         "-H", f"x-api-key: {API_KEY}",
         "-H", "anthropic-version: 2023-06-01",
         "-H", "content-type: application/json",
         "-d", json.dumps(payload)],
        capture_output=True, text=True, timeout=60
    )
    resp = json.loads(result.stdout)
    if "content" in resp and len(resp["content"]) > 0:
        text = resp["content"][0]["text"]
        usage = resp.get("usage", {})
        meta = {
            "model": resp.get("model", "?"),
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "cache_creation_input_tokens": usage.get("cache_creation_input_tokens", 0),
            "cache_read_input_tokens": usage.get("cache_read_input_tokens", 0),
        }
        return text, meta
    else:
        return f"ERROR: {json.dumps(resp)}", {"model": "?", "input_tokens": 0, "output_tokens": 0}


def run_case(case_file, system_prompt):
    """Run one test case. Returns (case_name, pass/fail/skip, response_text, meta)."""
    case_name = os.path.splitext(os.path.basename(case_file))[0]
    user_input = extract_input(case_file)

    if not user_input:
        return case_name, "skip", "No ## Input section", {}

    text, meta = call_api(system_prompt, user_input)

    if text.startswith("ERROR"):
        return case_name, "fail", text, meta

    if len(text) < 20:
        return case_name, "fail", f"Response too short ({len(text)} chars)", meta

    return case_name, "pass", text, meta


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if not API_KEY:
        print(f"{RED}ERROR: No API key. Pass as argument or set ANTHROPIC_API_KEY.{NC}")
        sys.exit(1)

    system_with_skill = load_skill_system_prompt()
    os.makedirs(RESULTS_DIR, exist_ok=True)
    cases = sorted([f for f in os.listdir(CASES_DIR) if f.endswith(".md")])

    print()
    print("openclaw-food-tracker test harness")
    print(f"  Model:    {MODEL}")
    print(f"  Cases:    {len(cases)}")
    print(f"  Ablation: {'enabled' if ABLATION else 'disabled'}")
    print()

    total_input = 0
    total_output = 0
    total_cache_create = 0
    total_cache_read = 0
    results = {"pass": 0, "fail": 0, "skip": 0}

    # ── With skill ────────────────────────────────────────────────────────
    print("── With skill ──────────────────────────────────────────────────────────")
    for case_file in cases:
        name, status, text, meta = run_case(os.path.join(CASES_DIR, case_file), system_with_skill)
        color = {"pass": GREEN, "fail": RED, "skip": YELLOW}[status]
        cache_hit = meta.get("cache_read_input_tokens", 0)
        cache_info = f" ⚡cached" if cache_hit > 0 else ""
        tokens = f"({meta.get('input_tokens', 0)}+{meta.get('output_tokens', 0)} tok{cache_info})" if meta else ""
        print(f"  {color}{status.upper():4s}{NC}  {name}  {tokens}")
        if status == "pass":
            preview = text.split("\n")[0][:100]
            print(f"        {CYAN}→ {preview}{NC}")
        results[status] += 1
        total_input += meta.get("input_tokens", 0)
        total_output += meta.get("output_tokens", 0)
        total_cache_create += meta.get("cache_creation_input_tokens", 0)
        total_cache_read += meta.get("cache_read_input_tokens", 0)

        with open(os.path.join(RESULTS_DIR, f"{name}-skill.md"), "w") as f:
            f.write(text)
        time.sleep(DELAY)

    # ── Ablation (without skill) ──────────────────────────────────────────
    if ABLATION:
        print()
        print("── Without skill (ablation) ────────────────────────────────────────────")
        for case_file in cases:
            name, status, text, meta = run_case(os.path.join(CASES_DIR, case_file), "")
            color = {"pass": GREEN, "fail": RED, "skip": YELLOW}[status]
            tokens = f"({meta.get('input_tokens', 0)}+{meta.get('output_tokens', 0)} tok)" if meta else ""
            print(f"  {color}{status.upper():4s}{NC}  {name}  {tokens}")
            if status == "pass":
                preview = text.split("\n")[0][:100]
                print(f"        {CYAN}→ {preview}{NC}")
            total_input += meta.get("input_tokens", 0)
            total_output += meta.get("output_tokens", 0)
            total_cache_create += meta.get("cache_creation_input_tokens", 0)
            total_cache_read += meta.get("cache_read_input_tokens", 0)

            with open(os.path.join(RESULTS_DIR, f"{name}-bare.md"), "w") as f:
                f.write(text)
            time.sleep(DELAY)

    # ── Summary ───────────────────────────────────────────────────────────
    inp_price, out_price = PRICING.get(MODEL, (0.80, 4.00))
    # Cached reads cost 10% of input price; cache writes cost 25% more than input price
    # total_input from API = non-cached input tokens only (excludes cache_read and cache_create)
    cost = (total_input / 1e6 * inp_price
            + total_cache_create / 1e6 * inp_price * 1.25
            + total_cache_read / 1e6 * inp_price * 0.1
            + total_output / 1e6 * out_price)
    all_input = total_input + total_cache_create + total_cache_read
    cost_without_cache = all_input / 1e6 * inp_price + total_output / 1e6 * out_price

    print()
    print("── Results ─────────────────────────────────────────────────────────────")
    print(f"  {GREEN}PASS: {results['pass']}{NC}  {RED}FAIL: {results['fail']}{NC}  {YELLOW}SKIP: {results['skip']}{NC}")
    print(f"  Tokens: {total_input:,} input + {total_output:,} output")
    if total_cache_read > 0 or total_cache_create > 0:
        print(f"  Cache:  {total_cache_create:,} written + {total_cache_read:,} read")
        print(f"  Estimated cost: ${cost:.4f} ({cost*100:.2f} cents) — saved ~${cost_without_cache - cost:.4f} via caching")
    else:
        print(f"  Estimated cost: ${cost:.4f} ({cost*100:.2f} cents)")
    print(f"  Results saved to: test/results/")
    print()

    sys.exit(1 if results["fail"] > 0 else 0)


if __name__ == "__main__":
    main()

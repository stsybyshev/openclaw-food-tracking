# Test Harness

Tests the `openclaw-food-tracker` skill by calling the Claude API directly with the `SKILL.md` as a system prompt. No OpenClaw installation required.

## Requirements

- `bash`, `curl`, `jq` — all standard on macOS/Linux
- An `ANTHROPIC_API_KEY` (the same key you use for your OpenClaw bot)

## Run tests

```bash
export ANTHROPIC_API_KEY=sk-ant-...
bash test/run-tests.sh
```

## Options

| Variable | Default | Description |
|---|---|---|
| `SKILL_PATH` | `dist/openclaw-food-tracker/SKILL.md` | Path to the skill file under test |
| `MODEL` | `claude-haiku-4-5-20251001` | Model to use (Haiku is fast and cheap for iteration) |
| `ABLATION` | `0` | Set to `1` to also run each case without the skill injected |

### Example: full ablation run with Sonnet

```bash
MODEL=claude-sonnet-4-6 ABLATION=1 bash test/run-tests.sh
```

## How it works

1. Each file in `test/cases/*.md` is a test case with an `## Input` section and an `## Expected behaviour` section.
2. The script extracts the `## Input` text and sends it to the Claude API.
3. **With skill**: `SKILL.md` is injected as the system prompt.
4. **Ablation** (optional): the same prompt is sent with no system prompt (bare model).
5. Assertions are currently basic (non-empty response, no API error). Richer assertions (field presence, calorie ranges) will be added once the log format is finalised.

## Ablation testing

The ablation run helps answer: *are the skill instructions actually doing anything?*

- If the bare model passes a test too, the instructions for that case may be redundant or too vague.
- If the bare model fails and the skill passes, the instructions are contributing meaningfully.
- Aim: skill should pass all cases; bare model should fail at least cases 01, 02, 03, and 05.

## Adding test cases

Create a new `.md` file in `test/cases/` following this format:

```markdown
## Input

the user message to send

## Expected behaviour

- bullet points describing what the agent should do
- used as human-readable spec, not parsed by the script (yet)
```

## Current test cases

| File | Tests |
|---|---|
| `01-simple-meal.md` | Happy path: structured meal, unambiguous input |
| `02-usual-meal.md` | Cache lookup: "my usual" triggers cache, asks if not found |
| `03-ambiguous-portion.md` | Uncertainty handling: vague portion → low confidence, estimates |
| `04-not-a-tracking-request.md` | Intent boundary: recipe question must NOT trigger food log |
| `05-daily-summary.md` | Summary request: read log, no new entry appended |

## Note: SKILL.md not yet authored

If `dist/openclaw-food-tracker/SKILL.md` does not exist, the script will exit with a clear message. The scaffold is in place — skill authoring is the next step.

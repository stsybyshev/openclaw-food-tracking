This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This repository is a skill factory for generating an importable OpenClaw food tracking skill. OpenClaw Food Tracking is a skill for OpenClaw bots (and in future potentially also Claude Cowork skill) that allow agents to process food tracking request ("just had my usual 3 eggs omelette", "nice lunch in a turkish restaurant - see photo attached"), estimate calories and macros - from food description and/or photos or cache of most popular foods of a particular user and store it in append-only markdown file.
Later on, the agent would learn how to tell user daily/monthly/yearly aggregate stats, detect trends and produce some sort of nice dashboards available either via Jamstack-style static files or simple mobile view-only app.

## Repository Purpose
The purpose of this repository is to help Claude Code design, generate, test, and package a reusable food tracking skill artifact for OpenClaw bots and potentially other agent platforms in the future.
Claude Code should treat this repository as a build/design environment, and NOT as the final runtime environment of the skill itself!

## Target Artifact
The main output of this repository is an importable skill package containing:
- `SKILL.md`
- supporting markdown templates and data files
- optional helper scripts
- examples and minimal documentation for installation/use

Generated artifacts should be placed in a dedicated output folder such as `dist/openclaw-food-tracker/`.

## OpenClaw Skills Format

OpenClaw uses the **AgentSkills** open standard (https://agentskills.io), also supported by Claude Code, GitHub Copilot, Cursor, Gemini CLI, VS Code, and others. Skills are portable across all compatible agents.

### Directory structure

```
food-tracker/          # directory name must match skill `name` field
├── SKILL.md           # required: YAML frontmatter + markdown instructions
├── references/        # optional: additional docs, loaded on demand
└── assets/            # optional: templates, data files
```

### SKILL.md frontmatter (AgentSkills base spec)

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | Lowercase, hyphens only, max 64 chars, must match directory name |
| `description` | Yes | Max 1024 chars. Describe what the skill does AND when to use it — this is how the agent recognizes intent |
| `license` | No | License name or reference to bundled file |
| `compatibility` | No | Environment requirements (OS, binaries, etc.) |
| `metadata` | No | Key-value map for additional properties |
| `allowed-tools` | No | Space-delimited pre-approved tools (experimental) |

### OpenClaw-specific frontmatter extensions

- `user-invocable` — boolean, exposes skill as a slash command (default: `true`)
- `disable-model-invocation` — boolean, exclude from model system prompt (default: `false`)
- `metadata` — single-line JSON with `openclaw` key for load-time gating:
  - `requires.bins`, `requires.env`, `requires.config` — filter by available binaries / env vars / config
  - `always: true` — always include regardless of other gates
  - `emoji`, `homepage`, `os` — UI hints and OS filtering

### Runtime loading (progressive disclosure)

1. **Session start**: `name` + `description` injected into the system prompt for all eligible skills (~100 tokens per skill)
2. **Skill activated**: full `SKILL.md` body is loaded
3. **On demand**: files in `references/` and `assets/` are loaded only when the agent reads them

Keep `SKILL.md` body under 500 lines. Move detailed reference material to `references/`.

### Body format

Free-form markdown. Recommended sections: step-by-step instructions, examples of inputs/outputs, edge cases. No special format required — write whatever helps the agent perform the task.

## Current Status
Early design phase. Focus on clarifying runtime behavior, file formats, and packaging before implementing optional extras.

## Build Goals
- Define the runtime behavior of the OpenClaw food tracking skill
- Define append-only markdown storage formats
- Define local cache format for popular foods and recurring meals
- Generate a draft `SKILL.md`
- Generate supporting template/data files
- Provide sample conversations and expected outputs
- Keep the final artifact simple, portable, and easy to fine-tune manually before import

## MVP Runtime Scope
The generated skill should support:
- recognizing food tracking intent
- logging food intake from text and optionally photos
- resolving foods from local cache first
- estimating calories/macros when cache is insufficient
- storing entries into append-only monthly markdown files
- returning current intake totals and daily aggregates
- basic daily/weekly/monthly summaries on demand

## Out of Scope for Initial Artifact
- polished mobile app
- complex cloud infrastructure
- database backend
- advanced dashboard framework
- multi-domain quantified-self platform

## Runtime Storage Model

### Monthly food logs (`YYYY-MM.md`)

One file per month, flat markdown table, no day headings — optimised for agent parsing. The agent creates a new file on the first entry of each month and appends rows thereafter.

Fields per row:
- `datetime` — `DD-MM-YYYY HH:MM` (24h)
- `food` — name and brief description
- `qty` — numeric quantity
- `unit` — serving unit (`egg`, `cup`, `100g`, `g`, `kg`, `tsp`, `tbsp`, `serving`, `slice`, etc.). Prefer `100g` over `g` when macro values come from a nutrition label (most labels list per 100g); `qty` then becomes the number of 100g portions consumed (e.g. 250g eaten → qty=2.5, unit=100g).
- `protein_unit` — grams of protein per unit
- `fat_unit` — grams of fat per unit
- `carbs_unit` — grams of carbs per unit
- `kcal_unit` — kilocalories per unit
- `protein_total` — qty × protein_unit
- `fat_total` — qty × fat_unit
- `carbs_total` — qty × carbs_unit
- `kcal_total` — qty × kcal_unit
- `source` — `cache_lookup` | `text_estimate` | `photo_label` | `photo_estimate`
- `confidence` — float 0–1 (cache_lookup ~0.95, text_estimate ~0.6, photo_estimate ~0.3)

Daily/weekly/monthly aggregation: agent sums `*_total` columns filtering by datetime prefix. No pre-computed aggregates stored.

Template: `dist/openclaw-food-tracker/assets/monthly-template.md`

### Personal foods cache (`personal-foods.yaml`)

YAML file, agent-writable. Checked **first** on every food tracking request. Stores the user's recurring meals, home-cooked dishes, and local cafe items. Starts empty; the skill appends entries when the user confirms a recurring meal.

Fields per entry: `name`, `aliases`, `qty_default`, `unit`, `kcal_per_unit`, `protein_per_unit`, `fat_per_unit`, `carbs_per_unit`, `notes`, `source` (always `learned`).

Mutability rules: only append after explicit user confirmation; update existing entry if alias matches rather than duplicating.

File: `dist/openclaw-food-tracker/references/personal-foods.yaml`

### Popular foods cache (`popular-foods.yaml`)

YAML file, **read-only at runtime** (seed data only). Checked **second**, after personal-foods.yaml. Ships with ~50 pescatarian-friendly seed entries for consistency — ensures common foods always produce the same calorie/macro values regardless of model variance.

Fields per entry: `name`, `aliases`, `qty_default`, `unit`, `kcal_per_unit`, `protein_per_unit`, `fat_per_unit`, `carbs_per_unit`, `notes`, `source` (always `seed`).

The skill MUST NOT write learned entries to this file. All user-confirmed foods go to `personal-foods.yaml`.

File: `dist/openclaw-food-tracker/references/popular-foods.yaml`

### Other runtime files
- `summary.html` (generated, optional/post-MVP)

## Model Quality Considerations

The skill should be designed to run on cheap/small models. The primary OpenClaw agent (which may run on an expensive model like Opus) is likely to delegate food tracking skill execution to a much cheaper sub-model (Sonnet, Haiku, or even a local llama-based model like gpt-oss-20B).

Implications for SKILL.md authoring:
- Instructions must be extra explicit and step-by-step — no reliance on "smart" reasoning
- Prefer structured output templates (e.g. "fill in this table row") over open-ended generation
- Minimise ambiguity — smaller models struggle with implicit instructions
- Keep the SKILL.md body concise (smaller context windows on cheaper models)
- Include concrete examples of correct output for each operation type

## Async Execution

Food tracking skill execution may be delegated asynchronously by the primary agent using an outbox/subagent pattern. This is common in OpenClaw bots that hit API rate limits — the primary agent acknowledges the user's message and spawns a subagent to run the food tracking skill later.

Implications for skill design:
- The skill must be self-contained — all info needed is in the user message + cache/log files
- No multi-turn conversation dependency during execution (the subagent won't have chat history)
- The skill must produce a complete result in one shot (log entry + confirmation message)
- Error handling must be explicit (what to do on cache miss, ambiguous input, etc.) since there is no interactive fallback to ask the user for clarification mid-execution

## Builder Guidance
When working in this repository:
- keep design docs in `/docs`
- keep runtime artifact content in `/dist` or a dedicated artifact folder
- do not mix design commentary into final `SKILL.md`
- prefer small, reviewable steps
- define schemas and examples before generating final artifact text
- prioritize portability and simplicity
- do not introduce SQL/database dependencies unless explicitly justified

## Future Direction
The generated skill may later become part of a wider quantified-self system and may eventually be published or adapted for marketplaces or alternative agent platforms.

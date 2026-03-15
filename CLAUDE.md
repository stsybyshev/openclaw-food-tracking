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
The generated skill should use markdown-based storage for MVP; may switch to SQLite when there would be a clear and strong rationale.

Expected runtime files:
- `template.md`
- `popular-foods.md`
- `YYYY-MM.md`
- `summary.html` (generated, optional/post-MVP)

Monthly files should store atomic intake entries.
Per-entry fields may include:
- timestamp
- food_name
- qty
- unit
- calories_per_unit
- protein_per_unit
- fat_per_unit
- carbs_per_unit
- total_calories
- total_protein
- total_fat
- total_carbs
- source
- confidence

`total_*` fields refer to per-entry totals only, not cumulative running totals.

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

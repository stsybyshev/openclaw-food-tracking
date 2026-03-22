<!--
  Sync Impact Report
  ==================
  Version change: (none) → 1.0.0 (initial ratification)
  Added principles:
    - I. Skill-as-Artifact
    - II. Small-Model Compatibility
    - III. Self-Contained Execution
    - IV. Append-Only Markdown Storage
    - V. Cache-First Resolution
    - VI. Portability & Simplicity
  Added sections:
    - Architectural Constraints
    - Build Workflow
    - Governance
  Removed sections: (none)
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no update needed (Constitution Check is generic)
    - .specify/templates/spec-template.md ✅ no update needed (structure is generic)
    - .specify/templates/tasks-template.md ✅ no update needed (structure is generic)
  Follow-up TODOs: none
-->

# OpenClaw Food Tracking Skill Constitution

## Core Principles

### I. Skill-as-Artifact

This repository is a build/design environment. The output is an
importable skill package placed in `dist/openclaw-food-tracker/`.
All design commentary, iteration notes, and tooling MUST stay
outside the final artifact. The artifact consists of `SKILL.md`,
supporting templates/data files, and optional helper scripts —
nothing else.

### II. Small-Model Compatibility

The skill MUST be authored so that cheap/small models (Haiku,
Sonnet, local llama-class) can execute it reliably. This means:

- Instructions MUST be explicit and step-by-step
- Prefer structured output templates ("fill in this table row")
  over open-ended generation
- Minimise ambiguity — no reliance on implicit reasoning
- Keep SKILL.md body under 500 lines
- Include concrete examples of correct output for every
  operation type

### III. Self-Contained Execution

The skill MUST produce a complete result in a single invocation.
No multi-turn conversation dependency during execution is
permitted. All information needed is in the user message plus
cache/log files. Error handling MUST be explicit — there is no
interactive fallback to ask the user mid-execution.

### IV. Append-Only Markdown Storage

All food log data MUST be stored in append-only monthly markdown
tables (`YYYY-MM.md`). No pre-computed aggregates are stored;
the agent sums `*_total` columns at query time. No SQL or
database backend is permitted unless explicitly justified and
approved. Storage MUST remain human-auditable and local-first.

### V. Cache-First Resolution

Every food tracking request MUST query the popular foods cache
(`popular-foods.yaml`) before falling back to text or photo
estimation. Cache entries are append-only: new entries require
explicit user confirmation and MUST be marked `source: learned`.
Existing entries are updated (not duplicated) when an alias
matches.

### VI. Portability & Simplicity

The skill MUST conform to the AgentSkills open standard and
remain portable across OpenClaw, Claude Cowork, and other
compatible agent platforms. No platform-specific APIs or
cloud infrastructure dependencies are permitted in the MVP.
Start simple; YAGNI applies — do not introduce complexity
for hypothetical future requirements.

## Architectural Constraints

- **No database dependencies**: storage is flat markdown + YAML
- **Output folder**: all runtime artifacts live under
  `dist/openclaw-food-tracker/`
- **Design docs**: kept in `/docs`, never mixed into the
  final skill artifact
- **Confidence tracking**: every log entry MUST carry a `source`
  and `confidence` field so users can audit estimation quality
- **Progressive disclosure**: `SKILL.md` frontmatter + body
  loaded at activation; `references/` and `assets/` loaded
  on demand only

## Build Workflow

- Prefer small, reviewable steps
- Define schemas and examples before generating artifact text
- Test skill instructions against sample conversations and
  expected outputs before packaging
- Use `CLAUDE.md` as the authoritative runtime guidance file
  for agents working in this repository

## Governance

This constitution supersedes conflicting guidance in any other
project file. Amendments require:

1. A documented rationale for the change
2. Version bump following semver (MAJOR for principle removal
   or redefinition, MINOR for additions, PATCH for wording)
3. Update of this file and propagation to dependent templates

All pull requests and reviews MUST verify compliance with these
principles. Added complexity MUST be justified against
Principle VI (Portability & Simplicity).

**Version**: 1.0.0 | **Ratified**: 2026-03-21 | **Last Amended**: 2026-03-21

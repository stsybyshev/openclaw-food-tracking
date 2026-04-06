# ROADMAP

## Phase 1 — Core Food Logging
- Recognize when a user message is a food tracking request rather than general food conversation
- Process free-form food intake descriptions
- Resolve calories/macros using local cache first, then text estimation, then photo-assisted estimation
- Save each intake into append-only monthly markdown logs
- Respond with current intake totals and today’s aggregate totals

## Phase 2 — Stats
- Produce summaries for today
- Produce weekly and monthly running averages
- Show trends in calorie and macro consumption

## Phase 3 — Dashboard
- Regenerate a dashboard-style HTML summary periodically
- Allow dashboard generation from heartbeat-style scheduled execution
- Support publishing generated HTML to Google Drive / OneDrive for mobile-friendly read-only access

## Phase 4 — Broader Quantified Self
- Extend approach to related trackers such as finance, mood, and habits
- Produce a combined Quantified Self dashboard

## Cross-Cutting Goals
- Keep the skill portable across OpenClaw and potentially Claude Cowork
- Keep the implementation simple, local-first, and human-auditable

#!/usr/bin/env bash
# run-tests.sh — Test harness for the openclaw-food-tracker skill
#
# Usage:
#   export ANTHROPIC_API_KEY=sk-ant-...
#   bash test/run-tests.sh
#
# Options:
#   SKILL_PATH   Path to SKILL.md (default: dist/openclaw-food-tracker/SKILL.md)
#   MODEL        Claude model to use (default: claude-haiku-4-5-20251001 — fast and cheap)
#   ABLATION     Set to "1" to also run each case without the skill (bare model)
#
# Example with options:
#   MODEL=claude-sonnet-4-6 ABLATION=1 bash test/run-tests.sh

set -euo pipefail

SKILL_PATH="${SKILL_PATH:-dist/openclaw-food-tracker/SKILL.md}"
MODEL="${MODEL:-claude-haiku-4-5-20251001}"
ABLATION="${ABLATION:-0}"
CASES_DIR="test/cases"
PASS=0
FAIL=0
SKIP=0

# Colours
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ── Checks ────────────────────────────────────────────────────────────────────

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo -e "${RED}ERROR: ANTHROPIC_API_KEY is not set.${NC}"
  echo "Export your key: export ANTHROPIC_API_KEY=sk-ant-..."
  exit 1
fi

if [[ ! -f "$SKILL_PATH" ]]; then
  echo -e "${YELLOW}SKIP: $SKILL_PATH not found. Skill not yet authored — skipping model tests.${NC}"
  echo "(Scaffold is in place. Author SKILL.md in dist/openclaw-food-tracker/ to enable tests.)"
  exit 0
fi

# ── Helpers ───────────────────────────────────────────────────────────────────

call_api() {
  local system_prompt="$1"
  local user_message="$2"

  # Build the JSON payload. system is empty string if no skill (ablation mode).
  local payload
  if [[ -n "$system_prompt" ]]; then
    payload=$(jq -n \
      --arg model "$MODEL" \
      --arg system "$system_prompt" \
      --arg user "$user_message" \
      '{model: $model, max_tokens: 1024, system: $system, messages: [{role: "user", content: $user}]}')
  else
    payload=$(jq -n \
      --arg model "$MODEL" \
      --arg user "$user_message" \
      '{model: $model, max_tokens: 1024, messages: [{role: "user", content: $user}]}')
  fi

  curl -s https://api.anthropic.com/v1/messages \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "$payload" \
    | jq -r '.content[0].text // "ERROR: no content in response"'
}

extract_input() {
  # Extract the ## Input section from a test case file
  local file="$1"
  awk '/^## Input/{found=1; next} found && /^##/{exit} found{print}' "$file" | sed '/^$/d' | head -5
}

run_case() {
  local case_file="$1"
  local with_skill="$2"   # "1" = with skill, "0" = bare model (ablation)
  local case_name
  case_name=$(basename "$case_file" .md)

  local user_input
  user_input=$(extract_input "$case_file")

  if [[ -z "$user_input" ]]; then
    echo -e "  ${YELLOW}SKIP${NC} $case_name — no ## Input section found"
    ((SKIP++)) || true
    return
  fi

  local system_prompt=""
  local mode_label="[bare]"
  if [[ "$with_skill" == "1" ]]; then
    system_prompt=$(cat "$SKILL_PATH")
    mode_label="[skill]"
  fi

  echo -n "  $mode_label $case_name ... "

  local response
  response=$(call_api "$system_prompt" "$user_input")

  if echo "$response" | grep -qi "ERROR"; then
    echo -e "${RED}FAIL${NC} (API error)"
    echo "    Response: $response"
    ((FAIL++)) || true
  else
    # Basic assertion: response must be non-empty and not an error message
    local char_count=${#response}
    if [[ $char_count -lt 20 ]]; then
      echo -e "${RED}FAIL${NC} (response too short: $char_count chars)"
      ((FAIL++)) || true
    else
      echo -e "${GREEN}PASS${NC} ($char_count chars)"
      # Print first line of response as a preview
      echo "    Preview: $(echo "$response" | head -1 | cut -c1-100)"
      ((PASS++)) || true
    fi
  fi
}

# ── Main ──────────────────────────────────────────────────────────────────────

echo ""
echo "openclaw-food-tracker skill test harness"
echo "  Skill: $SKILL_PATH"
echo "  Model: $MODEL"
echo "  Ablation: $([[ "$ABLATION" == "1" ]] && echo enabled || echo disabled)"
echo ""

SKILL_CONTENT=$(cat "$SKILL_PATH")

echo "── With skill ──────────────────────────────────────────────────────────"
for case_file in "$CASES_DIR"/*.md; do
  run_case "$case_file" "1"
done

if [[ "$ABLATION" == "1" ]]; then
  echo ""
  echo "── Without skill (ablation) ────────────────────────────────────────────"
  for case_file in "$CASES_DIR"/*.md; do
    run_case "$case_file" "0"
  done
fi

echo ""
echo "── Results ─────────────────────────────────────────────────────────────"
echo -e "  ${GREEN}PASS: $PASS${NC}  ${RED}FAIL: $FAIL${NC}  ${YELLOW}SKIP: $SKIP${NC}"
echo ""

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi

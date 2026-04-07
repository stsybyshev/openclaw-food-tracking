#!/usr/bin/env bash
# Quantified Life — Cron installer
# Sets up periodic generation and cloud sync.
#
# Usage:
#   bash scripts/install.sh --install    # add cron jobs
#   bash scripts/install.sh --uninstall  # remove cron jobs
#   bash scripts/install.sh --status     # show current cron jobs
#   bash scripts/install.sh --dry-run    # preview cron entries

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
SKILL_DIR="$REPO_DIR/skills/nutrition-tracker"
CONFIG="$REPO_DIR/portal/assets/config.yaml"

# Cron job markers
MARKER_GENERATE="# ql-nutrition-generate"
MARKER_SYNC="# ql-nutrition-sync"

# Cron entries
CRON_GENERATE="*/30 * * * * cd $SKILL_DIR && uv run --with pyyaml -- python3 dashboard/generate.py --config $CONFIG $MARKER_GENERATE"
CRON_SYNC="2,32 * * * * bash $SCRIPT_DIR/sync.sh $MARKER_SYNC"

case "${1:---status}" in
    --dry-run)
        echo "Would install these cron entries:"
        echo "  $CRON_GENERATE"
        echo "  $CRON_SYNC"
        echo ""
        echo "Generate runs every 30 min. Sync runs 2 min after (offset for generate to finish)."
        ;;
    --install)
        # Remove existing entries first
        (crontab -l 2>/dev/null | grep -v "$MARKER_GENERATE" | grep -v "$MARKER_SYNC") | crontab -

        # Add new entries
        (crontab -l 2>/dev/null; echo "$CRON_GENERATE"; echo "$CRON_SYNC") | crontab -

        echo "Installed cron jobs:"
        crontab -l | grep "ql-nutrition"

        # Check dependencies
        echo ""
        if command -v uv &>/dev/null; then
            echo "OK: uv found"
        else
            echo "WARNING: uv not found — install with: curl -LsSf https://astral.sh/uv/install.sh | sh"
        fi
        if command -v rclone &>/dev/null; then
            echo "OK: rclone found"
        else
            echo "WARNING: rclone not found — sync will fail. Install with: curl https://rclone.org/install.sh | sudo bash"
        fi
        ;;
    --uninstall)
        (crontab -l 2>/dev/null | grep -v "$MARKER_GENERATE" | grep -v "$MARKER_SYNC") | crontab -
        echo "Removed ql-nutrition cron jobs."
        ;;
    --status)
        echo "Current ql-nutrition cron jobs:"
        crontab -l 2>/dev/null | grep "ql-nutrition" || echo "  (none installed)"
        ;;
    *)
        echo "Usage: install.sh [--install|--uninstall|--status|--dry-run]"
        exit 1
        ;;
esac

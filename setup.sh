#!/bin/bash
set -e

SKILLS_DIR="$HOME/.openclaw/workspace/skills"
REPO_SKILLS="$HOME/codespace/personal-finance-tracker/skills"

mkdir -p "$SKILLS_DIR"

echo "Creating symlinks..."

ln -sfn "$REPO_SKILLS/personal-finance-transaction-management" \
  "$SKILLS_DIR/personal-finance-transaction-management"

ln -sfn "$REPO_SKILLS/finance-dashboard" \
  "$SKILLS_DIR/finance-dashboard"

echo "Done. Symlinks created:"
ls -la "$SKILLS_DIR" | grep finance

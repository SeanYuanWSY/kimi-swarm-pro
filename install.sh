#!/bin/bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2025 SeanYuanWSY
set -euo pipefail

# kimi-swarm installer — idempotent, safe to run multiple times
# https://github.com/SeanYuanWSY/kimi-swarm

KIMI_DIR="$HOME/.kimi-code"
AGENTS_DIR="$HOME/.agents/skills"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; }

echo "=== kimi-swarm installer ==="
echo ""

# Step 0: Check Kimi Code is installed
if [ ! -d "$KIMI_DIR" ]; then
  error "Kimi Code directory not found at $KIMI_DIR"
  error "Please install Kimi Code CLI first: https://github.com/MoonshotAI/kimi-code"
  exit 1
fi

# Step 0.5: Check runtime dependencies
if ! command -v node >/dev/null 2>&1; then
  error "node is required for swarm-hook.js but not found in PATH"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  warn "python3 not found in PATH; uninstall.sh will not be able to edit config.toml"
fi

# Step 1: Create skill directory
mkdir -p "$AGENTS_DIR/kimi-swarm"

# Step 2: Copy SKILL.md
if [ -f "$AGENTS_DIR/kimi-swarm/SKILL.md" ]; then
  warn "SKILL.md already exists, overwriting with latest version"
fi
cp "$SCRIPT_DIR/skills/kimi-swarm/SKILL.md" "$AGENTS_DIR/kimi-swarm/SKILL.md"
info "Installed SKILL.md → $AGENTS_DIR/kimi-swarm/SKILL.md"

# Step 3: Create parent directory and symlink in skills-curated
mkdir -p "$KIMI_DIR/skills-curated"
SYMLINK="$KIMI_DIR/skills-curated/kimi-swarm"
if [ -L "$SYMLINK" ]; then
  warn "Symlink already exists at $SYMLINK, recreating"
  rm "$SYMLINK"
elif [ -e "$SYMLINK" ]; then
  error "Non-symlink file or directory already exists at $SYMLINK"
  error "Please remove it manually, then re-run install.sh"
  exit 1
fi
ln -sfn "$AGENTS_DIR/kimi-swarm" "$SYMLINK"
info "Created symlink → $SYMLINK → $AGENTS_DIR/kimi-swarm"

# Step 4: Create scripts directory if needed
mkdir -p "$KIMI_DIR/scripts"

# Step 5: Copy swarm-hook.js
if [ -f "$KIMI_DIR/scripts/swarm-hook.js" ]; then
  warn "swarm-hook.js already exists, overwriting with latest version"
fi
cp "$SCRIPT_DIR/hooks/swarm-hook.js" "$KIMI_DIR/scripts/swarm-hook.js"
chmod +x "$KIMI_DIR/scripts/swarm-hook.js"
info "Installed hook → $KIMI_DIR/scripts/swarm-hook.js"

# Step 6: Register hook in config.toml (idempotent + backup on mutation only)
CONFIG="$KIMI_DIR/config.toml"
if [ ! -f "$CONFIG" ]; then
  warn "config.toml not found, creating one"
  touch "$CONFIG"
  chmod 600 "$CONFIG"
fi

MARKER="# kimi-swarm-hook"
if grep -qF "$MARKER" "$CONFIG" 2>/dev/null; then
  warn "Hook already registered in config.toml, skipping"
else
  # Backup config only when we are about to modify it
  if [ -s "$CONFIG" ]; then
    BACKUP="$CONFIG.kimi-swarm.bak.$(date +%s)"
    cp "$CONFIG" "$BACKUP"
    info "Backed up config.toml → $BACKUP"
  fi

  # Use marker for idempotency; quote the path in case HOME contains spaces
  {
    echo ""
    echo "$MARKER"
    echo "[[hooks]]"
    echo 'event = "UserPromptSubmit"'
    echo "command = \"node '$KIMI_DIR/scripts/swarm-hook.js'\""
    echo 'timeout = 5'
  } >> "$CONFIG"
  info "Registered hook in config.toml"
fi

echo ""
echo "=== Installation complete! ==="
echo ""
echo "Usage:"
echo "  Start a new Kimi Code session and type:"
echo "    /swarm [your task description]"
echo ""
echo "  Or just describe a task with multiple model roles:"
echo "    前端模型负责UI，后端模型负责API，审查模型负责检查"
echo ""
echo "Uninstall:"
echo "  Run ./uninstall.sh"
echo ""

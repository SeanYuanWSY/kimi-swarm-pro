# Contributing to kimi-swarm-pro

Thanks for your interest in improving kimi-swarm-pro!

## How to contribute

1. **Open an issue first** for bug reports, feature ideas, or large changes.
2. **Fork the repo** and create a feature branch.
3. **Keep shell scripts safe and clean**:
   - Run `shellcheck install.sh uninstall.sh` (same command CI runs).
   - Prefer `rm -f` over `rm -rf`; never recursively delete a path that could be a user directory.
   - Backup `~/.kimi-code/config.toml` before editing it.
4. **Test in an isolated environment**:
   - Use a disposable home directory with a minimal `.kimi-code/config.toml`. Do not test installation against your everyday configuration.
   - Run `./install.sh` in that environment.
   - Run `node --check hooks/kimi-fleet-hook.js` to syntax-check the hook.
   - Run `./uninstall.sh` and verify no `kimi-fleet-hook.js` remains in `config.toml`.
5. **Update docs**: If you change behavior, update `README.md` and `CHANGELOG.md` in the same change. For releases, bump `VERSION` and `package.json` `version` together.
6. **Submit a pull request** with a clear description and test notes.

## What belongs in the repo

- `README.md` is the user-facing entry point — keep install/usage accurate there first.
- Docs in the repo must be shareable: no personal absolute paths (e.g. `/Users/<you>/...`), no machine-specific config, no API keys or tokens.
- Working notes, session logs, and temporary plans do not belong in git — keep them under `.ai/` (gitignored) or outside the repo. `skills/kimi-fleet/SKILL.md` is shipped product, not a scratch note.
- Examples and screenshots under `examples/` / docs assets are welcome when they document current behavior.

## Code style

- Bash scripts use `set -euo pipefail`.
- Node.js hook uses strict mode and standard library only.
- SKILL.md is plain Markdown; keep role prompts concise and actionable.

## Reporting security issues

Please see [SECURITY.md](./SECURITY.md).

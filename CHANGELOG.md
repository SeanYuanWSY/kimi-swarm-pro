# Changelog

All notable changes to this project will be documented in this file.

## [0.5.1] - 2026-07-02

### Fixed
- **Critical (Bug #2)**: Provider selection in Step 2 used "one option per provider group" wording, which caused agents to arbitrarily group providers (e.g. "Claude系", "DeepSeek系") and silently omit providers (e.g. `tohoqing-gpt`, `managed:kimi-code`). Changed to "one option per provider (NOT per group — never combine)" and added a "TOP BUG #2 — MISSING PROVIDERS" warning block at the same severity level as the model truncation bug. Added a concrete 8-provider example showing 2 questions × 4 options in one call.

## [0.5.0] - 2026-07-02

### Fixed
- **Critical**: `/swarm` and `/fleet` slash commands were hijacked by the hook's multi-role pattern matcher. `/swarm 前端模型负责UI` would get intercepted into the fleet flow because the regex matched. Added an explicit short-circuit guard in `shouldIntercept()` that returns `false` for any prompt starting with `/swarm` or `/fleet`.
- **High**: Hook had a hardcoded provider list missing `claudecn` and `opencode-go`. Replaced with dynamic `~/.kimi-code/config.toml` parsing via Python `tomllib` — the complete provider/model list is injected at runtime.
- **High**: SKILL.md lacked explicit batching instructions for `AskUserQuestion` (max 4 options per question × 4 questions per call = 16 models). Added `ceil(N/16)` batching algorithm with a concrete 40-model example showing 3 calls.
- **High**: SKILL.md Step 3 had no stop conditions — agents would stop showing models after the first batch. Added explicit stop conditions: all batches shown OR user says "够了".

### Changed
- SKILL.md Step 2 rewritten with "TOP BUG" warning block and detailed batching algorithm.
- SKILL.md provider examples updated: `kimi-code` → `managed:kimi-code`, added `claudecn`.
- Hook instruction Step 3 synced with SKILL.md batching formula.
- LICENSE copyright year corrected from 2025 to 2026.
- CI `action-shellcheck@master` pinned to `@2.0.0` to eliminate supply-chain risk.

## [0.4.0] - 2025-07-01

### Changed
- Installed skill renamed from `kimi-swarm-pro` to `kimi-fleet`.
- Hook renamed from `kimi-swarm-pro-hook.js` to `kimi-fleet-hook.js`.
- `/fleet` is now handled by the `kimi-fleet` skill command instead of hook interception.
- Hook now only intercepts multi-role natural language prompts as a fallback.
- Updated all install/uninstall paths and markers.

## [0.3.0] - 2025-07-01

### Changed
- Renamed project from `kimifleet` to `kimi-swarm-pro`.
- Renamed hook script from `fleet-hook.js` to `kimi-swarm-pro-hook.js`.
- Skill name changed from `kimifleet` to `kimi-swarm-pro` to avoid `/fleet` being recognized as a skill command.
- Updated all paths, symlinks, markers, and backup suffixes.

### Fixed
- `/fleet` no longer appears as a skill command suggestion because the skill name `kimi-swarm-pro` does not fuzzy-match the `/fleet` command.
- `/swarm` continues to pass through to Kimi's native Swarm Mode.

## [0.2.0] - 2025-07-01

### Changed
- Renamed project from `kimi-swarm` to `kimifleet`.
- Renamed hook script from `swarm-hook.js` to `fleet-hook.js`.
- New dual-mode design: `/swarm` passes through to native Kimi Swarm Mode (not intercepted); `/fleet` triggers the full 8-step interactive multi-model configuration flow.
- Renamed command from `/swarm-config` to `/fleet`.
- Updated all paths, symlinks, markers, and backup suffixes.

### Added
- `/swarm` native mode — zero-config, auto task-split, no model selection.
- `/fleet` interactive mode — full provider/model/role/concurrency configuration.

## [0.1.2] - 2025-06-30

### Fixed
- `SKILL.md` API key extraction here-doc syntax error fixed (was a release blocker).
- `SKILL.md` Ollama call no longer uses fragile Perl string interpolation; uses `$ENV` instead.
- `swarm-hook.js` CJK multi-role detection fixed — `\b` word boundaries removed for CJK patterns (was silently failing on Chinese prompts).
- `swarm-hook.js` uses `require("fs")` instead of `require("node:fs")` for broader Node compatibility.
- `uninstall.sh` no longer `rm -rf` follows symlinks for the skill directory.
- `uninstall.sh` hook removal now matches by marker + command field, not substring on any line.
- `install.sh` hook path quoted in config.toml to handle `$HOME` with spaces.
- `install.sh` backup only created when config.toml is actually about to be modified.
- `install.sh` uses `ln -sfn` for safer symlink creation.
- `install.sh` newly-created `config.toml` gets `chmod 600`.
- `SECURITY.md` and `CODE_OF_CONDUCT.md` now have concrete contact channels (GitHub Security Advisories + @SeanYuanWSY).
- `README.md` manual install path uses `$HOME` instead of `/Users/<USER>` placeholder.
- `README.md` adds `git` to requirements list.

### Added
- `package.json` with version metadata and lint scripts.
- `VERSION` file.
- `AUTHORS.md` with maintainer info.
- `.github/ISSUE_TEMPLATE/bug_report.md`.
- `.github/pull_request_template.md`.
- `.github/workflows/ci.yml` — ShellCheck + Node syntax check CI.
- SPDX license headers on all source files.
- `.gitignore` now covers installer backup files.

## [0.1.1] - 2025-06-30

### Fixed
- `install.sh` now creates `~/.kimi-code/skills-curated/` before symlinking.
- `install.sh` checks for `node` and `python3` dependencies before proceeding.
- `install.sh` and `uninstall.sh` back up `~/.kimi-code/config.toml` before editing.
- `uninstall.sh` uses a robust state-machine parser to remove the `[[hooks]]` block.
- Safer removal logic: refuses to `rm -rf` non-symlink paths.
- Hook registration now uses an absolute path instead of `~`.
- `README.md` uses the correct Kimi Code upstream URL and includes full manual-install steps.
- `LICENSE` copyright year corrected to 2025.
- `SKILL.md` no longer recommends passing API keys on the command line.

### Added
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `.gitignore`.

## [0.1.0] - 2025-06-30

- Initial release: interactive multi-model swarm skill and hook for Kimi Code CLI.

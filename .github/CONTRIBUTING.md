# Contributing

1. Open an issue before a large change.
2. Fork the repo and use a feature branch.
3. Keep `install.sh` and `uninstall.sh` safe. Run `shellcheck install.sh uninstall.sh`. Prefer `rm -f` to `rm -rf`, and do not recursively delete a path that might be someone's home directory. Back up `~/.kimi-code/config.toml` before editing it.
4. Test with a disposable home directory and a small `config.toml`. Do not try the installer on the configuration you use every day. Run `./install.sh`, then `node --check hooks/kimi-fleet-hook.js`, then `./uninstall.sh`. The hook path should be gone from `config.toml`.
5. If behavior changes, update `README.md` and `docs/CHANGELOG.md` in the same change. On a release, change the `version` in `package.json`.
6. Open a pull request and say what you tested.

`README.md` is the page people read first. Do not put personal paths, machine-specific config, or tokens in files that are committed. Notes and temporary plans stay in `.ai/`, which is ignored, or outside the repo. `skills/kimi-fleet/SKILL.md` is part of the install, not a scratch note.

Shell scripts use `set -euo pipefail`. The hook uses strict mode and the Node standard library. Keep the role prompts in `SKILL.md` short enough to follow.

Maintainer: [SeanYuanWSY](https://github.com/SeanYuanWSY).

Security reports go to [SECURITY.md](SECURITY.md).

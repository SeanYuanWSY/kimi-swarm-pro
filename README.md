# kimi-swarm-pro

<p align="center">
  <img src="docs/assets/logo.png" alt="kimi-swarm-pro logo" width="72">
</p>

Use Kimi Code's built-in `/swarm` for automatic task splitting, or `/fleet` to choose the models and roles yourself.

<p align="center">
  <a href="docs/assets/overview.webp">
    <img src="docs/assets/overview.webp" alt="Swarm splits a task automatically; Fleet asks for models and roles." width="800">
  </a>
</p>

## Requirements

- [Kimi Code](https://github.com/MoonshotAI/kimi-code), with at least two models in `~/.kimi-code/config.toml`
- Git, Node.js 18 or newer, and Python 3
- Python 3.11 or newer is recommended. On older versions, install `tomli` so the hook can read TOML.
- `curl` for API providers. The Ollama examples also use `ollama` and `perl`.

The installer and examples were tested with Kimi Code around version 0.20. Newer CLI releases have not been verified.

## Install

```bash
git clone https://github.com/SeanYuanWSY/kimi-swarm-pro.git
cd kimi-swarm-pro
./install.sh
```

The installer:

- copies the skill to `~/.agents/skills/kimi-fleet/`;
- links it into `~/.kimi-code/skills-curated/`;
- copies the prompt hook to `~/.kimi-code/scripts/`;
- registers the hook in `~/.kimi-code/config.toml`.

Existing skill and hook files are replaced without backups. Before changing an existing `config.toml`, the installer saves `config.toml.kimi-fleet.bak.<timestamp>`. If the skill link is already a normal file or directory, installation stops instead of replacing it.

Start a new Kimi Code session after installation.

## Use

```text
/swarm 设计一个登录页面
```

Kimi Code handles `/swarm` itself. This project does not intercept it.

```text
/fleet 设计一个登录页面，前端模型负责UI，后端模型负责API
```

Fleet asks you to select providers and models, assign roles, and set optional concurrency limits before launching anything. A natural-language prompt such as `前端模型负责UI，后端模型负责API` starts the same flow.

## Uninstall

```bash
./uninstall.sh
```

This removes the installed skill, link, hook, and hook registration. Configuration backups are kept.

## Demo

https://github.com/user-attachments/assets/61a58696-9cf0-4a22-a7c2-1f12eae1df9b

A 105-second Fleet recording that ends with a generated 3D todo app. It was recorded in an older Kimi Code session.

## Examples

- [Frontend, backend, then review](examples/example-frontend-backend.md)
- [Three research tasks, then synthesis](examples/example-research.md)

## Repository layout

| Path | Contents |
|---|---|
| `skills/kimi-fleet/` | Fleet skill and model-calling instructions |
| `hooks/` | Natural-language prompt hook |
| `examples/` | Two staged Fleet walkthroughs |
| `docs/assets/` | Logo and overview image |
| `install.sh`, `uninstall.sh` | Setup and removal |

See [Contributing](.github/CONTRIBUTING.md) for checks and development notes. For security reports, use the [security policy](.github/SECURITY.md) rather than a public issue.

MIT. Maintainer: [SeanYuanWSY](https://github.com/SeanYuanWSY).

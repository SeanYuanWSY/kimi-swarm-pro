<div align="center">
  <img src="docs/assets/logo.png" alt="kimi-swarm-pro logo" width="72">
  <h1>kimi-swarm-pro</h1>
  <p>
    Multi-model collaboration for <a href="https://github.com/MoonshotAI/kimi-code">Kimi Code CLI</a> — installs the <code>kimi-fleet</code> skill.<br>
    双模式：<code>/swarm</code> 走原生轻量蜂群，<code>/fleet</code> 走完整交互式多模型配置。
  </p>
</div>

<p align="center">
  <a href="docs/assets/overview.webp">
    <img src="docs/assets/overview.webp" alt="Two modes — /swarm auto-orchestrates subagents; /fleet picks models, roles, and limits. Open the diagram to view it full size." width="800">
  </a>
</p>

## Choose a Mode

| Command | Choose it for |
|---|---|
| `/swarm [task]` | Automatic orchestration by the CLI. |
| `/fleet [task]` | Model selection, role assignment, and provider limits. |

A natural-language multi-role prompt (e.g. `前端模型负责UI，后端模型负责API`) also triggers the `/fleet` flow without the slash command — see [How the Hook Works](#how-the-hook-works).

## Demo Preview

![Static preview — demo screenshot from the 105-second Fleet demonstration, showing the generated 3D todo app](docs/assets/demo-preview.jpg)

*Static preview — one frame from the 105-second Fleet demo; the generated 3D todo app. No public video link is available.*

## Requirements

| Dependency | Why |
|---|---|
| `git` | Clone this repo |
| [Kimi Code CLI](https://github.com/MoonshotAI/kimi-code) | The host CLI — see compatibility note below |
| `node` ≥ 18 | Runs `kimi-fleet-hook.js` (standard library only) |
| `python3` | Hook parses `config.toml`; install/uninstall edit it safely |
| ≥ 2 configured models | Required for `/fleet`; they come from **your** `~/.kimi-code/config.toml` |

**Python:** 3.11+ recommended. The hook itself can fall back to `tomli` on older Pythons; if no TOML parse succeeds at all, it still injects the override but without the pre-parsed model list, and tells the agent to read `config.toml` itself. The subagent API-calling examples in the skill use stdlib `tomllib` directly and need 3.11+.

**CLI compatibility:** this integration was originally built against Kimi Code 0.20-era APIs (native Swarm Mode, `AgentSwarm`, `UserPromptSubmit` hooks, `skills-curated`). Compatibility with the current CLI is not verified. `/swarm` relies entirely on the CLI's built-in implementation.

**Runtime-only extras** (used by fleet subagents, not by the installer):

- `curl` + `python3` — for subagents that call API-based providers.
- `ollama` + `perl` — for subagents assigned `ollama-cloud/…` models (perl `alarm` is the portable timeout on Linux and macOS).

## Install

```bash
git clone https://github.com/SeanYuanWSY/kimi-swarm-pro.git
cd kimi-swarm-pro
./install.sh
```

Then start a new Kimi Code session. Review the script first if you like — it is short.

### What the installer changes

| Installed path | Role | Overwrite / backup behavior |
|---|---|---|
| `~/.agents/skills/kimi-fleet/SKILL.md` | The skill: role prompts, the fleet flow, model-calling recipes | Overwritten in place; no backup |
| `~/.kimi-code/scripts/kimi-fleet-hook.js` | Fallback interceptor for multi-role natural language | Overwritten in place; no backup |
| `~/.kimi-code/skills-curated/kimi-fleet` | Symlink to the skill dir; makes the CLI load the skill | **Refuses to proceed** if a real (non-symlink) file or directory occupies the path |
| `~/.kimi-code/config.toml` | A `[[hooks]]` entry registers the hook on `UserPromptSubmit` | Appended only if not already registered; backed up to `config.toml.kimi-fleet.bak.<timestamp>` before modification |

The install script is the supported path — no manual TOML or symlink steps are documented.

## Usage

### `/swarm` — native mode

```
/swarm 设计一个登录页面
```

Not intercepted, not configured. The CLI's own Swarm Mode handles decomposition, subagents, and synthesis.

### `/fleet` — interactive mode

```
/fleet 设计一个登录页面，前端模型负责UI，后端模型负责API，审查模型负责检查
```

The skill walks you through the interactive flow. Everything it shows — providers, models, counts — must come from your `config.toml` (pre-parsed and injected by the hook, or parsed by the agent as a fallback); the skill is designed to offer only models that actually exist in your config.

### Multi-role natural language (no slash command)

```
前端模型负责UI组件，后端模型负责API设计，安全模型负责审查JWT
```

The hook intercepts prompts like this and injects an override that forces the same interactive flow.

### How the Hook Works

`hooks/kimi-fleet-hook.js` runs on `UserPromptSubmit`:

1. If the prompt starts with `/swarm` or `/fleet` (any case), it exits silently — **slash commands always pass through**.
2. Otherwise it checks for multi-role patterns. This is a **conservative pattern match, not full NLP**: it only fires on specific role-assignment phrasing — e.g. `前端模型负责…`, `模型负责`, `审查模型`, or English `frontend model` / `backend model` / `model for frontend`. Plain prompts, and prompts that merely *mention* a model, pass through.
3. On a match it parses `config.toml` via `python3` and injects the complete provider/model list plus the fleet instruction, so the agent enters the same flow `/fleet` would start.

## Uninstall

```bash
./uninstall.sh
```

Removes the symlink, the skill directory, the hook script, and the `[[hooks]]` registration block. Config backups (`config.toml.kimi-fleet.bak.*`) are left in place — delete them yourself if you don't want them.

## Examples

Full walkthroughs with the expected questions at each step:

- [Frontend + Backend + Review](./examples/example-frontend-backend.md) — three-model login page
- [Multi-dimensional Research](./examples/example-research.md) — four-model research fleet

## Maintenance

```bash
node --check hooks/kimi-fleet-hook.js   # hook syntax check
shellcheck install.sh uninstall.sh      # optional, same as CI
```

Contributions welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for the rules (issues first, no personal paths in docs, backup-before-edit). Security reports: [SECURITY.md](./SECURITY.md).

## License

MIT © [SeanYuanWSY](https://github.com/SeanYuanWSY)

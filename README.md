# 🐝 kimi-swarm

**Interactive multi-model swarm for Kimi Code CLI.**

Every time you start a task, pick which models to use and what role each plays — no preset mappings, fully flexible per task.

> 每次任务开始时，交互式选择模型和角色，灵活适配模型迭代和工作流变化。

---

## Features

- **Interactive model selection** — Pick from ALL models in your `config.toml`, across multiple providers (Ollama Cloud, Kimi, DeepSeek, Z.ai, OpenCode)
- **Per-task role assignment** — 6 built-in roles (frontend, backend, review, research, cheap-task, synthesize) + custom
- **Multi-provider support** — Select models from different providers in the same swarm
- **Fresh design every time** — No persistent role mapping; adapt as models update
- **Hook-based interception** — Overrides Kimi Code's built-in Swarm Mode auto-launch

## Requirements

- `git` (to clone this repository)
- [Kimi Code CLI](https://github.com/MoonshotAI/kimi-code) 0.20+
- At least 2 models configured in `~/.kimi-code/config.toml`
- `node` ≥ 18 (for the hook) and `python3` (for safe `config.toml` editing) in PATH

## Quick Start

> **Safety note:** `install.sh` writes files into `~/.kimi-code` and `~/.agents`. It backs up `config.toml` before editing, but you should still review the script before running it.

```bash
git clone https://github.com/SeanYuanWSY/kimi-swarm.git
cd kimi-swarm
./install.sh
```

Then start a new Kimi Code session and type:

```
/swarm 设计一个登录页面，前端模型负责UI，后端模型负责API，审查模型负责检查
```

The agent will:
1. Confirm the task
2. Ask which providers to browse (multi-select)
3. Show models from selected providers (multi-select)
4. Ask you to assign a role + custom instructions per model
5. Launch parallel subagents, each calling its assigned model
6. Synthesize all outputs into a final report

## Manual Installation

If you prefer to understand each step:

```bash
# 1. Create skill directory
mkdir -p ~/.agents/skills/kimi-swarm
cp skills/kimi-swarm/SKILL.md ~/.agents/skills/kimi-swarm/SKILL.md

# 2. Create parent directory and symlink for Kimi Code to load the skill
mkdir -p ~/.kimi-code/skills-curated
ln -s ~/.agents/skills/kimi-swarm ~/.kimi-code/skills-curated/kimi-swarm

# 3. Install the hook script
mkdir -p ~/.kimi-code/scripts
cp hooks/swarm-hook.js ~/.kimi-code/scripts/swarm-hook.js
chmod +x ~/.kimi-code/scripts/swarm-hook.js

# 4. Register the hook in config.toml
# Add this block to ~/.kimi-code/config.toml.
# The marker comment is required for uninstall.sh to find and remove it.
# Replace /home/yourname with the output of `echo $HOME`:
# kimi-swarm-hook
[[hooks]]
event = "UserPromptSubmit"
command = "node $HOME/.kimi-code/scripts/swarm-hook.js"
timeout = 5
```

## Usage

### Basic

```
/swarm [task description]
```

### With role hints

```
/swarm 设计一个企业级后台系统，前端模型负责UI组件，后端模型负责API设计，安全模型负责审查JWT
```

### Without /swarm prefix (Swarm Mode auto-detected)

If Kimi Code's built-in Swarm Mode is active, you can just type a task with multi-role language and the hook will intercept it.

## How It Works

```
┌─────────────────────────────────────────────────┐
│                 User Input                        │
│              /swarm [task]                        │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │  swarm-hook.js     │  UserPromptSubmit hook
         │  intercepts prompt │  detects /swarm or multi-role
         └─────────┬──────────┘
                   │ injects CRITICAL OVERRIDE
         ┌─────────▼──────────┐
         │  Agent reads       │
         │  SKILL.md          │  Skill loaded via symlink
         │  + hook instruction│
         └─────────┬──────────┘
                   │
    ┌──────────────▼───────────────┐
    │   Interactive Selection       │
    │   1. Confirm task             │
    │   2. Pick providers (multi)   │
    │   3. Pick models (multi)      │
    │   4. Assign roles + instrs    │
    └──────────────┬───────────────┘
                   │
    ┌──────────────▼───────────────┐
    │   AgentSwarm launched         │
    │   Each subagent calls its     │
    │   assigned model via Bash     │
    └──────────────┬───────────────┘
                   │
    ┌──────────────▼───────────────┐
    │   Parent synthesizes          │
    │   all outputs → final report  │
    └──────────────────────────────┘
```

**Three components:**

| Component | Path | Role |
|---|---|---|
| SKILL.md | `~/.agents/skills/kimi-swarm/SKILL.md` | Knowledge: role prompts, model calling patterns, output format |
| swarm-hook.js | `~/.kimi-code/scripts/swarm-hook.js` | Interceptor: forces interactive model selection before launch |
| config.toml | `~/.kimi-code/config.toml` | Registration: `[[hooks]]` entry for UserPromptSubmit |

## Built-in Roles

| Role | Use case | Output focus |
|---|---|---|
| `frontend` | UI/UX, components, CSS | Visual design, code structure |
| `backend` | API, DB, services | Endpoints, schema, security |
| `review` | Code review, audit | Bugs, risks, alternatives |
| `research` | Investigation, search | Evidence, sources, trade-offs |
| `cheap-task` | Summarization, formatting | Speed over depth |
| `synthesize` | Integration | Coherent final answer |
| custom | User-defined | Anything you want |

## Examples

See [`examples/`](./examples) for complete walkthroughs:
- [Frontend + Backend + Review](./examples/example-frontend-backend.md) — Three-model collaboration for a login page
- [Multi-dimensional Research](./examples/example-research.md) — Four-model research swarm

## Uninstall

```bash
./uninstall.sh
```

This removes the skill, symlink, hook script, and config.toml registration.

## License

MIT © [SeanYuanWSY](https://github.com/SeanYuanWSY)
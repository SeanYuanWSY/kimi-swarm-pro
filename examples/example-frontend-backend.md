# Example: Frontend + Backend + Review

## Task

```markdown
/fleet 设计一个登录页面，前端模型负责UI组件和样式，后端模型负责API和数据库设计，审查模型负责检查安全和性能问题
```

> **Dual-mode note:** This example uses `/fleet` for explicit model selection and role assignment. For a zero-config native swarm, use `/swarm` instead — the agent will auto-split the task without asking you to pick models.

## Interactive Flow

### Step 1: Confirm
```
Agent: 我要为以下任务启动多模型协作：设计一个登录页面。是否继续？
User:  继续，让我选模型
```

### Step 2: Select providers
```
Agent: 选择要浏览的 provider（可多选）：
User:  ollama-cloud + deepseek
```

### Step 3: Select models
```
Agent: 从 ollama-cloud 和 deepseek 中选择模型：
       (GLM-5.2 (ollama-cloud) / DeepSeek-V4-Pro (deepseek) / MiniMax-M3 (ollama-cloud) / ...)
User:  GLM-5.2 + DeepSeek-V4-Pro + MiniMax-M3
```

### Step 4: Assign roles + custom instructions
```
Agent: GLM-5.2 (ollama-cloud) 担任什么角色？有什么自定义指令？
User:  角色：frontend。指令：专注组件结构和 Tailwind 样式

Agent: DeepSeek-V4-Pro (deepseek) 担任什么角色？有什么自定义指令？
User:  角色：backend。指令：用默认

Agent: MiniMax-M3 (ollama-cloud) 担任什么角色？有什么自定义指令？
User:  角色：review。指令：重点检查 JWT 安全和性能瓶颈
```

### Step 5: Concurrency limits
```
Agent: 是否需要为某些 provider 设置最大并发数？
       (Ollama Cloud 订阅可能限制并发数)
User:  ollama-cloud 设为 2，deepseek 不限制
```

The `ollama-cloud → 2` limit only controls batching *within* a ready wave: at most 2 of that provider's items run at once. It does not create or skip task dependencies — the review item needs both designs' actual outputs, so it runs in a later call no matter how much concurrency headroom remains.

### Step 6: Build frontend + backend items only

Each item is a plain readable sentence — no delimiter-separated format. (Model names below are illustrative; the real list comes from the user's config.toml.)

Only the two independent design items are created now. No review item exists yet: its task must embed the actual returned frontend and backend outputs, which do not exist at this point. Each item asks its subagent to tag its report with a 主题 line, so the parent can match results to sources by reading them instead of guessing positions.

```text
# Pseudocode — illustrates the tool calls and data flow, NOT a runnable CLI program.

design_items = [
  "Your model is ollama-cloud/glm-5.2. Your role is frontend. Your instruction is: 专注组件结构和 Tailwind 样式. Your task is: 设计一个登录页面的前端。在报告开头标注主题：前端设计.",
  "Your model is deepseek/deepseek-v4-pro. Your role is backend. Your instruction is: You are a backend specialist. Focus on API design, database schema, service boundaries, performance, and security. Provide concrete endpoints and data models. Your task is: 设计一个登录页面的后端 API 和数据库。在报告开头标注主题：后端设计.",
]
```

Note: DeepSeek-V4-Pro's user answered "用默认", so its item carries the full `backend` default prompt from SKILL.md's Role System Prompts — not a placeholder like "Use default".

### Step 7: Run AgentSwarm in two staged calls

```text
# Pseudocode — illustrates the tool calls and data flow, NOT a runnable CLI program.

# Confirmed inputs the parent agent already holds:
#   design_items     — built in Step 6
#   prompt_template  — the "AgentSwarm Prompt Template" text from SKILL.md,
#                      passed to both calls (subagents render {{item}} from it)

# ── Call 1: the two independent design items ──
# Provider limits apply inside this call: ollama-cloud may run at most 2 of its
# items at once, deepseek is unlimited. This call has 1 ollama-cloud item +
# 1 deepseek item, so both fit the limits and run in parallel in one call.
call1_result = AgentSwarm(
  description     = "login-page-design",
  subagent_type   = "coder",
  prompt_template = prompt_template,
  items           = design_items,
)
# The parent agent waits for the call to finish and reads the actual tool
# return — two structured reports. Each report self-identifies via the
# required 主题 line and its own Model field, so the parent matches them by
# reading, never by guessing array order:
#   主题: 前端设计 / Model: ollama-cloud/glm-5.2    → frontend_report
#   主题: 后端设计 / Model: deepseek/deepseek-v4-pro → backend_report
# If one report is missing or failed, the parent stops and reports the gap
# (see Step 8) — it does not build the review item on partial input.

# ── Parent builds the review item from the REAL returned outputs ──
# Do not assume a subagent has automatic access to earlier items' outputs —
# the parent explicitly embeds each complete returned report verbatim,
# labeled with its source model.
# frontend_report and backend_report are the full texts the parent
# extracted from call1_result above.
review_item = (
  "Your model is ollama-cloud/minimax-m3. "
  "Your role is review. "
  "Your instruction is: 重点检查 JWT 安全和性能瓶颈. "
  "Your task is: 审查以下登录页面设计的安全和性能。\n\n"
  + "## 前端设计输出 — 来源模型: ollama-cloud/glm-5.2\n" + frontend_report
  + "\n\n## 后端设计输出 — 来源模型: deepseek/deepseek-v4-pro\n" + backend_report
)

# ── Call 2: the review item alone, after both designs returned ──
# The ollama-cloud limit (2) still applies here — trivially satisfied by
# this single item — and provider limits never pull a dependent item
# forward into an earlier wave.
call2_result = AgentSwarm(
  description     = "login-page-review",
  subagent_type   = "coder",
  prompt_template = prompt_template,
  items           = [review_item],
)
```

Sequence, end to end:
- **Call 1** → **GLM-5.2** designs the frontend (components + Tailwind styling) and **DeepSeek-V4-Pro** designs the backend (endpoints + data model) — in parallel, since both items are independent and each provider is inside its recorded limit.
- **Parent agent** → waits for both structured reports, then builds `review_item` embedding each complete output verbatim with its source-model label.
- **Call 2** → **MiniMax-M3** runs alone and reviews the two embedded designs for JWT security and performance bottlenecks.

### Step 8: Verify and deliver

The parent agent first checks `call2_result` — that the review actually examined both labeled design sections — then delivers the final design document:
- Frontend code
- Backend API spec
- Security review notes
- Performance recommendations

If an upstream call fails or an output comes back empty, the parent does **not** ship a review of designs it never received and does not silently launch the review over nothing. It reports the gap — which side's output is missing — and lets the user decide whether to accept a partial review built from the output that did return. No automatic retry or extra scheduling is added.
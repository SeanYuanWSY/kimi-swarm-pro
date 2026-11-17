# Example: Multi-dimensional Research

## Task

```markdown
/fleet 调研：AI在药物发现领域的最新进展，需要从技术、临床、商业三个维度分析
```

> **Dual-mode note:** This example uses `/fleet` for explicit model selection and role assignment. For a zero-config native swarm, use `/swarm` instead — the agent will auto-split the task without asking you to pick models.

## Interactive Flow

### Step 1: Confirm
```
Agent: 我要为以下任务启动多模型协作：调研AI药物发现最新进展。是否继续？
User:  继续，让我选模型
```

### Step 2: Select providers
```
Agent: 选择要浏览的 provider（可多选）：
User:  ollama-cloud + managed:kimi-code
```

### Step 3: Select models
```
Agent: 从 ollama-cloud 和 managed:kimi-code 中选择模型：
       (DeepSeek-V4-Pro (ollama-cloud) / GLM-5.2 (ollama-cloud) / MiniMax-M3 (ollama-cloud) / Kimi-K2.7-Code (managed:kimi-code) / ...)
User:  DeepSeek-V4-Pro + GLM-5.2 + MiniMax-M3 + Kimi-K2.7-Code
```

### Step 4: Assign roles + custom instructions
```
Agent: DeepSeek-V4-Pro (ollama-cloud) 担任什么角色？有什么自定义指令？
User:  角色：research。指令：聚焦技术维度，搜索最新论文和模型

Agent: GLM-5.2 (ollama-cloud) 担任什么角色？有什么自定义指令？
User:  角色：research。指令：聚焦临床维度，搜索临床试验和 FDA 批准

Agent: MiniMax-M3 (ollama-cloud) 担任什么角色？有什么自定义指令？
User:  角色：research。指令：聚焦商业维度，搜索市场趋势和融资

Agent: Kimi-K2.7-Code (managed:kimi-code) 担任什么角色？有什么自定义指令？
User:  角色：synthesize。指令：用默认
```

### Step 5: Concurrency limits
```
Agent: 是否需要为某些 provider 设置最大并发数？
User:  不设置，全部并行
```

"不设置，全部并行" only lifts the *provider rate cap*: every item that is already independent and ready launches in the same batch. It does **not** override task dependencies — an item that needs an earlier item's output still waits for that output, and the synthesize item is such an item.

### Step 6: Build research items only

Each item is a plain readable sentence — no delimiter-separated format. (Model names below are illustrative; the real list comes from the user's config.toml.)

Only the three independent research items are created now. No synthesize item exists yet: its task must embed the actual returned research outputs, which do not exist at this point. Each item asks its subagent to tag its report with a 主题 line, so the parent can match results to sources by reading them instead of guessing positions.

```text
# Pseudocode — illustrates the tool calls and data flow, NOT a runnable CLI program.

research_items = [
  "Your model is ollama-cloud/deepseek-v4-pro. Your role is research. Your instruction is: 聚焦技术维度，搜索最新论文和模型. Your task is: 调研AI药物发现的技术维度。在报告开头标注主题：技术维度.",
  "Your model is ollama-cloud/glm-5.2. Your role is research. Your instruction is: 聚焦临床维度，搜索临床试验和 FDA 批准. Your task is: 调研AI药物发现的临床维度。在报告开头标注主题：临床维度.",
  "Your model is ollama-cloud/minimax-m3. Your role is research. Your instruction is: 聚焦商业维度，搜索市场趋势和融资. Your task is: 调研AI药物发现的商业维度。在报告开头标注主题：商业维度.",
]
```

### Step 7: Run AgentSwarm in two staged calls

```text
# Pseudocode — illustrates the tool calls and data flow, NOT a runnable CLI program.

# Confirmed inputs the parent agent already holds:
#   research_items   — built in Step 6
#   prompt_template  — the "AgentSwarm Prompt Template" text from SKILL.md,
#                      passed to both calls (subagents render {{item}} from it)

# ── Call 1: three independent research items in parallel ──
call1_result = AgentSwarm(
  description     = "ai-drug-discovery-research",
  subagent_type   = "coder",
  prompt_template = prompt_template,
  items           = research_items,
)
# The parent agent waits for the call to finish and reads the actual tool
# return — three structured reports. Each report self-identifies via the
# required 主题 line and its own Model field, so the parent matches them to
# dimensions by reading, never by guessing array order:
#   主题: 技术维度 / Model: ollama-cloud/deepseek-v4-pro → technical_report
#   主题: 临床维度 / Model: ollama-cloud/glm-5.2         → clinical_report
#   主题: 商业维度 / Model: ollama-cloud/minimax-m3      → commercial_report
# If one report is missing or failed, the parent stops and reports the gap
# (see Step 8) — it does not build the synthesize item on partial input.

# ── Parent builds the synthesize item from the REAL returned outputs ──
# Do not assume a subagent has automatic access to earlier items' outputs —
# the parent explicitly embeds each complete returned report verbatim,
# labeled with its dimension and source model.
# technical_report, clinical_report, commercial_report are the full texts
# the parent extracted from call1_result above.
synthesize_item = (
  "Your model is managed:kimi-code/kimi-k2.7-code. "
  "Your role is synthesize. "
  "Your instruction is: You are an integration specialist. Read the outputs from the other agents and produce one coherent final answer that resolves conflicts and preserves the best ideas. "
  "Your task is: 综合以下三个维度的调研结果，输出完整报告。\n\n"
  + "## 技术维度研究输出 — 来源模型: ollama-cloud/deepseek-v4-pro\n" + technical_report
  + "\n\n## 临床维度研究输出 — 来源模型: ollama-cloud/glm-5.2\n" + clinical_report
  + "\n\n## 商业维度研究输出 — 来源模型: ollama-cloud/minimax-m3\n" + commercial_report
)

# ── Call 2: the synthesize item alone, after all research returned ──
call2_result = AgentSwarm(
  description     = "ai-drug-discovery-synthesis",
  subagent_type   = "coder",
  prompt_template = prompt_template,
  items           = [synthesize_item],
)
```

Sequence, end to end:
- **Call 1** → **DeepSeek-V4-Pro** searches for latest AI drug discovery papers and models, **GLM-5.2** searches for clinical trial results and FDA approvals, **MiniMax-M3** searches for market trends, funding, and company landscape — all in parallel, since no provider limits were set and the three items are independent.
- **Parent agent** → waits for all three structured reports, then builds `synthesize_item` embedding each complete output verbatim with its dimension and source-model label.
- **Call 2** → **Kimi-K2.7-Code** runs alone and synthesizes the embedded reports into one document.

Note: Kimi-K2.7-Code's user answered "用默认" in Step 4, so `synthesize_item`'s instruction carries the full `synthesize` default prompt from SKILL.md's Role System Prompts verbatim — not a placeholder like "Use default". The instruction says "Read the outputs from the other agents"; since automatic access to other items' outputs is not assumed, the parent fulfills that by pasting the complete returned outputs into the task text.

### Step 8: Verify and deliver

The parent agent first checks `call2_result` — that the synthesis actually used all three labeled sections — then delivers the integrated report:
- Technical landscape (models, methods, benchmarks)
- Clinical progress (trials, approvals, real-world results)
- Commercial outlook (market size, key players, investment trends)
- Cross-dimensional insights and recommendations

If an upstream call fails or an output comes back empty, the parent does **not** ship a fabricated "complete" report and does not silently launch synthesis over nothing. It reports the gap — which dimension's result is missing — and lets the user decide whether to accept a partial synthesis built from the outputs that did return. No automatic retry or extra scheduling is added.
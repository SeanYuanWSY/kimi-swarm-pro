# Example: Three research tasks, then synthesis

## Task

```text
/fleet 调研：AI在药物发现领域的最新进展，需要从技术、临床、商业三个维度分析
```

After the normal Fleet selection flow, this example uses the following illustrative assignments:

| Model | Role | Instruction |
|---|---|---|
| `ollama-cloud/deepseek-v4-pro` | research | Technical progress; recent papers and models |
| `ollama-cloud/glm-5.2` | research | Clinical trials and FDA approvals |
| `ollama-cloud/minimax-m3` | research | Market trends and financing |
| `managed:kimi-code/kimi-k2.7-code` | synthesize | Use the full default synthesize prompt |

No provider concurrency limit is set. Task dependencies still apply.

## 1. Run the independent research

```text
research_items = [
  "Your model is ollama-cloud/deepseek-v4-pro. Your role is research. Your instruction is: Focus on recent papers and models. Your task is: Research technical progress in AI drug discovery.",
  "Your model is ollama-cloud/glm-5.2. Your role is research. Your instruction is: Focus on clinical trials and FDA approvals. Your task is: Research clinical progress in AI drug discovery.",
  "Your model is ollama-cloud/minimax-m3. Your role is research. Your instruction is: Focus on market trends and financing. Your task is: Research the commercial landscape for AI drug discovery.",
]

call1_result = AgentSwarm(
  description="ai-drug-discovery-research",
  subagent_type="coder",
  prompt_template=prompt_template,
  items=research_items,
)
```

The three research items are independent, so they run together. Match each returned report to its dimension by reading its Model and task content.

## 2. Build and run the dependent synthesis

After all three reports return, embed their complete text in the synthesis item:

```text
synthesize_item = (
  "Your model is managed:kimi-code/kimi-k2.7-code. "
  "Your role is synthesize. "
  "Your instruction is: You are an integration specialist. Read the outputs from the other agents and produce one coherent final response that resolves conflicts and preserves the best ideas. "
  "Your task is: Synthesize the technical, clinical, and commercial findings.\n\n"
  + "## Technical — source: ollama-cloud/deepseek-v4-pro\n" + technical_report
  + "\n\n## Clinical — source: ollama-cloud/glm-5.2\n" + clinical_report
  + "\n\n## Commercial — source: ollama-cloud/minimax-m3\n" + commercial_report
)

call2_result = AgentSwarm(
  description="ai-drug-discovery-synthesis",
  subagent_type="coder",
  prompt_template=prompt_template,
  items=[synthesize_item],
)
```

`不设置，全部并行` applies only to ready work. It does not let synthesis start before the research it must read.

## 3. Deliver the result

Verify that the synthesis used all three labeled reports, then deliver the integrated technical, clinical, and commercial findings, including conflicts and open questions.

If a research report is missing or unusable, identify that dimension before synthesis. Ask whether to continue with the available evidence or cancel the synthesis; do not present a partial result as complete coverage.

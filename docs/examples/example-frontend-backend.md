# Example: Frontend, backend, then review

## Task

```text
/fleet 设计一个登录页面，前端模型负责UI组件和样式，后端模型负责API和数据库设计，审查模型负责检查安全和性能问题
```

Fleet still asks for confirmation, providers, models, roles, and instructions. The models below are illustrative; actual choices come from the user's `config.toml`.

| Model | Role | Instruction |
|---|---|---|
| `ollama-cloud/glm-5.2` | frontend | Focus on component structure and Tailwind styling |
| `deepseek/deepseek-v4-pro` | backend | Use the full default backend prompt |
| `ollama-cloud/minimax-m3` | review | Check JWT security and performance |

For this example, Ollama Cloud has a concurrency limit of two; DeepSeek is unlimited.

## 1. Run the independent designs

Build only the frontend and backend items now. The review item cannot exist yet because it needs both actual design reports.

```text
design_items = [
  "Your model is ollama-cloud/glm-5.2. Your role is frontend. Your instruction is: Focus on component structure and Tailwind styling. Your task is: Design the login page frontend.",
  "Your model is deepseek/deepseek-v4-pro. Your role is backend. Your instruction is: You are a backend specialist. Focus on API design, database schema, service boundaries, performance, and security. Provide concrete endpoints and data models. Your task is: Design the login page backend API and database.",
]

call1_result = AgentSwarm(
  description="login-page-design",
  subagent_type="coder",
  prompt_template=prompt_template,
  items=design_items,
)
```

Both items are independent and fit their provider limits, so they run together. Match the returned reports by their Model and Role fields, not by array position.

## 2. Build and run the dependent review

After both designs return, embed each complete report and its source model in the review item:

```text
review_item = (
  "Your model is ollama-cloud/minimax-m3. "
  "Your role is review. "
  "Your instruction is: Check JWT security and performance bottlenecks. "
  "Your task is: Review the following login page design.\n\n"
  + "## Frontend — source: ollama-cloud/glm-5.2\n" + frontend_report
  + "\n\n## Backend — source: deepseek/deepseek-v4-pro\n" + backend_report
)

call2_result = AgentSwarm(
  description="login-page-review",
  subagent_type="coder",
  prompt_template=prompt_template,
  items=[review_item],
)
```

The review always waits for both designs. Provider concurrency controls batches within a stage; it never moves review into the design stage.

## 3. Deliver the result

Confirm that the review addressed both labeled design sections, then deliver:

- frontend code;
- backend API and data model;
- JWT security findings;
- performance recommendations.

If either design report is missing or unusable, stop before the review and identify the gap. Ask whether to review the partial design or omit the review rather than claiming that both designs were evaluated.

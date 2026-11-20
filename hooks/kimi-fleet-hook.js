#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2025 SeanYuanWSY
"use strict";

/**
 * Intercept natural-language multi-role prompts and start the kimi-fleet flow.
 * Explicit /swarm and /fleet commands handle themselves.
 */

const fs = require("fs");
const { execSync } = require("child_process");

function isMultiRolePrompt(prompt) {
  // Word boundaries are unreliable around CJK text.
  const cjkRoles = /(前端模型|后端模型|审查模型|安全模型|性能模型|审美模型|研究模型)/iu;
  const cjkAssign = /(模型负责|模型做|模型来处理|模型承担)/iu;

  // Generic English words such as "review" and "research" cause false positives.
  const engRoles = /\b(cheap[\s\-_]?task|frontend|backend)\s+model(s)?\b/iu;
  const engAssign = /\bmodel(s)?\s+for\s+(frontend|backend|cheap[\s\-_]?task)\b/iu;

  return cjkRoles.test(prompt) || cjkAssign.test(prompt) || engRoles.test(prompt) || engAssign.test(prompt);
}

function shouldIntercept(prompt) {
  if (/^\s*\/(swarm|fleet)\b/iu.test(prompt)) return false;
  return isMultiRolePrompt(prompt);
}

function parseModelsFromConfig() {
  const pyScript = `
try:
    import tomllib  # Python 3.11+
except ImportError:
    import tomli as tomllib
import json, os, sys
path = os.path.expanduser("~/.kimi-code/config.toml")
if not os.path.exists(path):
    print(json.dumps({"error": "config.toml not found"}))
    sys.exit(0)
try:
    with open(path, "rb") as f:
        cfg = tomllib.load(f)
except Exception as e:
    print(json.dumps({"error": f"config.toml parse error: {e}"}))
    sys.exit(0)
models = cfg.get("models", {})
providers_cfg = cfg.get("providers", {})
provider_names = sorted(providers_cfg.keys())
by_provider = {}
for model_id, info in models.items():
    provider = info.get("provider", "unknown")
    entry = {
        "model_id": model_id,
        "display_name": info.get("display_name", model_id),
        "model": info.get("model", model_id),
        "capabilities": info.get("capabilities", []),
    }
    by_provider.setdefault(provider, []).append(entry)
for provider in by_provider:
    by_provider[provider].sort(key=lambda model: model["model_id"])
print(json.dumps({
    "providers": provider_names,
    "models_by_provider": by_provider,
}, indent=2, ensure_ascii=False))
`;

  try {
    const result = execSync(`python3 -c '${pyScript.replace(/'/g, "'\\''")}'`, {
      encoding: "utf8",
      timeout: 5000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return JSON.parse(result);
  } catch {
    return null;
  }
}

function formatModelList(parsed) {
  if (!parsed || parsed.error) return null;

  const providers = parsed.providers || [];
  const byProvider = parsed.models_by_provider || {};
  const orphanProviders = Object.keys(byProvider).filter((provider) => !providers.includes(provider));
  const allProviders = [...providers, ...orphanProviders]
    .filter((provider) => (byProvider[provider] || []).length > 0);
  const totalModels = Object.values(byProvider).reduce((sum, models) => sum + models.length, 0);
  const lines = [
    `=== Providers (${allProviders.length}) ===`,
  ];

  for (const provider of allProviders) {
    const count = (byProvider[provider] || []).length;
    const orphanTag = orphanProviders.includes(provider) ? " [not declared in providers.*]" : "";
    lines.push(`- ${provider} (${count} models)${orphanTag}`);
  }

  lines.push(
    "",
    `=== Models (${totalModels} total; exhaustive) ===`,
    "Use only the model IDs below. Never add remembered, renamed, or otherwise unlisted models.",
    "Counts are exact. Include every listed model, regardless of capabilities."
  );

  const displayNameCounts = {};
  for (const provider of allProviders) {
    for (const model of byProvider[provider] || []) {
      displayNameCounts[model.display_name] = (displayNameCounts[model.display_name] || 0) + 1;
    }
  }

  for (const provider of allProviders) {
    const models = byProvider[provider] || [];
    if (models.length === 0) continue;
    lines.push("", `--- ${provider} (${models.length} models) ---`);
    for (const model of models) {
      const capabilities = (model.capabilities || []).join(", ") || "none";
      const duplicateTag = displayNameCounts[model.display_name] > 1 ? " [duplicate display name]" : "";
      lines.push(`- ${model.display_name} [model_id: ${model.model_id}] [capabilities: ${capabilities}]${duplicateTag}`);
    }
  }

  lines.push("", `=== End of model list (${totalModels} models) ===`);
  return lines.join("\n");
}

function readPayload() {
  try {
    const raw = fs.readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("kimi-fleet-hook.js: parse error:", error.message);
    return {};
  }
}

function valueToText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(valueToText).filter(Boolean).join("\n");
  if (typeof value === "object") {
    for (const key of ["text", "content", "prompt", "userPrompt", "input", "message", "query"]) {
      const text = valueToText(value[key]);
      if (text) return text;
    }
  }
  return "";
}

function extractPrompt(payload) {
  return valueToText(
    payload.prompt || payload.user_prompt || payload.input || payload.message || payload.query || payload
  ).trim();
}

function exitWithContext(additionalContext) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext,
    },
  }));
  process.exit(0);
}

function exitSilent() {
  process.stdout.write(JSON.stringify({}));
  process.exit(0);
}

function buildFleetInstruction() {
  const modelList = formatModelList(parseModelsFromConfig());
  const modelSource = modelList
    ? `### Complete model list (injected by hook)\n\n${modelList}\n\nDo not re-read config.toml when this list is available.`
    : `### Model list unavailable\n\nRead ~/.kimi-code/config.toml and parse every [models."..."] entry. Do not filter by capabilities or add unlisted models.`;

  return `[KIMI-FLEET INTERCEPT]

This is a multi-role task. Do not launch AgentSwarm or start subagents yet. Read ~/.agents/skills/kimi-fleet/SKILL.md and follow its complete Fleet workflow and model-calling templates.

### Required interaction

1. Confirm the task. In plan mode, ask the user to leave plan mode first.
2. Ask which providers to browse, then show every model from those providers.
3. Let the user select models, then ask for each model's role and optional custom instruction.
4. Ask about optional per-provider concurrency limits.
5. Run the skill's pre-flight check for every selected non-default model and apply the user's removal or fallback choice.
6. Build and run AgentSwarm items only after the selections are complete.
7. Verify all expected reports and synthesize them, explicitly identifying missing or partial results.

Use AskUserQuestion for the choices. Retain earlier selections across batches. If fewer than two models are available, follow the reduced-fleet choice in the skill.

### Model and provider rules

- The list below (or the config parse in fallback mode) is the only source of truth. Never offer an unlisted model ID.
- Offer every provider with at least one model, including providers missing from providers.*. Omit zero-model providers.
- AskUserQuestion supports four questions with four options each per call. Use as many calls as needed for all providers and models; never stop after the first four or sixteen.
- Use multi_select for provider and model questions. Do not treat an empty batch as a request to skip later batches.
- Label models as display_name (provider), with model_id and capabilities in the description. Always include the provider when display names collide.
- Split role choices across questions so every role in the skill remains available. Custom roles and instructions are allowed; custom unlisted model IDs are not.

### Build and launch rules

Follow the skill's dependency and batching sections. Independent items may share a call. An item that needs another item's output must wait, and its eventual task text must embed the complete upstream outputs labeled by model and role. Provider concurrency limits batch work within a dependency stage; they never move dependent work into an earlier stage.

Use the full default role prompt when the user chooses the default, not a placeholder. Use custom instructions verbatim. Never launch a dependent item on missing or empty upstream input.

${modelSource}`;
}

function main() {
  const payload = readPayload();
  const prompt = extractPrompt(payload);

  if (!prompt || prompt.length < 3) exitSilent();
  if (shouldIntercept(prompt)) exitWithContext(buildFleetInstruction());
  exitSilent();
}

main();

// A complete agent: model + tools + loop. This is the whole idea.
import Anthropic from "@anthropic-ai/sdk";
import { toolDefs, runTool } from "./lib/tools.mjs";
import { isMain } from "./lib/util.mjs";

export const MODEL = "claude-haiku-5-5";
export const SYSTEM =
  "You are the Lost & Found assistant for a university campus. Use the tools to look things up. " +
  "Answer only from tool results. Never guess.";

// beforeTool(call) may return a string to block the call; the model sees it as the tool's error.
export async function runAgent(task, { client = new Anthropic(), system = SYSTEM, maxSteps = 6, beforeTool, log = console.log } = {}) {
  const messages = [{ role: "user", content: task }];
  let tokens = 0;

  for (let step = 1; step <= maxSteps; step++) {
    const res = await client.messages.create({ model: MODEL, max_tokens: 1024, system, tools: toolDefs, messages });
    tokens += res.usage.input_tokens + res.usage.output_tokens;
    messages.push({ role: "assistant", content: res.content });

    const calls = res.content.filter((b) => b.type === "tool_use");
    if (calls.length === 0) {
      const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
      return { text, steps: step, tokens };
    }

    const results = [];
    for (const call of calls) {
      log(`step ${step}: ${call.name}(${JSON.stringify(call.input)})`);
      const blocked = await beforeTool?.(call);
      try {
        if (blocked) throw new Error(blocked);
        results.push({ type: "tool_result", tool_use_id: call.id, content: runTool(call.name, call.input) });
      } catch (err) {
        results.push({ type: "tool_result", tool_use_id: call.id, content: `Error: ${err.message}`, is_error: true });
      }
    }
    messages.push({ role: "user", content: results });
  }
  return { text: "Stopped: step limit reached.", steps: maxSteps, tokens };
}

if (isMain(import.meta.url)) {
  const r = await runAgent(process.argv[2] ?? "Are there any lost calculators?");
  console.log(`\n${r.text}\n[${r.steps} steps, ${r.tokens} tokens]`);
}

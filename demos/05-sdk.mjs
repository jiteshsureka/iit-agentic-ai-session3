// Same agent on the Agent SDK. No loop, no message list, no tool dispatch, no step counter.
import { query } from "@anthropic-ai/claude-agent-sdk";
import { fileURLToPath } from "node:url";
import { MODEL, SYSTEM } from "./01-agent.mjs";

const server = fileURLToPath(new URL("./03-mcp-server.mjs", import.meta.url));

try {
for await (const msg of query({
  prompt: process.argv[2] ?? "Are there any lost calculators?",
  options: {
    model: MODEL,
    systemPrompt: SYSTEM,
    mcpServers: { lostfound: { command: "node", args: [server] } }, // the server from 03
    allowedTools: ["mcp__lostfound__search_items", "mcp__lostfound__get_item"],
    tools: [], // no built-in Bash/Read/Edit: this agent only gets our tools
    maxTurns: 6,
    settingSources: [], // don't load the presenter's CLAUDE.md or hooks
  },
})) {
  if (msg.type === "assistant")
    for (const b of msg.message.content) {
      if (b.type === "tool_use") console.log(`tool: ${b.name}(${JSON.stringify(b.input)})`);
      if (b.type === "text") console.log(b.text);
    }
  if (msg.type === "result") console.log(`\n[${msg.num_turns} turns, $${msg.total_cost_usd?.toFixed(4)}]`);
}
} catch (err) {
  console.error(`SDK run failed: ${err.message.slice(0, 200)}`); // usually auth: check ANTHROPIC_API_KEY
  process.exit(1);
}

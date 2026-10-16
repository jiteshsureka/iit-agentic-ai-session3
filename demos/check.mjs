// Offline self-check: no API key needed. Run: npm run check
import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Work on a temp copy so add_item never touches the real data.
const tmp = join(mkdtempSync(join(tmpdir(), "lf-")), "items.json");
copyFileSync(fileURLToPath(new URL("../starter/data/items.json", import.meta.url)), tmp);
process.env.ITEMS_PATH = tmp;

const { runTool } = await import("./lib/tools.mjs");
const { runAgent } = await import("./01-agent.mjs");
const { guardInput, redactPhones, confirm } = await import("./lib/util.mjs");
const { retrieve } = await import("./04-rag.mjs");

// --- tools
const found = JSON.parse(runTool("search_items", { query: "lost calculators" }));
assert.ok(found.some((i) => i.id === 10) && found.some((i) => i.id === 1), "search finds both calculators");
assert.equal(JSON.parse(runTool("get_item", { id: 1 })).location, "Lab 3, bench 4");
assert.throws(() => runTool("get_item", { id: "one" }), "zod rejects bad args");
assert.throws(() => runTool("search_items", { query: "x".repeat(101) }), "zod rejects long query");
const added = JSON.parse(runTool("add_item", { name: "Scarf", description: "green", location: "Room 105", status: "found" }));
assert.equal(added.id, 13);
assert.equal(added.contact, "Lost & Found desk", "zod default applied");
assert.equal(JSON.parse(readFileSync(tmp, "utf8")).length, 13, "add_item persisted");

// --- agent loop with a scripted fake model
const use = (name, input) => ({ content: [{ type: "tool_use", id: "t1", name, input }], usage: { input_tokens: 10, output_tokens: 5 } });
const say = (text) => ({ content: [{ type: "text", text }], usage: { input_tokens: 10, output_tokens: 5 } });
const fake = (...replies) => ({ messages: { create: async () => replies.shift() ?? replies.at(-1) } });
const quiet = { log: () => {} };

let r = await runAgent("q", { client: fake(use("search_items", { query: "umbrella" }), say("Main gate")), ...quiet });
assert.deepEqual([r.text, r.steps, r.tokens], ["Main gate", 2, 30], "tool call then answer");

const loopForever = { messages: { create: async () => use("search_items", { query: "x1x" }) } };
r = await runAgent("q", { client: loopForever, maxSteps: 3, ...quiet });
assert.equal(r.steps, 3);
assert.match(r.text, /step limit/, "step cap stops runaway loops");

let ran = 0;
const seen = [];
const spy = { messages: { create: async ({ messages }) => { seen.push(messages.at(-1)); return seen.length === 1 ? use("add_item", { name: "n", description: "d", location: "l", status: "lost" }) : say("ok"); } } };
await runAgent("q", { client: spy, beforeTool: () => { ran++; return "Human denied."; }, ...quiet });
assert.equal(ran, 1);
assert.equal(seen[1].content[0].is_error, true, "blocked call comes back as an error result");
assert.equal(JSON.parse(readFileSync(tmp, "utf8")).length, 13, "blocked write did not happen");

// --- guardrails
assert.throws(() => guardInput("x".repeat(301)), /too long/);
assert.equal(guardInput("hello"), "hello");
for (const p of ["01711-000000", "01811000000", "+8801911 234567", "+88-01511-234567"])
  assert.equal(redactPhones(`call ${p} now`), "call [phone hidden] now", p);
assert.equal(redactPhones("room 204, 12 items"), "room 204, 12 items", "no false positives");
assert.equal(await confirm("write?"), false, "no TTY -> deny by default");

// --- RAG retrieval
assert.equal(retrieve("What happens when the context window fills up?")[0].file, "context-window.md");
assert.equal(retrieve("Why does Bangla cost more tokens?")[0].file, "tokens.md");
assert.equal(retrieve("What is the Wi-Fi password in Lab 3?").length, 0, "unanswerable -> no hits");

// --- MCP server over stdio, with a real MCP client
const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");
const client = new Client({ name: "check", version: "1" });
await client.connect(new StdioClientTransport({ command: "node", args: [fileURLToPath(new URL("./03-mcp-server.mjs", import.meta.url))], env: { ...process.env, ITEMS_PATH: tmp } }));
const listed = (await client.listTools()).tools.map((t) => t.name).sort();
assert.deepEqual(listed, ["get_item", "search_items"], "add_item is not exposed over MCP");
const out = await client.callTool({ name: "search_items", arguments: { query: "calculator" } });
assert.match(out.content[0].text, /Casio FX-991/);
await client.close();

console.log("all checks passed");

// Same 3 tasks, three patterns. Prints a table of steps / tokens / correct.
import Anthropic from "@anthropic-ai/sdk";
import { MODEL, SYSTEM, runAgent } from "./01-agent.mjs";
import { isMain } from "./lib/util.mjs";

const TASKS = [
  { q: "Is there a FOUND calculator, and where is it?", ok: [/Lab 3/i] },
  { q: "I lost my Arduino kit. Has anyone found one, and where do I collect it?", ok: [/204/, /desk/i] },
  { q: "List every found item in the library and say which floor each is on.", ok: [/second floor/i, /ground floor/i] },
];

const ask = async (client, prompt) => {
  const res = await client.messages.create({ model: MODEL, max_tokens: 800, messages: [{ role: "user", content: prompt }] });
  return { text: res.content.map((b) => b.text ?? "").join(""), tokens: res.usage.input_tokens + res.usage.output_tokens };
};

const quiet = { log: () => {} };

// ReAct: think -> act -> observe, repeat. This is just the loop from 01.
const react = (client, q) => runAgent(q, { client, ...quiet });

// Plan first: one planning call (no tools), then the loop follows the plan.
async function plan(client, q) {
  const p = await ask(client, `Task: ${q}\nTools: search_items(query), get_item(id), add_item(...).\nWrite a numbered plan of at most 4 tool calls. Do not answer the task.`);
  const r = await runAgent(q, { client, system: `${SYSTEM}\nFollow this plan:\n${p.text}`, ...quiet });
  return { ...r, steps: r.steps + 1, tokens: r.tokens + p.tokens };
}

// Reflection: draft, score it, rewrite once if the score is low.
async function reflect(client, q) {
  const d = await runAgent(q, { client, ...quiet });
  const c = await ask(client, `Question: ${q}\nDraft answer: ${d.text}\nScore the draft 1-10 for correctness and completeness. If below 8, rewrite it. Reply with JSON only: {"score": n, "answer": "final answer"}`);
  let text = d.text;
  try { text = JSON.parse(c.text.match(/\{[\s\S]*\}/)[0]).answer ?? d.text; } catch {} // ponytail: bad JSON keeps the draft
  return { text, steps: d.steps + 1, tokens: d.tokens + c.tokens };
}

export async function compare(client = new Anthropic()) {
  const modes = { ReAct: react, "Plan-first": plan, Reflection: reflect };
  const rows = [];
  for (const [name, fn] of Object.entries(modes)) {
    const t = { steps: 0, tokens: 0, correct: 0 };
    for (const task of TASKS) {
      const r = await fn(client, task.q);
      t.steps += r.steps;
      t.tokens += r.tokens;
      t.correct += task.ok.every((re) => re.test(r.text)) ? 1 : 0;
    }
    rows.push(`| ${name} | ${t.steps} | ${t.tokens} | ${t.correct}/${TASKS.length} |`);
  }
  return ["| Pattern | Steps | Tokens | Correct |", "|---|---|---|---|", ...rows].join("\n");
}

if (isMain(import.meta.url)) console.log(await compare());

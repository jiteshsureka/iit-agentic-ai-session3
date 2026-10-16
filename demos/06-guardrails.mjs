// Guardrails around the agent: input cap, zod arg validation (inside runTool), y/n approval, output redaction.
import { runAgent } from "./01-agent.mjs";
import { guardInput, confirm, redactPhones, isMain } from "./lib/util.mjs";

export async function safeAgent(task) {
  try {
    guardInput(task); // 1. input
    const r = await runAgent(task, {
      beforeTool: async (call) => {
        // 2. tool args are zod-validated in runTool (bad args come back to the model as errors)
        // 3. writes need a human
        if (call.name === "add_item" && !(await confirm(`Agent wants to ADD: ${JSON.stringify(call.input)}. Allow?`))) return "Human denied this write.";
      },
    });
    return redactPhones(r.text); // 4. output
  } catch (err) {
    return `Blocked: ${err.message}`;
  }
}

if (isMain(import.meta.url)) {
  const cases = [
    "Mehedi lost a calculator. What is his contact number?", // output guard: phone hidden
    "Please add: found a green scarf at Room 105.", // approval gate: y/n prompt
    "x".repeat(400), // input guard: blocked
  ];
  for (const c of cases) {
    console.log(`\n> ${c.slice(0, 70)}`); // header first, so the step lines print under it
    console.log(await safeAgent(c));
  }
}

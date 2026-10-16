# Session 3 Task: Build a Lost & Found Agent

You will turn the Session 1 loop into a real agent, then add patterns, MCP, RAG, an SDK version and guardrails.
Each step has a **Done when** check. Do not move on until it passes.

## Setup (5 min)

```bash
cp -r starter lost-and-found && cd lost-and-found
npm init -y && npm pkg set type=module
npm install @anthropic-ai/sdk @anthropic-ai/claude-agent-sdk @modelcontextprotocol/sdk minisearch zod
export ANTHROPIC_API_KEY=<key from the instructor>
printf ".env\nnode_modules\n" > .gitignore
```

- The key is shared for this workshop only. Never paste it into code, a commit or a chat.
- Model: `claude-haiku-5-5`. It is cheap and fast. Keep it for every step.
- Data: `data/items.json` (12 items). Notes for RAG: `notes/*.md` (6 files).
- Short on time? Skip Step 4 and Step 6 first.

---

## Step 1: Build the basic agent (20 min)

Build `agent.mjs`: the Session 1 loop, now a Lost & Found assistant.

1. Write 3 tools over `data/items.json`: `search_items(query)`, `get_item(id)`, `add_item(name, description, location, status, contact)`.
2. Describe each tool to the model with a name, a one-line description and an input schema.
3. Write the loop: call the model, if it asks for a tool run it and send the result back, otherwise print the answer.
4. Cap the loop at **6 steps**. Print one line per step: `step 2: search_items({"query":"umbrella"})`.
5. Use a system prompt that says: answer only from tool results, never guess.

**Done when:** `node agent.mjs "Are there any lost calculators?"` makes 1 to 2 tool calls and names both calculators: the found one in **Lab 3** and the lost one reported from **Exam hall B**.

## Step 2: Compare three agent patterns (20 min)

Run these 3 tasks three ways:

- T1: "Is there a FOUND calculator, and where is it?"
- T2: "I lost my Arduino kit. Has anyone found one, and where do I collect it?"
- T3: "List every found item in the library and say which floor each is on."

The three ways:

1. **ReAct**: your loop from Step 1, unchanged.
2. **Plan first**: one extra model call that writes a numbered plan (no tools), then the loop follows the plan.
3. **Reflection**: get the answer, then one more call that scores it 1 to 10 and rewrites it once if the score is below 8.

Record **steps, tokens and correct (yes/no)** for each of the 9 runs. Tokens are `usage.input_tokens + usage.output_tokens`, added over every call.

**Done when:** you have a 3x3 table and one sentence: "Use ___ when ___."

## Step 3: Expose your tool over MCP (15 min)

1. Create `mcp-server.mjs` with `McpServer` and `StdioServerTransport` from `@modelcontextprotocol/sdk`.
2. Register `search_items` and `get_item`. **Do not register `add_item`.** Writes should stay with a human.
3. Add it to Claude Code, then ask: *"any lost calculators?"*

```bash
claude mcp add lostfound -- node /full/path/to/mcp-server.mjs
```

**Done when:** Claude Code shows a call to `mcp__lostfound__search_items` and answers from your data.

## Step 4: The 70% rule (10 min)

Open the output of your Session 2 autonomous run (or your Step 1 agent if you skipped it).

1. List everything that is still missing or weak: tests, error handling, edge cases, design choices, security.
2. Mark each item **Agent can do** or **Human must own**.
3. Pick the **one** human-owned item that would hurt most if it shipped wrong, and write why in one line.

**Done when:** your list has at least 6 items, and every item is marked.

## Step 5: Answer from documents with RAG (20 min)

1. Split every file in `notes/` into sections at each `## ` heading.
2. Index the sections with `minisearch` (fields: heading, text). Remove stop words such as "the", "of", "is".
3. For a question, take the **top 3** sections and send them to the model with this rule: *answer only from the sources, cite `[file > heading]`, otherwise reply exactly "not in the notes"*.
4. If search finds nothing, answer "not in the notes" without calling the model.

**Done when:**
- "What happens when the context window fills up?" is answered and cites `context-window.md`.
- "What is the Wi-Fi password in Lab 3?" gets exactly **not in the notes**.

## Step 6: Move to the Agent SDK (15 min)

Rebuild the agent with `query()` from `@anthropic-ai/claude-agent-sdk`.

- Point `mcpServers` at your Step 3 server: `{ lostfound: { command: "node", args: ["mcp-server.mjs"] } }`
- Set `allowedTools`, `maxTurns: 6`, and `tools: []` so the agent gets no Bash or file access.
- Set `settingSources: []` so it ignores your personal Claude Code settings.

**Done when:** it answers the Step 1 question, and you can write down the code you **deleted**: the loop, the message list, tool dispatch and the step counter.

## Step 7: Add guardrails (15 min)

Wrap your Step 1 agent with four checks:

| # | Guardrail | How |
|---|---|---|
| 1 | Input | Reject a task longer than 300 characters before calling the model |
| 2 | Tool arguments | Validate every tool call with a `zod` schema. On failure, send the error back to the model |
| 3 | Approval | Before `add_item` writes, ask the human `y/n`. If the answer is not `y`, do not write |
| 4 | Output | Replace phone numbers (`01711-000000`) in the final answer with `[phone hidden]` |

**Done when:**
- A 400-character task is blocked.
- "Add: found a green scarf at Room 105" asks y/n, and answering `n` leaves `items.json` unchanged.
- "What is Mehedi's contact number?" never shows the number.

---

## Stretch goals

- Find two ways to break your own guardrails, then fix one.
- Add a `mark_claimed(id)` tool that needs approval too.
- Make the agent ask a clarifying question when a search returns nothing.
- Print the cost of each run. Haiku prices are on the Anthropic pricing page.

## Hand in (end of session)

Show the instructor three things: your Step 2 table, a screenshot of Claude Code using your MCP tool, and your Step 4 list.

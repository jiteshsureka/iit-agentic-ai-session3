// One definition per tool: zod schema -> JSON schema for the API, validation, and the MCP server.
import { z } from "zod";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PATH = process.env.ITEMS_PATH ?? fileURLToPath(new URL("../../starter/data/items.json", import.meta.url));
const load = () => JSON.parse(readFileSync(PATH, "utf8"));

export const tools = {
  search_items: {
    description: "Search lost & found items by keyword. Matches name, description, location and status (lost/found).",
    schema: z.object({ query: z.string().min(1).max(100) }),
    run({ query }) {
      // ponytail: keyword match, strip plural 's'. Upgrade to minisearch if recall matters.
      const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2).map((w) => w.replace(/s$/, ""));
      return load()
        .map((i) => ({ i, score: words.filter((w) => `${i.name} ${i.description} ${i.location} ${i.status}`.toLowerCase().includes(w)).length }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((x) => x.i);
    },
  },
  get_item: {
    description: "Get one item by its numeric id.",
    schema: z.object({ id: z.number().int().positive() }),
    run: ({ id }) => load().find((i) => i.id === id) ?? { error: `no item with id ${id}` },
  },
  add_item: {
    description: "Add a new lost or found item. Writes to the database.",
    schema: z.object({
      name: z.string().min(1).max(80),
      description: z.string().min(1).max(200),
      location: z.string().min(1).max(80),
      status: z.enum(["lost", "found"]),
      contact: z.string().max(80).default("Lost & Found desk"),
    }),
    run(args) {
      const items = load();
      const item = { id: Math.max(0, ...items.map((i) => i.id)) + 1, ...args };
      writeFileSync(PATH, JSON.stringify([...items, item], null, 2));
      return item;
    },
  },
};

// Anthropic API tool definitions
export const toolDefs = Object.entries(tools).map(([name, t]) => {
  const { $schema, ...input_schema } = z.toJSONSchema(t.schema);
  return { name, description: t.description, input_schema };
});

// Validate-then-run. Throws on bad args, so the loop can hand the error back to the model.
export const runTool = (name, args) => {
  const t = tools[name];
  if (!t) throw new Error(`unknown tool: ${name}`);
  return JSON.stringify(t.run(t.schema.parse(args)));
};

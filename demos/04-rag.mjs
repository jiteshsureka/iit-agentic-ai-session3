// RAG: retrieve the best sections, answer only from them, cite file + heading.
import Anthropic from "@anthropic-ai/sdk";
import MiniSearch from "minisearch";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MODEL } from "./01-agent.mjs";
import { isMain } from "./lib/util.mjs";

const NOTES = fileURLToPath(new URL("../starter/notes/", import.meta.url));
const STOP = new Set("the a an of is are was what why how does do in on to for and or it its my me i you can with when".split(" "));

// One document per "## heading" section.
const docs = readdirSync(NOTES).filter((f) => f.endsWith(".md")).flatMap((file) =>
  readFileSync(NOTES + file, "utf8").split(/^## /m).slice(1).map((sec) => {
    const [heading, ...body] = sec.split("\n");
    return { id: `${file}#${heading}`, file, heading, text: body.join(" ").trim() };
  }),
);

const index = new MiniSearch({
  fields: ["heading", "text"],
  storeFields: ["file", "heading", "text"],
  processTerm: (t) => (STOP.has(t.toLowerCase()) ? null : t.toLowerCase().replace(/s$/, "")),
});
index.addAll(docs);

export const retrieve = (q, k = 3) => index.search(q, { prefix: (t) => t.length > 3, boost: { heading: 2 } }).slice(0, k);

export async function answer(question, client = new Anthropic()) {
  const hits = retrieve(question);
  if (hits.length === 0) return "not in the notes"; // no evidence -> don't even call the model
  const sources = hits.map((h) => `[${h.file} > ${h.heading}]\n${h.text}`).join("\n\n");
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: "Answer ONLY from the sources. Cite every claim as [file > heading]. If the sources do not answer the question, reply exactly: not in the notes",
    messages: [{ role: "user", content: `Sources:\n${sources}\n\nQuestion: ${question}` }],
  });
  return res.content.map((b) => b.text ?? "").join("");
}

if (isMain(import.meta.url)) {
  for (const q of process.argv.slice(2).length ? [process.argv.slice(2).join(" ")] : [
    "What happens when the context window fills up?",
    "Why does Bangla cost more tokens?",
    "What is the Wi-Fi password in Lab 3?",
  ]) console.log(`Q: ${q}\nA: ${await answer(q)}\n`);
}

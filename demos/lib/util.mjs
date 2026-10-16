import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

// True when the file is run directly (node file.mjs), false when imported.
export const isMain = (metaUrl) => process.argv[1] === fileURLToPath(metaUrl);

// Guardrail 1: cap input length before it ever reaches the model.
export const MAX_INPUT = 300;
export function guardInput(text) {
  if (text.length > MAX_INPUT) throw new Error(`Input too long (${text.length} > ${MAX_INPUT} chars)`);
  return text;
}

// Guardrail 4: hide Bangladeshi mobile numbers (01XXXXXXXXX, optional +88, optional - or space separators).
export const redactPhones = (text) => text.replace(/(?:\+?88[\s-]?)?01[3-9](?:[\s-]?\d){8}/g, "[phone hidden]");

// Guardrail 3: human approval. Non-interactive runs (no TTY) deny by default; AUTO_YES=1 approves for recordings.
export async function confirm(question) {
  if (process.env.AUTO_YES === "1") return true;
  if (!process.stdin.isTTY) return false;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${question} [y/N] `);
  rl.close();
  return answer.trim().toLowerCase() === "y";
}

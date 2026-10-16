# IIT Agentic AI Workshop: Session 3

| Folder | What it is |
|---|---|
| `deck/session3.pptx` | 17 talk slides (30 min, timed speaker notes) + divider + 9 task slides for the hands-on |
| `demos/` | Presenter code, one file per live demo |
| `starter/` | What students receive: `data/items.json`, `notes/*.md` |
| `handout/student-task.md` | The 7-step student task, same content as the last slides |

## Before the session (once)

```bash
npm install
npm run check                      # offline self-check, no API key needed
export ANTHROPIC_API_KEY=<your key>
bash demos/record.sh               # saves real output to demos/out/ as the fallback
```

`record.sh` works on a temp copy of the data, so `add_item` never edits `starter/data/items.json`.

## Live demos (command per slide)

| Slide | Command |
|---|---|
| The loop in code | `node demos/01-agent.mjs "Are there any lost calculators?"` |
| Patterns | `node demos/02-patterns.mjs` |
| MCP | `claude mcp add lostfound -- node $PWD/demos/03-mcp-server.mjs`, then ask Claude Code "any lost calculators?" |
| RAG | `node demos/04-rag.mjs "What is the Wi-Fi password in Lab 3?"` |
| Agent SDK | `node demos/05-sdk.mjs` |
| Guardrails | `node demos/06-guardrails.mjs` |

Wifi or API down: `cat demos/out/<name>.txt` and keep talking.

## Before handing out `starter/`

Remove `demos/` and `deck/` from what students get. Give them `starter/`, `handout/student-task.md`, and the API key.

## Rebuild the deck

```bash
cd deck && NODE_PATH=$PWD/node_modules node build.js
```

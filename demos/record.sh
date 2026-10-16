#!/usr/bin/env bash
# Run ONCE before the session, with ANTHROPIC_API_KEY set. Saves real output to demos/out/.
# If wifi or the API dies on the day: `cat demos/out/02-patterns.txt` and keep talking.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${ANTHROPIC_API_KEY:?export ANTHROPIC_API_KEY first}"
mkdir -p demos/out

# Run each demo in a clean environment, like a normal terminal (no inherited proxy/OAuth vars).
run() { env -i HOME="$HOME" PATH="$PATH" ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" ITEMS_PATH="$ITEMS_PATH" AUTO_YES="${AUTO_YES:-}" "$@"; }

# Work on a copy so add_item (demo 06) never edits the real data.
export ITEMS_PATH="$(mktemp -d)/items.json"
cp starter/data/items.json "$ITEMS_PATH"

run node demos/01-agent.mjs "Are there any lost calculators?" | tee demos/out/01-agent.txt
run node demos/02-patterns.mjs | tee demos/out/02-patterns.txt
run node demos/04-rag.mjs | tee demos/out/04-rag.txt
run node demos/05-sdk.mjs "Are there any lost calculators?" | tee demos/out/05-sdk.txt
AUTO_YES=1 run node demos/06-guardrails.mjs | tee demos/out/06-guardrails.txt

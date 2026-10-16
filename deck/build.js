// Builds session3.pptx: 17 talk slides (30 min) + divider + 9 task slides (stay on screen during hands-on).
const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const SKILL = "/Users/bs01366/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/3ab815c4-6de2-4ef2-9fc4-37a68aba5565/2eb6fc99-7b47-41bd-a735-a88a882fe445/skills/pptx";
const { applyTheme } = require(`${SKILL}/scripts/apply_theme.js`);

// Light, high-contrast for weak projectors: white slides, ink text, amber accents, dark teal for "good", red for "human/danger". No dark fills.
const THEME = {
  name: "Lost and Found",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "16171C", lt1: "FFFFFF", dk2: "2B2D36", lt2: "E8ECF1",
    accent1: "F4A300", accent2: "0B6E66", accent3: "C23B1A", accent4: "404955", accent5: "DDF3F0", accent6: "FFF1CC",
    hlink: "0B6E66", folHlink: "404955",
  },
};
const HEX = { ink: "16171C", amber: "F4A300", teal: "0B6E66", red: "C23B1A", white: "FFFFFF", slate: "5B6472" };

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "From Loop to Agent";
pres.author = "Jitesh Sureka";
pres.subject = "IIT Agentic AI Workshop, Day 1, Session 3";
const C = pres.SchemeColor;
const S = pres.shapes;
["Intro", "Basic agent", "Agent patterns", "MCP", "RAG", "Agent SDK and guardrails", "The 70% rule", "Your task"].forEach((title) => pres.addSection({ title }));

// ---------- layouts
const FOOT = { x: 0.5, y: 5.2, w: 6, h: 0.25, fontSize: 10, color: C.accent4, margin: 0 };
pres.defineSlideMaster({
  title: "TITLE", background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 1.5, w: 5.6, h: 1.7, fontSize: 46, bold: true, color: C.text1, margin: 0, valign: "bottom" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.7, y: 3.4, w: 5.6, h: 0.9, fontSize: 20, color: C.accent4, margin: 0, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "SECTION", background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 0.6, w: 8.6, h: 0.9, fontSize: 40, bold: true, color: C.text1, margin: 0, valign: "middle" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "LIGHT", background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9, h: 0.8, fontSize: 36, bold: true, color: C.text1, margin: 0, valign: "middle" }, text: "" } },
    { text: { text: "IIT Agentic AI Workshop  |  Session 3", options: FOOT } },
  ],
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.25, fontSize: 10, color: C.accent4 },
});

// ---------- helpers
async function icon(name, hex) {
  const Comp = fa[name];
  if (!Comp) throw new Error(`no icon ${name}`);
  const svg = renderToStaticMarkup(React.createElement(Comp, { color: `#${hex}`, size: 256 }));
  return "image/png;base64," + (await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer()).toString("base64");
}
const ICONS = {};
async function loadIcons(spec) {
  for (const [k, [name, hex]] of Object.entries(spec)) ICONS[k] = await icon(name, hex);
}

const text = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, ...o });
const box = (s, o) => s.addShape(S.ROUNDED_RECTANGLE, { rectRadius: 0.08, line: { type: "none" }, ...o });
const card = (s, name, x, y, w, h, fill = C.background2) => box(s, { objectName: name, x, y, w, h, fill: { color: fill }, line: { color: "B8C0CC", width: 0.75 } });
// icon in a circle
function badge(s, name, key, x, y, d, fill = C.accent1) {
  if (key === "plus" || key === "lock") fill = "FBDDD3"; // write/danger tools: pale red circle, red icon
  s.addShape(S.OVAL, { objectName: `${name} circle`, x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" } });
  const p = d * 0.26;
  s.addImage({ objectName: `${name} icon`, data: ICONS[key], x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
}
function num(s, n, x, y, d = 0.38, fill = C.accent1, color = C.text1) {
  s.addShape(S.OVAL, { objectName: `step ${n}`, x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" } });
  text(s, String(n), { x, y, w: d, h: d, fontSize: 14, bold: true, color, align: "center", valign: "middle" });
}
function line(s, x1, y1, x2, y2, o = {}) {
  s.addShape(S.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipV: (y2 < y1) !== (x2 < x1), line: { color: C.accent4, width: 1.5, ...o } });
}
// code on an ink card; // comment lines in teal
function code(s, name, src, x, y, w, h, fontSize = 12) {
  card(s, name, x, y, w, h);
  const lines = src.split("\n");
  text(s, lines.map((l, i) => ({ text: l, options: { color: l.trim().startsWith("//") ? C.accent2 : C.text1, breakLine: i < lines.length - 1 } })), {
    objectName: `${name} text`, x: x + 0.2, y: y + 0.15, w: w - 0.4, h: h - 0.3, fontFace: "Courier New", fontSize, valign: "top", paraSpaceAfter: 0,
  });
}
// LIVE DEMO strip with the command to run
function demo(s, cmd, y = 4.5) {
  card(s, "demo strip", 0.5, y, 9, 0.5, C.accent6);
  box(s, { objectName: "demo tag", x: 0.62, y: y + 0.09, w: 1.15, h: 0.32, fill: { color: C.accent1 } });
  text(s, "LIVE DEMO", { x: 0.62, y: y + 0.09, w: 1.15, h: 0.32, fontSize: 11, bold: true, color: C.text1, align: "center", valign: "middle" });
  text(s, cmd, { objectName: "demo command", x: 1.95, y, w: 7.4, h: 0.5, fontFace: "Courier New", fontSize: 12, bold: true, color: C.text1, valign: "middle" });
}
function notes(s, t) { s.addNotes(t); }
const talk = (title, section) => { const s = pres.addSlide({ masterName: "LIGHT", sectionTitle: section }); s.addText(title, { placeholder: "title" }); return s; };

// ---------- build
(async () => {
  await loadIcons({
    robot: ["FaRobot", HEX.ink], map: ["FaProjectDiagram", HEX.ink], plug: ["FaPlug", HEX.ink], book: ["FaBookOpen", HEX.ink], shield: ["FaShieldAlt", HEX.ink], pie: ["FaChartPie", HEX.ink],
    robotW: ["FaRobot", HEX.white], search: ["FaSearch", HEX.ink], idcard: ["FaIdCard", HEX.ink], plus: ["FaPlusCircle", HEX.red],
    sync: ["FaSyncAlt", HEX.ink], list: ["FaListOl", HEX.ink], redo: ["FaRedoAlt", HEX.ink], lock: ["FaLock", HEX.red], check: ["FaCheckCircle", HEX.teal], times: ["FaTimes", HEX.red],
    cut: ["FaCut", HEX.ink], db: ["FaDatabase", HEX.ink], quote: ["FaQuoteLeft", HEX.ink], bot: ["FaRobot", HEX.ink],
    filter: ["FaFilter", HEX.ink], valid: ["FaCheckSquare", HEX.ink], user: ["FaUserCheck", HEX.ink], eye: ["FaEyeSlash", HEX.ink],
    draft: ["FaDraftingCompass", HEX.ink], vial: ["FaVial", HEX.ink], scale: ["FaBalanceScale", HEX.ink], flag: ["FaFlagCheckered", HEX.ink],
  });

  // 1 ── title
  let s = pres.addSlide({ masterName: "TITLE", sectionTitle: "Intro" });
  s.addText("From Loop to Agent", { placeholder: "title" });
  s.addText("Build, connect and guard a real AI agent", { placeholder: "body" });
  text(s, "IIT Agentic AI Workshop  |  Day 1, Session 3  |  Jitesh Sureka", { objectName: "byline", x: 0.7, y: 4.85, w: 8, h: 0.3, fontSize: 12, color: C.accent4 });
  s.addShape(S.OVAL, { objectName: "hero circle", x: 6.9, y: 1.2, w: 2.6, h: 2.6, fill: { color: C.accent1 }, line: { type: "none" } });
  s.addImage({ objectName: "hero icon", data: ICONS.robot, x: 7.6, y: 1.9, w: 1.2, h: 1.2 });
  notes(s, "0:00-0:30. Quick hello. Session 1 gave you the loop, Session 2 gave you a coding agent. Today we build our own agent and add six upgrades. Everything runs on one small example.");

  // 2 ── map
  s = talk("Today: one agent, six upgrades", "Intro");
  const stops = [["robot", "Basic agent", "6 min"], ["map", "Patterns", "5 min"], ["plug", "MCP", "5 min"], ["book", "RAG", "4 min"], ["shield", "SDK +\nguardrails", "5 min"], ["pie", "70% rule", "3 min"]];
  stops.forEach(([k, label, mins], i) => {
    const x = 0.5 + i * 1.52;
    card(s, `stop ${i + 1}`, x, 1.4, 1.38, 2.5);
    badge(s, `stop ${i + 1}`, k, x + 0.34, 1.6, 0.7);
    text(s, label, { objectName: `stop ${i + 1} label`, x: x + 0.1, y: 2.5, w: 1.18, h: 0.75, fontSize: 15, bold: true, color: C.text1, align: "center", valign: "top" });
    text(s, mins, { objectName: `stop ${i + 1} time`, x: x + 0.1, y: 3.4, w: 1.18, h: 0.3, fontSize: 13, color: C.accent4, align: "center" });
  });
  text(s, "Running example: one Lost & Found assistant, upgraded a step at a time.", { objectName: "example line", x: 0.5, y: 4.3, w: 9, h: 0.5, fontSize: 18, color: C.text1 });
  notes(s, "0:30-2:00. Walk the six cards left to right. Total talk is 30 minutes, then the hands-on starts straight away from the task slides at the end of this deck. Point out: every card you see here becomes one step in their task.");

  // 3 ── example
  s = talk("Our example: Lost & Found", "Basic agent");
  code(s, "item json", '{ "id": 10,\n  "name": "Casio FX-82 calculator",\n  "location": "Exam hall B",\n  "status": "lost",\n  "contact": "Reported by Mehedi" }', 0.5, 1.4, 4.5, 2.1, 13);
  text(s, "12 items in data/items.json", { objectName: "data caption", x: 0.5, y: 3.65, w: 4.5, h: 0.3, fontSize: 13, color: C.accent4 });
  [["search", "search_items(query)", "find items by keyword"], ["idcard", "get_item(id)", "read one item"], ["plus", "add_item(...)", "writes to the file"]].forEach(([k, name, desc], i) => {
    const y = 1.4 + i * 0.95;
    card(s, `tool ${i + 1}`, 5.3, y, 4.2, 0.8);
    badge(s, `tool ${i + 1}`, k, 5.45, y + 0.12, 0.56);
    text(s, name, { objectName: `tool ${i + 1} name`, x: 6.15, y: y + 0.1, w: 3.2, h: 0.32, fontFace: "Courier New", fontSize: 14, bold: true, color: C.text1 });
    text(s, desc, { objectName: `tool ${i + 1} desc`, x: 6.15, y: y + 0.44, w: 3.2, h: 0.28, fontSize: 13, color: C.accent4 });
  });
  text(s, "Two tools read. One tool writes. Remember that for the guardrails.", { objectName: "takeaway", x: 0.5, y: 4.3, w: 9, h: 0.4, fontSize: 16, color: C.text1 });
  notes(s, "2:00-3:00. Keep it short. A student loses a calculator, another finds one. Three tools: two read-only, one writes. The writing tool is the dangerous one, and we will come back to it twice: once for MCP, once for guardrails.");

  // 4 ── agent = model + tools + loop
  s = talk("Agent = model + tools + loop", "Basic agent");
  ["Context", "Plan", "Act\n(call a tool)", "Check"].forEach((label, i) => {
    const x = 0.5 + i * 2.3;
    card(s, `loop ${label}`, x, 1.45, 1.8, 1.0, i === 2 ? C.accent1 : C.background2);
    text(s, label, { objectName: `loop ${i + 1} label`, x, y: 1.45, w: 1.8, h: 1.0, fontSize: 18, bold: true, color: C.text1, align: "center", valign: "middle" });
    if (i < 3) line(s, x + 1.85, 1.95, x + 2.25, 1.95, { color: C.accent4, width: 2, endArrowType: "triangle" });
  });
  text(s, "repeat until the model answers, or the step cap hits (6)", { objectName: "loop caption", x: 0.5, y: 2.6, w: 9, h: 0.35, fontSize: 14, italic: true, color: C.accent4, align: "center" });
  card(s, "model col", 0.5, 3.15, 4.4, 1.7);
  text(s, [{ text: "The model", options: { bold: true, fontSize: 18, breakLine: true } }, { text: "Reads the context. Says which tool to call and with what arguments. Never runs anything.", options: { fontSize: 14 } }], { objectName: "model text", x: 0.7, y: 3.3, w: 4.0, h: 1.4, color: C.text1, valign: "top" });
  card(s, "code col", 5.1, 3.15, 4.4, 1.7);
  text(s, [{ text: "Your code", options: { bold: true, fontSize: 18, breakLine: true } }, { text: "Runs the tool. Sends the result back. Enforces the step cap. The loop is yours.", options: { fontSize: 14 } }], { objectName: "code text", x: 5.3, y: 3.3, w: 4.0, h: 1.4, color: C.text1, valign: "top" });
  notes(s, "3:00-5:00. This is the Session 1 loop, one slide. The key sentence: the model never executes anything. It returns a request, our code decides what happens. That is why guardrails live in code, not in prompts.");

  // 5 ── loop in code
  s = talk("The loop in code", "Basic agent");
  code(s, "loop code", `for (let step = 1; step <= maxSteps; step++) {
  const res = await client.messages.create(
    { model, system, tools: toolDefs, messages });
  messages.push({ role: "assistant",
                  content: res.content });
  const calls = res.content
    .filter(b => b.type === "tool_use");
  if (!calls.length) return finalText(res);

  // run each tool, send the results back
  messages.push({ role: "user",
    content: calls.map(runAndWrap) });
}`, 0.5, 1.3, 5.6, 3.05, 12);
  [["Model answers, or asks for a tool"], ["Our code runs the tool"], ["Result goes back as the next message"]].forEach(([t], i) => {
    num(s, i + 1, 6.4, 1.45 + i * 1.0);
    text(s, t, { objectName: `callout ${i + 1}`, x: 6.95, y: 1.38 + i * 1.0, w: 2.55, h: 0.6, fontSize: 15, color: C.text1, valign: "middle" });
  });
  demo(s, 'node demos/01-agent.mjs "Are there any lost calculators?"');
  notes(s, "5:00-8:00. Read the code top to bottom in 30 seconds, then RUN THE DEMO. Point at: (1) one printed line per step, (2) the model chose search_items itself, (3) the answer names two calculators, one found one lost. Then try a bad question: 'Who stole my bag?' to show it refuses to guess. FALLBACK: cat demos/out/01-agent.txt");

  // 6 ── patterns
  s = talk("Three ways to run the loop", "Agent patterns");
  [["sync", "ReAct", "Think, act, observe, repeat.", "Open-ended tasks where the path is unknown.", "Baseline"],
   ["list", "Plan first", "Write a numbered plan, then follow it.", "Multi-step tasks with a known shape.", "+1 model call"],
   ["redo", "Reflection", "Draft, score it, rewrite once.", "Answers where quality beats speed.", "+1 model call"]].forEach(([k, name, how, best, cost], i) => {
    const x = 0.5 + i * 3.1;
    card(s, `pattern ${name}`, x, 1.4, 2.9, 3.4);
    badge(s, `pattern ${name}`, k, x + 0.25, 1.6, 0.7);
    text(s, name, { objectName: `${name} name`, x: x + 0.25, y: 2.45, w: 2.4, h: 0.4, fontSize: 22, bold: true, color: C.text1 });
    text(s, how, { objectName: `${name} how`, x: x + 0.25, y: 2.9, w: 2.4, h: 0.75, fontSize: 15, color: C.text1, valign: "top" });
    text(s, [{ text: "Best when: ", options: { bold: true } }, { text: best }], { objectName: `${name} best`, x: x + 0.25, y: 3.65, w: 2.4, h: 0.65, fontSize: 14, color: C.text1, valign: "top" });
    text(s, cost, { objectName: `${name} cost`, x: x + 0.25, y: 4.4, w: 2.4, h: 0.3, fontSize: 13, bold: true, color: C.accent4 });
  });
  notes(s, "8:00-10:30. ReAct is what we just built. Plan-first adds a planning call before the loop. Reflection adds a critic call after it. One sentence each, then move on: the next slide is where we see whether the extra call pays for itself.");

  // 7 ── patterns compared
  s = talk("Do the extra calls pay off?", "Agent patterns");
  const hd = (t) => ({ text: t, options: { bold: true, color: C.text1, fill: { color: C.accent1 }, fontSize: 14 } });
  const cell = (t, b) => ({ text: t, options: { fontSize: 14, color: C.text1, bold: !!b, fill: { color: C.background2 } } });
  s.addTable([
    [hd("Pattern"), hd("Extra calls"), hd("Helps with"), hd("Watch out")],
    [cell("ReAct", 1), cell("0"), cell("Unknown paths, recovering from tool errors"), cell("Can wander. Keep the step cap")],
    [cell("Plan first", 1), cell("+1"), cell("Multi-step tasks, fewer wasted calls"), cell("A bad plan sends the loop the wrong way")],
    [cell("Reflection", 1), cell("+1"), cell("Wording, completeness, format"), cell("The critic has no tools, so it cannot check facts")],
  ], { objectName: "pattern table", x: 0.5, y: 1.4, w: 9, colW: [1.5, 1.2, 3.0, 3.3], rowH: [0.4, 0.7, 0.7, 0.7], border: { type: "solid", pt: 1, color: "FFFFFF" }, valign: "middle", margin: [0.05, 0.12, 0.05, 0.12] });
  text(s, "Numbers come from the terminal, not this slide: compare steps, tokens and correct.", { objectName: "table note", x: 0.5, y: 3.95, w: 9, h: 0.35, fontSize: 15, color: C.text1 });
  demo(s, "node demos/02-patterns.mjs");
  notes(s, "10:30-13:00. RUN THE DEMO (takes about a minute, talk over it). It prints a 3-row table: steps, tokens, correct out of 3. Read the numbers aloud. Honest message: more machinery does not automatically mean more correct. Reflection can only polish wording because the critic cannot call tools. Ask the room: which would you ship? Rehearsal run (Haiku): ReAct 6 steps / ~6.4k tokens / 3 of 3; Plan-first 12 / ~15.6k / 2 of 3; Reflection 9 / ~8.2k / 2 of 3. Say it out loud: only 3 tasks, so results vary run to run; the pattern to notice is cost, not the exact score. FALLBACK: cat demos/out/02-patterns.txt");

  // 8 ── MCP before/after
  s = talk("MCP: one plug for every tool", "MCP");
  const apps = ["Claude Code", "Our agent", "Your IDE"], srcs = ["Lost & Found", "GitHub", "Docs"];
  const ys = [1.95, 2.85, 3.75];
  text(s, "Before: N x M custom glue", { objectName: "before head", x: 0.5, y: 1.3, w: 4.3, h: 0.35, fontSize: 16, bold: true, color: C.text1 });
  text(s, "After: N + M, one protocol", { objectName: "after head", x: 5.2, y: 1.3, w: 4.3, h: 0.35, fontSize: 16, bold: true, color: C.text1 });
  ys.forEach((ya) => ys.forEach((yb) => line(s, 1.8, ya + 0.25, 3.5, yb + 0.25, { color: "8A94A6", width: 1 })));
  ys.forEach((y, i) => {
    box(s, { objectName: `before app ${i}`, x: 0.5, y, w: 1.3, h: 0.5, fill: { color: C.background2 } });
    text(s, apps[i], { x: 0.5, y, w: 1.3, h: 0.5, fontSize: 12, bold: true, color: C.text1, align: "center", valign: "middle" });
    box(s, { objectName: `before src ${i}`, x: 3.5, y, w: 1.3, h: 0.5, fill: { color: C.background2 } });
    text(s, srcs[i], { x: 3.5, y, w: 1.3, h: 0.5, fontSize: 12, bold: true, color: C.text1, align: "center", valign: "middle" });
    line(s, 6.15, y + 0.25, 6.65, 3.15, { color: C.accent1, width: 2 });
    line(s, 7.45, 3.15, 7.95, y + 0.25, { color: C.accent1, width: 2 });
    box(s, { objectName: `after app ${i}`, x: 5.0, y, w: 1.15, h: 0.5, fill: { color: C.background2 } });
    text(s, apps[i], { x: 5.0, y, w: 1.15, h: 0.5, fontSize: 12, bold: true, color: C.text1, align: "center", valign: "middle" });
    box(s, { objectName: `after src ${i}`, x: 7.95, y, w: 1.55, h: 0.5, fill: { color: C.background2 } });
    text(s, srcs[i], { x: 7.95, y, w: 1.55, h: 0.5, fontSize: 12, bold: true, color: C.text1, align: "center", valign: "middle" });
  });
  s.addShape(S.OVAL, { objectName: "mcp hub", x: 6.65, y: 2.75, w: 0.8, h: 0.8, fill: { color: C.accent1 }, line: { type: "none" } });
  text(s, "MCP", { x: 6.65, y: 2.75, w: 0.8, h: 0.8, fontSize: 14, bold: true, color: C.text1, align: "center", valign: "middle" });
  text(s, "9 integrations become 3 + 3.", { objectName: "mcp caption", x: 0.5, y: 4.55, w: 9, h: 0.4, fontSize: 16, color: C.text1 });
  notes(s, "13:00-15:00. Without a standard, every app needs custom code for every tool: N times M. With MCP every app speaks one protocol and every tool speaks the same one. USB-C for AI tools. It matters here because the tool we wrote for our own agent will work in Claude Code with zero changes.");

  // 9 ── MCP code
  s = talk("Our tool as an MCP server", "MCP");
  code(s, "mcp code", `const server = new McpServer(
  { name: "lostfound", version: "1.0.0" });

for (const name of ["search_items", "get_item"]) {
  server.registerTool(name,
    { description, inputSchema },
    async (args) => ({ content: [
      { type: "text", text: runTool(name, args) }
    ] }));
}

await server.connect(new StdioServerTransport());`, 0.5, 1.3, 5.6, 2.95, 12);
  card(s, "mcp note 1", 6.35, 1.3, 3.15, 1.4);
  badge(s, "same server", "plug", 6.5, 1.45, 0.5);
  text(s, "The same server works in Claude Code and in our SDK agent.", { objectName: "mcp note 1 text", x: 7.1, y: 1.4, w: 2.3, h: 1.2, fontSize: 14, color: C.text1, valign: "middle" });
  card(s, "mcp note 2", 6.35, 2.85, 3.15, 1.4);
  badge(s, "no writes", "lock", 6.5, 3.0, 0.5);
  text(s, "add_item is not exposed. Writes stay with a human.", { objectName: "mcp note 2 text", x: 7.1, y: 2.95, w: 2.3, h: 1.2, fontSize: 14, color: C.text1, valign: "middle" });
  demo(s, "claude mcp add lostfound -- node demos/03-mcp-server.mjs");
  notes(s, "15:00-18:00. Show the 10 lines, then run the command in a second terminal, open Claude Code and ask: 'any lost calculators?'. Point at the tool-call line mcp__lostfound__search_items. Say out loud: we chose to leave add_item out. An MCP server is a doorway; every tool you expose is a tool anyone with that client can use. FALLBACK: show the screenshot you took when rehearsing, or describe it.");

  // 10 ── RAG pipeline
  s = talk("RAG: answer from real documents", "RAG");
  [["cut", "Split", "notes into sections"], ["db", "Index", "with minisearch"], ["search", "Retrieve", "the top 3"], ["bot", "Ask", "sources only"], ["quote", "Cite", "file + heading"]].forEach(([k, a, b], i) => {
    const x = 0.5 + i * 1.85;
    card(s, `rag ${a}`, x, 1.4, 1.6, 1.75);
    badge(s, `rag ${a}`, k, x + 0.5, 1.55, 0.6);
    text(s, a, { objectName: `rag ${a} name`, x, y: 2.25, w: 1.6, h: 0.4, fontSize: 17, bold: true, color: C.text1, align: "center" });
    text(s, b, { objectName: `rag ${a} desc`, x: x + 0.1, y: 2.65, w: 1.4, h: 0.4, fontSize: 13, color: C.accent4, align: "center" });
    if (i < 4) line(s, x + 1.62, 2.28, x + 1.83, 2.28, { color: C.accent1, width: 2, endArrowType: "triangle" });
  });
  card(s, "answerable", 0.5, 3.4, 4.4, 1.45);
  text(s, [{ text: "Answerable", options: { bold: true, fontSize: 14, color: C.accent2, breakLine: true } }, { text: "What happens when the context window fills up?", options: { fontSize: 14, italic: true, breakLine: true } }, { text: "Older content is dropped or summarized.  [context-window.md > When it fills up]", options: { fontSize: 13 } }], { objectName: "answerable text", x: 0.7, y: 3.5, w: 4.0, h: 1.25, color: C.text1, valign: "top" });
  card(s, "unanswerable", 5.1, 3.4, 4.4, 1.45);
  text(s, [{ text: "Not answerable", options: { bold: true, fontSize: 14, color: C.accent3, breakLine: true } }, { text: "What is the Wi-Fi password in Lab 3?", options: { fontSize: 14, italic: true, breakLine: true } }, { text: "not in the notes", options: { fontSize: 15, bold: true } }], { objectName: "unanswerable text", x: 5.3, y: 3.5, w: 4.0, h: 1.25, color: C.text1, valign: "top" });
  notes(s, "18:00-20:00. Five boxes. The point of RAG: the model answers from documents you control, and shows its source. The right-hand card matters most: a good RAG system says 'not in the notes' instead of inventing a Wi-Fi password. That is hallucination control from Session 1 in practice.");

  // 11 ── RAG rules
  s = talk("Cite, or say you don't know", "RAG");
  code(s, "rag code", `// top 3 sections
const hits = retrieve(question);
// no evidence: skip the model call
if (hits.length === 0)
  return "not in the notes";

system:
  "Answer ONLY from the sources.
   Cite every claim as [file > heading].
   If the sources do not answer, reply
   exactly: not in the notes"`, 0.5, 1.3, 5.2, 2.95, 12);
  [["Cite every claim, so a human can check it."], ["No evidence means no model call: cheaper, and it cannot hallucinate."], ["Tune retrieval. Prefix search turned \"Wi-Fi\" into \"window\" until we limited it to 4+ letters."]].forEach(([t], i) => {
    num(s, i + 1, 5.95, 1.4 + i * 1.05);
    text(s, t, { objectName: `rag rule ${i + 1}`, x: 6.5, y: 1.3 + i * 1.05, w: 3.0, h: 0.85, fontSize: 14, color: C.text1, valign: "middle" });
  });
  demo(s, 'node demos/04-rag.mjs "What is the Wi-Fi password in Lab 3?"');
  notes(s, "20:00-22:00. RUN THE DEMO with the Wi-Fi question first (expected: exactly 'not in the notes'), then run it with no argument to see all three questions. Tell the bug story: we caught prefix matching turning 'Wi-Fi' into 'window' in the offline check. That is why RAG needs tests on the 'no answer' case, not just the happy path. FALLBACK: cat demos/out/04-rag.txt");

  // 12 ── Agent SDK
  s = talk("Agent SDK: delete the loop", "Agent SDK and guardrails");
  card(s, "delete card", 0.5, 1.3, 4.1, 3.0);
  text(s, "Code you stop writing", { objectName: "delete head", x: 0.7, y: 1.45, w: 3.7, h: 0.35, fontSize: 17, bold: true, color: C.text1 });
  ["The message list", "The loop and the step counter", "Tool lookup and dispatch", "Error wrapping for tool results"].forEach((t, i) => {
    s.addImage({ objectName: `delete icon ${i + 1}`, data: ICONS.times, x: 0.7, y: 2.0 + i * 0.52, w: 0.26, h: 0.26 });
    text(s, t, { objectName: `delete item ${i + 1}`, x: 1.1, y: 1.95 + i * 0.52, w: 3.3, h: 0.36, fontSize: 14, color: C.text1, valign: "middle" });
  });
  code(s, "sdk code", `query({ prompt, options: {
  mcpServers: { lostfound: {
    command: "node",
    args: ["03-mcp-server.mjs"] } },
  allowedTools: [
    "mcp__lostfound__search_items" ],
  tools: [],      // no Bash, no files
  maxTurns: 6,    // the step cap
} })`, 4.8, 1.3, 4.7, 3.0, 12);
  text(s, "You still own: the system prompt, which tools exist, and the limits.", { objectName: "sdk takeaway", x: 0.5, y: 4.5, w: 9, h: 0.4, fontSize: 16, color: C.text1 });
  notes(s, "22:00-24:00. Left: everything from slide 5 that we no longer write. Right: the same agent, pointed at the MCP server from slide 9. Two settings to call out: tools: [] (otherwise the SDK agent gets Bash and file access, which is a lot of power for a lost-and-found bot) and maxTurns, our old step cap. Optional: node demos/05-sdk.mjs. FALLBACK: cat demos/out/05-sdk.txt");

  // 13 ── guardrail layers
  s = talk("Four guardrails around the agent", "Agent SDK and guardrails");
  [["filter", "1  Input", "Cap length at 300 chars", "guardInput(task)", "before the model"], ["valid", "2  Tool args", "Validate every call with zod", "schema.parse(args)", "around each tool"], ["user", "3  Approval", "Human says y/n before a write", "await confirm(...)", "before add_item"], ["eye", "4  Output", "Hide phone numbers", "redactPhones(text)", "after the model"]].forEach(([k, head, what, fn, where], i) => {
    const x = 0.5 + i * 2.28;
    card(s, `guard ${i + 1}`, x, 1.4, 2.1, 3.1);
    badge(s, `guard ${i + 1}`, k, x + 0.2, 1.55, 0.62);
    text(s, head, { objectName: `guard ${i + 1} head`, x: x + 0.2, y: 2.3, w: 1.75, h: 0.4, fontSize: 17, bold: true, color: C.text1 });
    text(s, what, { objectName: `guard ${i + 1} what`, x: x + 0.2, y: 2.75, w: 1.75, h: 0.7, fontSize: 14, color: C.text1, valign: "top" });
    text(s, fn, { objectName: `guard ${i + 1} fn`, x: x + 0.2, y: 3.5, w: 1.8, h: 0.3, fontFace: "Courier New", fontSize: 11, bold: true, color: C.text1 });
    text(s, where, { objectName: `guard ${i + 1} where`, x: x + 0.2, y: 3.95, w: 1.75, h: 0.3, fontSize: 13, color: C.accent4 });
  });
  text(s, "Guardrails are code, not prompts. A prompt can be argued with.", { objectName: "guard takeaway", x: 0.5, y: 4.65, w: 9, h: 0.4, fontSize: 16, color: C.text1 });
  notes(s, "24:00-25:30. One pass across four cards: before the model, around each tool, before a write, after the model. The sentence to land: a rule in the system prompt can be talked around; a rule in code cannot. This is why the earlier 'the model never executes anything' matters.");

  // 14 ── approval code
  s = talk("Approval before any write", "Agent SDK and guardrails");
  code(s, "guard code", `const r = await runAgent(task, {
  beforeTool: async (call) => {
    if (call.name === "add_item" &&
        !(await confirm("Allow this write?")))
      return "Human denied this write.";
  },
});
return redactPhones(r.text);`, 0.5, 1.3, 5.6, 2.1, 12);
  [["Denied tools return an error the model can read and recover from."], ["No terminal attached? The default is deny."], ["Phone numbers never reach the student, even if the data has them."]].forEach(([t], i) => {
    num(s, i + 1, 6.4, 1.4 + i * 0.7, 0.34);
    text(s, t, { objectName: `guard note ${i + 1}`, x: 6.9, y: 1.3 + i * 0.7, w: 2.6, h: 0.6, fontSize: 13, color: C.text1, valign: "middle" });
  });
  text(s, "Three test inputs: a normal lookup, a write request, a 400-character blob.", { objectName: "guard cases", x: 0.5, y: 3.65, w: 9, h: 0.5, fontSize: 15, color: C.text1 });
  demo(s, "node demos/06-guardrails.mjs");
  notes(s, "25:30-27:00. RUN THE DEMO. Case 1: ask for Mehedi's number, the answer shows [phone hidden]. Case 2: the y/n prompt appears; answer n first, then show nothing was written. Case 3: the long input is blocked before any model call, so it costs nothing. FALLBACK: cat demos/out/06-guardrails.txt (it was recorded with AUTO_YES=1).");

  // 15 ── 70% rule
  s = talk("The 70% rule", "The 70% rule");
  box(s, { objectName: "bar agent", x: 0.5, y: 1.4, w: 6.3, h: 0.8, fill: { color: C.accent1 } });
  text(s, "70%  agent: fast", { x: 0.5, y: 1.4, w: 6.3, h: 0.8, fontSize: 22, bold: true, color: C.text1, align: "center", valign: "middle" });
  box(s, { objectName: "bar human", x: 6.8, y: 1.4, w: 2.7, h: 0.8, fill: { color: C.accent5 }, line: { color: "0B6E66", width: 1.5 } });
  text(s, "30%  you", { x: 6.8, y: 1.4, w: 2.7, h: 0.8, fontSize: 22, bold: true, color: C.text1, align: "center", valign: "middle" });
  card(s, "agent does", 0.5, 2.5, 4.4, 2.3);
  text(s, [{ text: "Agents do this fast", options: { bold: true, fontSize: 17, breakLine: true } }, { text: "Scaffolding and boilerplate", options: { bullet: true, breakLine: true } }, { text: "Happy-path features", options: { bullet: true, breakLine: true } }, { text: "Standard patterns and wiring", options: { bullet: true, breakLine: true } }, { text: "A first draft of tests", options: { bullet: true } }], { objectName: "agent does text", x: 0.7, y: 2.65, w: 4.0, h: 2.0, fontSize: 15, color: C.text1, valign: "top", paraSpaceAfter: 4 });
  card(s, "last thirty", 5.1, 2.5, 4.4, 2.3);
  text(s, [{ text: "The last 30% needs an engineer", options: { bold: true, fontSize: 17, breakLine: true } }, { text: "Edge cases and failure paths", options: { bullet: true, breakLine: true } }, { text: "Security and data privacy", options: { bullet: true, breakLine: true } }, { text: "Fit with the real system", options: { bullet: true, breakLine: true } }, { text: "Is this the right thing to build?", options: { bullet: true } }], { objectName: "last thirty text", x: 5.3, y: 2.65, w: 4.0, h: 2.0, fontSize: 15, color: C.text1, valign: "top", paraSpaceAfter: 4 });
  notes(s, "27:00-28:30. 70% is a rule of thumb, not a measurement. The point: agents are fastest where the path is well-worn, and the remaining work is exactly the work that needs judgment. Today's example: the agent wrote the loop in minutes; the decision to leave add_item out of MCP was ours.");

  // 16 ── human owns
  s = talk("What a human must own", "The 70% rule");
  [["draft", "Design", "Should add_item be reachable over MCP at all?"], ["vial", "Tests", "Does \"not in the notes\" really fire when search finds nothing?"], ["scale", "Decisions", "Who may see a student's phone number?"]].forEach(([k, head, ex], i) => {
    const x = 0.5 + i * 3.1;
    card(s, `own ${head}`, x, 1.4, 2.9, 3.0);
    badge(s, `own ${head}`, k, x + 0.25, 1.6, 0.7);
    text(s, head, { objectName: `own ${head} head`, x: x + 0.25, y: 2.5, w: 2.4, h: 0.45, fontSize: 24, bold: true, color: C.text1 });
    text(s, ex, { objectName: `own ${head} example`, x: x + 0.25, y: 3.05, w: 2.4, h: 1.2, fontSize: 15, color: C.text1, valign: "top" });
  });
  text(s, "Every example is from today's agent. Your hands-on Step 4 finds more.", { objectName: "own takeaway", x: 0.5, y: 4.6, w: 9, h: 0.4, fontSize: 16, color: C.text1 });
  notes(s, "28:30-29:30. Three cards, one example each, all from the thing we just built. Tie to Session 2: this is why we read diffs critically and why tests are the human's job even when the agent writes them.");

  // 17 ── recap (dark)
  s = pres.addSlide({ masterName: "SECTION", sectionTitle: "The 70% rule" });
  s.addText("Six upgrades, one agent", { placeholder: "title" });
  ["A loop that calls tools, with a step cap", "Patterns: ReAct, plan first, reflection", "MCP: one plug, tools reused everywhere", "RAG: cited answers, or \"not in the notes\"", "Agent SDK: the loop is no longer yours", "Guardrails in code, and a human on every write"].forEach((t, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.7 + col * 4.4, y = 1.9 + row * 0.95;
    num(s, i + 1, x, y, 0.42);
    text(s, t, { objectName: `recap ${i + 1}`, x: x + 0.6, y: y - 0.1, w: 3.5, h: 0.62, fontSize: 16, color: C.text1, valign: "middle" });
  });
  notes(s, "29:30-30:00. Read the six lines in ten seconds. Then: 'Your turn. The next slides are your task, step by step. They stay on screen while you work.'");

  // ---------- task section
  s = pres.addSlide({ masterName: "SECTION", sectionTitle: "Your task" });
  s.addText("Your turn: build it", { placeholder: "title" });
  text(s, "7 steps. Each has a \"Done when\" check. Do not move on until it passes.", { objectName: "task intro", x: 0.7, y: 1.9, w: 6.2, h: 0.7, fontSize: 20, bold: true, color: C.text1 });
  text(s, "Short on time? Skip Step 4 and Step 6 first.\nFull handout: handout/student-task.md", { objectName: "task hint", x: 0.7, y: 3.0, w: 6.2, h: 0.9, fontSize: 16, color: C.accent4 });
  s.addShape(S.OVAL, { objectName: "divider circle", x: 7.4, y: 1.9, w: 1.9, h: 1.9, fill: { color: C.accent1 }, line: { type: "none" } });
  s.addImage({ objectName: "divider icon", data: ICONS.flag, x: 7.9, y: 2.4, w: 0.9, h: 0.9 });
  notes(s, "Hands-on starts here. Leave the setup slide up first, then move through the steps as the room progresses.");

  // T1 setup
  s = talk("Setup (5 min)", "Your task");
  code(s, "setup code", `cp -r starter lost-and-found
cd lost-and-found
npm init -y && npm pkg set type=module
npm install @anthropic-ai/sdk \\
  @anthropic-ai/claude-agent-sdk \\
  @modelcontextprotocol/sdk minisearch zod
export ANTHROPIC_API_KEY=<from instructor>`, 0.5, 1.3, 5.6, 2.6, 12);
  [["Model for every step:\nclaude-haiku-5-5"], ["The key is for this workshop only. Never put it in code, a commit or a chat."], ["Data: data/items.json. Notes: notes/*.md"]].forEach(([t], i) => {
    num(s, i + 1, 6.4, 1.4 + i * 0.95, 0.36);
    text(s, t, { objectName: `setup note ${i + 1}`, x: 6.95, y: 1.3 + i * 0.95, w: 2.55, h: 0.8, fontSize: 14, color: C.text1, valign: "middle" });
  });
  text(s, "Check: node --version prints v20 or higher.", { objectName: "setup check", x: 0.5, y: 4.2, w: 9, h: 0.4, fontSize: 15, color: C.text1 });

  // step slide builder
  const step = (title, items, done, extra) => {
    const st = talk(title, "Your task");
    card(st, "do card", 0.5, 1.3, 5.7, 3.65);
    text(st, "DO THIS", { objectName: "do label", x: 0.75, y: 1.45, w: 3, h: 0.3, fontSize: 12, bold: true, color: C.accent4 });
    items.forEach((t, i) => {
      const y = 1.85 + i * (3.0 / items.length);
      num(st, i + 1, 0.75, y + 0.05, 0.34);
      text(st, t, { objectName: `do item ${i + 1}`, x: 1.3, y, w: 4.7, h: 3.0 / items.length - 0.05, fontSize: 14, color: C.text1, valign: "middle" });
    });
    card(st, "done card", 6.4, 1.3, 3.1, 3.65, C.accent5);
    st.addImage({ objectName: "done icon", data: ICONS.check, x: 6.65, y: 1.5, w: 0.4, h: 0.4 });
    text(st, "DONE WHEN", { objectName: "done label", x: 7.2, y: 1.5, w: 2.1, h: 0.4, fontSize: 13, bold: true, color: C.accent2, valign: "middle" });
    text(st, done, { objectName: "done text", x: 6.65, y: 2.1, w: 2.65, h: 2.7, fontSize: 14, color: C.text1, valign: "top", paraSpaceAfter: 6 });
    return st;
  };

  step("Step 1: Basic agent (20 min)", [
    "Write 3 tools over data/items.json: search_items, get_item, add_item",
    "Describe each tool to the model: name, description, input schema",
    "Loop: call the model, run the tool it asks for, send the result back",
    "Cap at 6 steps. Print one line per step",
    "System prompt: answer only from tool results",
  ], [{ text: 'node agent.mjs "Are there any lost calculators?"', options: { fontFace: "Courier New", fontSize: 12, breakLine: true } }, { text: "makes 1 to 2 tool calls and names both calculators: the found one in Lab 3, and the lost one reported from Exam hall B.", options: {} }]);

  step("Step 2: Compare patterns (20 min)", [
    "T1: a FOUND calculator, where? T2: lost Arduino kit, where to collect? T3: found items in the library, which floor?",
    "Run each task as ReAct, as plan-first, and with a reflection pass",
    "Plan-first: one extra call writes a numbered plan, then the loop follows it",
    "Reflection: score the answer 1-10, rewrite once if below 8",
    "Record steps, tokens (input + output, all calls) and correct yes/no",
  ], [{ text: "You have a 3x3 table of results and one sentence:", options: { breakLine: true } }, { text: "\"Use ___ when ___.\"", options: { bold: true } }]);

  step("Step 3: Expose it over MCP (15 min)", [
    "Create mcp-server.mjs with McpServer and StdioServerTransport",
    "Register search_items and get_item. Do NOT register add_item",
    "claude mcp add lostfound -- node /full/path/mcp-server.mjs",
    "Ask Claude Code: \"any lost calculators?\"",
  ], [{ text: "Claude Code shows a call to", options: { breakLine: true } }, { text: "mcp__lostfound__search_items", options: { fontFace: "Courier New", fontSize: 12, breakLine: true } }, { text: "and answers from your data.", options: {} }]);

  step("Step 4: The 70% rule (10 min)", [
    "Open your Session 2 autonomous output (or your Step 1 agent)",
    "List what is missing or weak: tests, errors, edge cases, design, security",
    "Mark each item: Agent can do, or Human must own",
    "Pick the one human-owned item that hurts most if wrong. One line on why",
  ], [{ text: "Your list has at least 6 items.", options: { breakLine: true } }, { text: "Every item is marked.", options: { breakLine: true } }, { text: "One item is circled, with a reason.", options: {} }]);

  step("Step 5: RAG with citations (20 min)", [
    "Split every notes/*.md file at each \"## \" heading",
    "Index sections with minisearch (heading, text). Drop stop words like \"the\", \"of\"",
    "Send the top 3 sections to the model: answer only from sources, cite [file > heading]",
    "No search hits? Answer \"not in the notes\" without calling the model",
  ], [{ text: "Context window question: answered, cites context-window.md.", options: { breakLine: true } }, { text: "\"Wi-Fi password in Lab 3?\" gets exactly:", options: { breakLine: true } }, { text: "not in the notes", options: { bold: true } }]);

  step("Step 6: Agent SDK (15 min)", [
    "Rebuild the agent with query() from @anthropic-ai/claude-agent-sdk",
    "Point mcpServers at your Step 3 server",
    "Set allowedTools, maxTurns: 6 and tools: [] (no Bash, no files)",
    "Set settingSources: [] so it ignores your personal settings",
  ], [{ text: "It answers the Step 1 question.", options: { breakLine: true } }, { text: "You can list the code you deleted: loop, message list, tool dispatch, step counter.", options: {} }]);

  // step 7: table of guardrails
  s = talk("Step 7: Guardrails (15 min)", "Your task");
  s.addTable([
    [hd("#"), hd("Guardrail"), hd("How")],
    [cell("1"), cell("Input", 1), cell("Reject a task over 300 characters before calling the model")],
    [cell("2"), cell("Tool args", 1), cell("Validate every call with zod. On failure, send the error to the model")],
    [cell("3"), cell("Approval", 1), cell("Ask y/n before add_item writes. Anything but y means no write")],
    [cell("4"), cell("Output", 1), cell("Replace phone numbers like 01711-000000 with [phone hidden]")],
  ], { objectName: "guardrail table", x: 0.5, y: 1.3, w: 5.7, colW: [0.4, 1.2, 4.1], rowH: [0.4, 0.8, 0.8, 0.8, 0.8], border: { type: "solid", pt: 1, color: "FFFFFF" }, valign: "middle", margin: [0.05, 0.1, 0.05, 0.1] });
  card(s, "done card", 6.4, 1.3, 3.1, 3.65, C.accent5);
  s.addImage({ objectName: "done icon", data: ICONS.check, x: 6.65, y: 1.5, w: 0.4, h: 0.4 });
  text(s, "DONE WHEN", { objectName: "done label", x: 7.2, y: 1.5, w: 2.1, h: 0.4, fontSize: 13, bold: true, color: C.accent2, valign: "middle" });
  text(s, [{ text: "A 400-character task is blocked.", options: { breakLine: true } }, { text: "\"Add: found a green scarf at Room 105\" asks y/n. Answer n and items.json is unchanged.", options: { breakLine: true } }, { text: "Mehedi's contact number is never shown.", options: {} }], { objectName: "done text", x: 6.65, y: 2.1, w: 2.65, h: 2.7, fontSize: 14, color: C.text1, valign: "top", paraSpaceAfter: 6 });

  // T-last: stretch + hand in
  s = talk("Stretch goals and hand in", "Your task");
  card(s, "stretch card", 0.5, 1.3, 4.4, 3.5);
  text(s, [{ text: "Stretch goals", options: { bold: true, fontSize: 18, breakLine: true } }, { text: "Break your own guardrails two ways, then fix one", options: { bullet: true, breakLine: true } }, { text: "Add mark_claimed(id) behind an approval", options: { bullet: true, breakLine: true } }, { text: "Ask a clarifying question when search finds nothing", options: { bullet: true, breakLine: true } }, { text: "Print the cost of each run", options: { bullet: true } }], { objectName: "stretch text", x: 0.7, y: 1.45, w: 4.0, h: 3.2, fontSize: 15, color: C.text1, valign: "top", paraSpaceAfter: 6 });
  card(s, "handin card", 5.1, 1.3, 4.4, 3.5, C.accent5);
  text(s, [{ text: "Show the instructor", options: { bold: true, fontSize: 18, breakLine: true } }, { text: "Your Step 2 results table", options: { bullet: true, breakLine: true } }, { text: "A screenshot of Claude Code calling your MCP tool", options: { bullet: true, breakLine: true } }, { text: "Your Step 4 list, with the circled item", options: { bullet: true } }], { objectName: "handin text", x: 5.3, y: 1.45, w: 4.0, h: 3.2, fontSize: 15, color: C.text1, valign: "top", paraSpaceAfter: 6 });

  await pres.writeFile({ fileName: "session3.pptx" });
  await applyTheme("session3.pptx", THEME);
  console.log("wrote session3.pptx");
})().catch((e) => { console.error(e); process.exit(1); });

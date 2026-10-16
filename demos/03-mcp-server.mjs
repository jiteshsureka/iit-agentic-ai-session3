// search_items as an MCP server. Any MCP client (Claude Code, our SDK agent) can now use it.
// Register:  claude mcp add lostfound -- node /ABSOLUTE/PATH/demos/03-mcp-server.mjs
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tools, runTool } from "./lib/tools.mjs";

const server = new McpServer({ name: "lostfound", version: "1.0.0" });

// Read-only tools only. add_item is deliberately NOT exposed: writes need a human (see guardrails).
for (const name of ["search_items", "get_item"]) {
  const t = tools[name];
  server.registerTool(name, { description: t.description, inputSchema: t.schema.shape }, async (args) => ({
    content: [{ type: "text", text: runTool(name, args) }],
  }));
}

await server.connect(new StdioServerTransport());

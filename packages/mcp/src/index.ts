/**
 * @burkut/mcp
 *
 * MCP (Model Context Protocol) server for spec-driven development.
 * Works with any MCP-compatible AI coding agent:
 *   Claude Code, Cursor, OpenCode, Windsurf, VS Code Copilot, Gemini CLI, ...
 *
 * Tools exposed:
 *   burkut_spec_init       — initialize Burkut in a project
 *   burkut_spec_new        — create a new spec
 *   burkut_spec_plan       — write spec content for one phase (requirements/design/tasks)
 *   burkut_spec_implement  — track task implementation status
 *   burkut_spec_status     — show all spec statuses and task progress
 *   burkut_spec_list       — list all specs
 *
 * Usage (add to your agent's MCP config):
 *   { "command": "npx", "args": ["-y", "@burkut/mcp"] }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { registerInit } from "./tools/init.js"
import { registerNew } from "./tools/new.js"
import { registerPlan } from "./tools/plan.js"
import { registerImplement } from "./tools/implement.js"
import { registerStatus } from "./tools/status.js"
import { registerList } from "./tools/list.js"

// Working directory is passed as first CLI arg, or defaults to process.cwd()
// This allows agents to specify which project to operate on.
const cwd = process.argv[2] ?? process.cwd()

const server = new McpServer({
  name: "burkut",
  version: "0.1.0-beta.1",
})

registerInit(server, cwd)
registerNew(server, cwd)
registerPlan(server, cwd)
registerImplement(server, cwd)
registerStatus(server, cwd)
registerList(server, cwd)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // Use stderr for logging — stdout is reserved for MCP protocol
  console.error("Burkut MCP server running (stdio)")
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})

import { StateManager, statusLabel } from "@burkut/core"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

export function registerList(server: McpServer, cwd: string): void {
  server.registerTool(
    "burkut_spec_list",
    {
      description:
        "List all specs in the current project with their status. " +
        "Returns a simple list of spec slugs and their lifecycle stage. " +
        "Use burkut_spec_status for more detailed information including task progress.",
      inputSchema: {},
    },
    async () => {
      const state = new StateManager(cwd)

      if (!(await state.exists())) {
        return {
          content: [{ type: "text", text: "Burkut is not initialized. Run burkut_spec_init first." }],
          isError: true,
        }
      }

      const specs = await state.listSpecs()

      if (specs.length === 0) {
        return {
          content: [{ type: "text", text: "No specs found. Run burkut_spec_new to create one." }],
        }
      }

      const projectState = await state.read()
      const lines = specs.map(({ slug, status }) => {
        const label = statusLabel(status)
        const isActive = projectState.activeSpec === slug
        return `  ${slug.padEnd(32)} ${label}${isActive ? " (active)" : ""}`
      })

      return {
        content: [{ type: "text", text: [`Specs (${specs.length}):`, "", ...lines].join("\n") }],
      }
    },
  )
}

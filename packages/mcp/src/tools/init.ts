import path from "node:path"
import { StateManager, createProjectConfig } from "@burkut/core"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export function registerInit(server: McpServer, cwd: string): void {
  server.registerTool(
    "burkut_spec_init",
    {
      description:
        "Initialize Burkut spec-driven development in the current project. " +
        "Creates the .specs/ directory, project state file, and burkut.config.md template. " +
        "Run this once before creating any specs. " +
        "After initialization, edit .specs/burkut.config.md to describe your project's " +
        "tech stack and conventions — the AI will read this context when generating specs.",
      inputSchema: {
        projectName: z
          .string()
          .optional()
          .describe("Optional project name. Defaults to the current directory name."),
      },
    },
    async ({ projectName }) => {
      const state = new StateManager(cwd)
      const alreadyExists = await state.exists()
      const name = projectName ?? path.basename(cwd)

      await state.init(name)
      await createProjectConfig(path.join(cwd, ".specs"), name)

      const message = alreadyExists
        ? [
            `Burkut re-initialized for project: ${name}`,
            "",
            "Existing specs were preserved.",
            "Edit .specs/burkut.config.md to update project context.",
          ].join("\n")
        : [
            `Burkut initialized for project: ${name}`,
            "",
            "Created:",
            "  .specs/.state.json       — project state",
            "  .specs/burkut.config.md  — project context (edit this!)",
            "  .specs/features/         — spec directory",
            "",
            "Next steps:",
            "  1. Edit .specs/burkut.config.md with your project context",
            "  2. Use burkut_spec_new to create your first spec",
          ].join("\n")

      return { content: [{ type: "text", text: message }] }
    },
  )
}

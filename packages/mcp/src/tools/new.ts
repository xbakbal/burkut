import { StateManager, createSpecFiles, toSlug, toTitle } from "@burkut/core"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export function registerNew(server: McpServer, cwd: string): void {
  server.registerTool(
    "burkut_spec_new",
    {
      description:
        "Create a new spec for a feature. " +
        "Generates blank requirements.md, design.md, and tasks.md template files " +
        "under .specs/features/<slug>/. " +
        "After creating, use burkut_spec_plan to write spec content phase by phase. " +
        "The spec name should describe the feature (e.g. 'user-authentication', 'payment-flow').",
      inputSchema: {
        name: z
          .string()
          .describe(
            "Feature name for the spec (e.g. 'user-authentication'). Will be converted to kebab-case slug.",
          ),
      },
    },
    async ({ name }) => {
      const state = new StateManager(cwd)

      if (!(await state.exists())) {
        return {
          content: [{ type: "text", text: "Burkut is not initialized. Run burkut_spec_init first." }],
          isError: true,
        }
      }

      const slug = toSlug(name)
      const title = toTitle(slug)

      if (!slug) {
        return {
          content: [{ type: "text", text: `Invalid spec name: "${name}". Use letters, numbers, and hyphens.` }],
          isError: true,
        }
      }

      const existingStatus = await state.getSpecStatus(slug)
      if (existingStatus) {
        return {
          content: [{
            type: "text",
            text: [
              `Spec "${slug}" already exists (status: ${existingStatus}).`,
              "Use burkut_spec_plan to generate or regenerate its content.",
            ].join("\n"),
          }],
        }
      }

      const specDir = state.specDir(slug)
      await createSpecFiles({ specDir, title, skipExisting: false })
      await state.addSpec(slug)

      return {
        content: [{
          type: "text",
          text: [
            `Spec created: ${slug}`,
            "",
            "Files created:",
            `  .specs/features/${slug}/requirements.md`,
            `  .specs/features/${slug}/design.md`,
            `  .specs/features/${slug}/tasks.md`,
            "",
            "Now generate the requirements phase:",
            `  burkut_spec_plan(name="${slug}", phase="requirements", content="<your generated markdown>")`,
          ].join("\n"),
        }],
      }
    },
  )
}

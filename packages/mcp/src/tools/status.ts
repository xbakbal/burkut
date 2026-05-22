import fs from "node:fs/promises"
import path from "node:path"
import { StateManager, parseTasks, statusLabel } from "@burkut/core"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

const STATUS_ICON: Record<string, string> = {
  draft: "○",
  requirements: "◐",
  design: "◑",
  tasks: "◕",
  implementing: "●",
  done: "✓",
}

export function registerStatus(server: McpServer, cwd: string): void {
  server.registerTool(
    "burkut_spec_status",
    {
      description:
        "Show the status of all specs in the current project. " +
        "Displays each spec's lifecycle stage (draft → requirements → design → tasks → implementing → done) " +
        "and task completion progress. Use this to get an overview of what's in progress.",
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

      const projectState = await state.read()
      const specs = await state.listSpecs()

      if (specs.length === 0) {
        return {
          content: [{ type: "text", text: "No specs found. Run burkut_spec_new to create one." }],
        }
      }

      const lines: string[] = []

      if (projectState.projectName) {
        lines.push(`Project: ${projectState.projectName}`, "")
      }

      for (const { slug, status } of specs) {
        const icon = STATUS_ICON[status] ?? "○"
        const label = statusLabel(status)
        const isActive = projectState.activeSpec === slug

        lines.push(`${icon} ${slug}${isActive ? " (active)" : ""}  [${label}]`)

        if (["tasks", "implementing", "done"].includes(status)) {
          try {
            const tasksMd = await fs.readFile(
              path.join(cwd, ".specs", "features", slug, "tasks.md"),
              "utf-8",
            )
            const tasks = parseTasks(tasksMd)
            const done = tasks.filter((t) => t.status === "done" || t.status === "skipped").length
            const inProgress = tasks.filter((t) => t.status === "in_progress").length
            const pending = tasks.filter((t) => t.status === "pending").length

            let progressLine = `  Tasks: ${done}/${tasks.length} done`
            if (inProgress > 0) progressLine += `, ${inProgress} in progress`
            if (pending > 0) progressLine += `, ${pending} pending`
            lines.push(progressLine)

            for (const t of tasks.filter((t) => t.status === "in_progress")) {
              lines.push(`    [~] ${t.id}: ${t.title}`)
            }
          } catch { /* tasks.md not yet created */ }
        }
      }

      lines.push("", `${specs.length} spec(s) total`)

      return { content: [{ type: "text", text: lines.join("\n") }] }
    },
  )
}

import fs from "node:fs/promises"
import path from "node:path"
import {
  StateManager,
  parseTasks,
  serializeTasks,
  isAtLeast,
  type Task,
} from "@burkut/core"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

function updateTaskStatus(tasks: Task[], taskId: string, status: Task["status"]): Task[] {
  return tasks.map((t) => (t.id === taskId ? { ...t, status } : t))
}

export function registerImplement(server: McpServer, cwd: string): void {
  server.registerTool(
    "burkut_spec_implement",
    {
      description:
        "Update the implementation status of a specific task in tasks.md. " +
        "Call this AFTER you have implemented a task (or are starting one) to keep " +
        "tasks.md in sync. The AI does the actual implementation using its file/code tools; " +
        "this tool only tracks the status. " +
        "Status values: 'in_progress' when starting a task, 'done' when finished, " +
        "'skipped' if intentionally skipping. " +
        "After marking all wave tasks as done, check burkut_spec_status to see the next wave.",
      inputSchema: {
        name: z.string().describe("Spec slug (e.g. 'user-authentication')"),
        taskId: z
          .string()
          .describe("Task ID to update (e.g. 'TASK-001')"),
        status: z
          .enum(["in_progress", "done", "skipped"])
          .describe("New status for the task"),
      },
    },
    async ({ name, taskId, status }) => {
      const state = new StateManager(cwd)

      if (!(await state.exists())) {
        return {
          content: [{ type: "text", text: "Burkut is not initialized. Run burkut_spec_init first." }],
          isError: true,
        }
      }

      const specStatus = await state.getSpecStatus(name)
      if (!specStatus) {
        return {
          content: [{ type: "text", text: `Spec "${name}" not found.` }],
          isError: true,
        }
      }

      if (!isAtLeast(specStatus, "tasks")) {
        return {
          content: [{
            type: "text",
            text: `Spec "${name}" has no tasks yet (status: ${specStatus}). Run burkut_spec_plan first.`,
          }],
          isError: true,
        }
      }

      const tasksPath = path.join(cwd, ".specs", "features", name, "tasks.md")
      let tasksMd: string
      try {
        tasksMd = await fs.readFile(tasksPath, "utf-8")
      } catch {
        return {
          content: [{ type: "text", text: `tasks.md not found for "${name}".` }],
          isError: true,
        }
      }

      let tasks = parseTasks(tasksMd)
      const task = tasks.find((t) => t.id === taskId)

      if (!task) {
        const available = tasks.map((t) => t.id).join(", ")
        return {
          content: [{
            type: "text",
            text: `Task "${taskId}" not found in "${name}". Available tasks: ${available}`,
          }],
          isError: true,
        }
      }

      tasks = updateTaskStatus(tasks, taskId, status)
      await fs.writeFile(tasksPath, serializeTasks(tasks), "utf-8")

      // Update overall spec status
      const allDone = tasks.every((t) => t.status === "done" || t.status === "skipped")
      if (allDone && specStatus !== "done") {
        await state.setSpecStatus(name, "done")
      } else if (status === "in_progress" && specStatus === "tasks") {
        await state.setSpecStatus(name, "implementing")
      }

      const done = tasks.filter((t) => t.status === "done" || t.status === "skipped").length
      const total = tasks.length

      const statusChar: Record<string, string> = {
        in_progress: "[~]",
        done: "[x]",
        skipped: "[-]",
      }

      return {
        content: [{
          type: "text",
          text: [
            `${statusChar[status] ?? "[?]"} ${taskId} marked as ${status}`,
            `Progress: ${done}/${total} tasks complete`,
            allDone ? `\n✓ All tasks done! Spec "${name}" is complete.` : "",
          ].join("\n").trim(),
        }],
      }
    },
  )
}

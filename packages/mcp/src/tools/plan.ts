import fs from "node:fs/promises"
import path from "node:path"
import {
  StateManager,
  parseRequirements,
  serializeRequirements,
  parseDesign,
  serializeDesign,
  parseTasks,
  serializeTasks,
  computeWaves,
  validateRequirements,
  validateTasks,
  isAtLeast,
  advance,
  toTitle,
} from "@burkut/core"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export function registerPlan(server: McpServer, cwd: string): void {
  server.registerTool(
    "burkut_spec_plan",
    {
      description:
        "Write spec content for a single planning phase. " +
        "The AI generates the markdown content and passes it here — this tool parses, " +
        "validates, and persists it to the correct file. " +
        "Phases must be run in order: requirements → design → tasks. " +
        "Run one phase at a time and show the result to the user for review before proceeding. " +
        "For the 'requirements' phase: generate EARS-notation requirements markdown and pass as content. " +
        "For 'design': generate a technical design document. " +
        "For 'tasks': generate a wave-ordered implementation task list. " +
        "If validation fails, fix the content and call again.",
      inputSchema: {
        name: z.string().describe("Spec slug (e.g. 'user-authentication')"),
        phase: z
          .enum(["requirements", "design", "tasks"])
          .describe("Which phase to write. Must run in order: requirements → design → tasks."),
        content: z
          .string()
          .describe(
            "The markdown content to write for this phase. " +
              "For requirements: use EARS notation (WHEN ... THE SYSTEM SHALL ...). " +
              "For design: include Overview, Components, Data Flow, Sequence Diagram, Technical Decisions. " +
              "For tasks: group by Wave 1/2/3... with [ ] checkboxes and Depends on / Refs metadata.",
          ),
      },
    },
    async ({ name, phase, content }) => {
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
          content: [{ type: "text", text: `Spec "${name}" not found. Run burkut_spec_new first.` }],
          isError: true,
        }
      }

      const specDir = path.join(cwd, ".specs", "features", name)
      const specTitle = toTitle(name)

      if (phase === "requirements") {
        const parsed = parseRequirements(content)

        if (parsed.length === 0) {
          return {
            content: [{
              type: "text",
              text: [
                "No requirements could be parsed from the content.",
                "Make sure to use EARS notation with '### REQ-NNN: Title' headings.",
                "Example:",
                "  ### REQ-001: Login",
                "  WHEN a user provides valid credentials THE SYSTEM SHALL authenticate the user",
                "",
                "  **Acceptance Criteria:**",
                "  - [ ] Returns JWT token on success",
              ].join("\n"),
            }],
            isError: true,
          }
        }

        const validation = validateRequirements(parsed)
        if (!validation.valid) {
          return {
            content: [{
              type: "text",
              text: [
                "Validation failed. Fix the following issues and call again:",
                "",
                ...validation.errors.map((e) => `  • ${e.field}: ${e.message}`),
              ].join("\n"),
            }],
            isError: true,
          }
        }

        const serialized = serializeRequirements(specTitle, parsed)
        await fs.mkdir(specDir, { recursive: true })
        await fs.writeFile(path.join(specDir, "requirements.md"), serialized, "utf-8")
        await state.setSpecStatus(name, "requirements")

        return {
          content: [{
            type: "text",
            text: [
              `✓ requirements.md written for "${name}" (${parsed.length} requirements)`,
              "",
              "Show the user the requirements and ask for approval.",
              "If approved, generate the design and call:",
              `  burkut_spec_plan(name="${name}", phase="design", content="<design markdown>")`,
            ].join("\n"),
          }],
        }
      }

      if (phase === "design") {
        if (!isAtLeast(specStatus, "requirements")) {
          return {
            content: [{
              type: "text",
              text: `Requirements must be completed first. Current status: ${specStatus}`,
            }],
            isError: true,
          }
        }

        const parsed = parseDesign(content)
        if (!parsed.overview || parsed.overview.trim().length === 0) {
          return {
            content: [{
              type: "text",
              text: "Design must include an Overview section. Add '## Overview' with a description.",
            }],
            isError: true,
          }
        }

        const serialized = serializeDesign(specTitle, parsed)
        await fs.writeFile(path.join(specDir, "design.md"), serialized, "utf-8")
        await state.setSpecStatus(name, advance("requirements"))

        return {
          content: [{
            type: "text",
            text: [
              `✓ design.md written for "${name}" (${parsed.components.length} components)`,
              "",
              "Show the user the design and ask for approval.",
              "If approved, generate the tasks and call:",
              `  burkut_spec_plan(name="${name}", phase="tasks", content="<tasks markdown>")`,
            ].join("\n"),
          }],
        }
      }

      if (phase === "tasks") {
        if (!isAtLeast(specStatus, "design")) {
          return {
            content: [{
              type: "text",
              text: `Design must be completed first. Current status: ${specStatus}`,
            }],
            isError: true,
          }
        }

        const rawTasks = parseTasks(content)
        if (rawTasks.length === 0) {
          return {
            content: [{
              type: "text",
              text: [
                "No tasks could be parsed from the content.",
                "Make sure to use the format:",
                "  ## Wave 1 (parallel)",
                "  - [ ] TASK-001: Task title",
                "    - Refs: REQ-001",
              ].join("\n"),
            }],
            isError: true,
          }
        }

        const validation = validateTasks(rawTasks)
        if (!validation.valid) {
          return {
            content: [{
              type: "text",
              text: [
                "Validation failed. Fix the following issues and call again:",
                "",
                ...validation.errors.map((e) => `  • ${e.field}: ${e.message}`),
              ].join("\n"),
            }],
            isError: true,
          }
        }

        const { tasks, hasCycle, cycleNodes } = computeWaves(rawTasks)
        const serialized = serializeTasks(tasks)
        await fs.writeFile(path.join(specDir, "tasks.md"), serialized, "utf-8")
        await state.setSpecStatus(name, advance("design"))

        const maxWave = Math.max(...tasks.map((t) => t.wave))
        const warnings = hasCycle
          ? [`⚠ Cycle detected in tasks: ${cycleNodes.join(", ")}. Check dependencies.`]
          : []

        return {
          content: [{
            type: "text",
            text: [
              `✓ tasks.md written for "${name}" (${tasks.length} tasks in ${maxWave} wave${maxWave > 1 ? "s" : ""})`,
              ...warnings,
              "",
              "Show the user the tasks and ask for approval.",
              "If approved, start implementing with:",
              `  burkut_spec_implement(name="${name}", taskId="TASK-001", status="in_progress")`,
            ].join("\n"),
          }],
        }
      }

      return { content: [{ type: "text", text: `Unknown phase: ${phase}` }], isError: true }
    },
  )
}

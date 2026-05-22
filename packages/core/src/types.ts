import { z } from "zod"

// ─── Spec Lifecycle ──────────────────────────────────────────────────────────

const SpecStatusSchema = z.enum([
  "draft",
  "requirements",
  "design",
  "tasks",
  "implementing",
  "done",
])

export type SpecStatus = z.infer<typeof SpecStatusSchema>

// ─── Task Status ─────────────────────────────────────────────────────────────

const TaskStatusSchema = z.enum([
  "pending",     // [ ]
  "in_progress", // [~]
  "done",        // [x]
  "skipped",     // [-]
])

export type TaskStatus = z.infer<typeof TaskStatusSchema>

// ─── Phase ───────────────────────────────────────────────────────────────────

export type Phase = "requirements" | "design" | "tasks"

// ─── Requirement ─────────────────────────────────────────────────────────────

export interface Requirement {
  id: string           // e.g. "REQ-001"
  title: string
  ears: string         // EARS notation string
  acceptanceCriteria: string[]
}

// ─── Design ──────────────────────────────────────────────────────────────────

export interface Design {
  overview: string
  components: Array<{ name: string; description: string }>
  dataFlow?: string
  sequenceDiagram?: string  // Mermaid
  technicalDecisions: string[]
  testingStrategy?: string
}

// ─── Task ────────────────────────────────────────────────────────────────────

export interface Task {
  id: string            // e.g. "TASK-001"
  title: string
  description?: string
  status: TaskStatus
  dependsOn: string[]   // Task IDs
  wave: number          // Parallel execution wave (>= 1)
  requirementRefs: string[]  // REQ-xxx references
}

// ─── Project State ───────────────────────────────────────────────────────────

export const ProjectStateSchema = z.object({
  version: z.string(),
  projectName: z.string().optional(),
  specs: z.record(z.string(), SpecStatusSchema),  // slug -> status
  activeSpec: z.string().optional(),              // slug of current spec
})

export type ProjectState = z.infer<typeof ProjectStateSchema>

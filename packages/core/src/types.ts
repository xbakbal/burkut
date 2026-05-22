import { z } from "zod"

// ─── Spec Lifecycle ──────────────────────────────────────────────────────────

export const SpecStatusSchema = z.enum([
  "draft",
  "requirements",
  "design",
  "tasks",
  "implementing",
  "done",
])

export type SpecStatus = z.infer<typeof SpecStatusSchema>

// ─── Task Status ─────────────────────────────────────────────────────────────

export const TaskStatusSchema = z.enum([
  "pending",    // [ ]
  "in_progress", // [~]
  "done",       // [x]
  "skipped",    // [-]
])

export type TaskStatus = z.infer<typeof TaskStatusSchema>

// ─── Phase ───────────────────────────────────────────────────────────────────

export const PhaseSchema = z.enum(["requirements", "design", "tasks"])

export type Phase = z.infer<typeof PhaseSchema>

// ─── Requirement ─────────────────────────────────────────────────────────────

export const RequirementSchema = z.object({
  id: z.string(),          // e.g. "REQ-001"
  title: z.string(),
  ears: z.string(),        // EARS notation string
  acceptanceCriteria: z.array(z.string()),
})

export type Requirement = z.infer<typeof RequirementSchema>

// ─── Design ──────────────────────────────────────────────────────────────────

export const DesignSchema = z.object({
  overview: z.string(),
  components: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
  dataFlow: z.string().optional(),
  sequenceDiagram: z.string().optional(),  // Mermaid
  technicalDecisions: z.array(z.string()),
  testingStrategy: z.string().optional(),
})

export type Design = z.infer<typeof DesignSchema>

// ─── Task ────────────────────────────────────────────────────────────────────

export const TaskSchema = z.object({
  id: z.string(),           // e.g. "TASK-001"
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusSchema,
  dependsOn: z.array(z.string()),  // Task IDs
  wave: z.number().int().min(1),   // Parallel execution wave
  requirementRefs: z.array(z.string()),  // REQ-xxx references
})

export type Task = z.infer<typeof TaskSchema>

// ─── Spec ────────────────────────────────────────────────────────────────────

export const SpecSchema = z.object({
  name: z.string(),
  slug: z.string(),        // kebab-case, used as directory name
  description: z.string().optional(),
  status: SpecStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  requirements: z.array(RequirementSchema),
  design: DesignSchema.optional(),
  tasks: z.array(TaskSchema),
})

export type Spec = z.infer<typeof SpecSchema>

// ─── Project State ───────────────────────────────────────────────────────────

export const ProjectStateSchema = z.object({
  version: z.string(),
  projectName: z.string().optional(),
  specs: z.record(z.string(), SpecStatusSchema),  // slug -> status
  activeSpec: z.string().optional(),              // slug of current spec
})

export type ProjectState = z.infer<typeof ProjectStateSchema>

// ─── Result type ─────────────────────────────────────────────────────────────

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function err<E = Error>(error: E): Result<never, E> {
  return { ok: false, error }
}

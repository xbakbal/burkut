import type { SpecStatus } from "../types.js"

const LIFECYCLE_ORDER: SpecStatus[] = [
  "draft",
  "requirements",
  "design",
  "tasks",
  "implementing",
  "done",
]

const FORWARD_TRANSITIONS: Partial<Record<SpecStatus, SpecStatus>> = {
  draft: "requirements",
  requirements: "design",
  design: "tasks",
  tasks: "implementing",
  implementing: "done",
}

export function advance(status: SpecStatus): SpecStatus {
  const next = FORWARD_TRANSITIONS[status]
  if (!next) throw new Error(`Cannot advance from terminal status: ${status}`)
  return next
}

export function isAtLeast(status: SpecStatus, minimum: SpecStatus): boolean {
  return LIFECYCLE_ORDER.indexOf(status) >= LIFECYCLE_ORDER.indexOf(minimum)
}

export function statusLabel(status: SpecStatus): string {
  const labels: Record<SpecStatus, string> = {
    draft: "Draft",
    requirements: "Requirements Ready",
    design: "Design Ready",
    tasks: "Tasks Ready",
    implementing: "Implementing",
    done: "Done",
  }
  return labels[status]
}

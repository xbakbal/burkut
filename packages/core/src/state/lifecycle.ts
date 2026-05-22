/**
 * Spec lifecycle manager
 *
 * Valid transitions:
 *   draft        → requirements
 *   requirements → design
 *   design       → tasks
 *   tasks        → implementing
 *   implementing → done
 *
 * Any state can go back to the previous one (for re-generation).
 */

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

const BACKWARD_TRANSITIONS: Partial<Record<SpecStatus, SpecStatus>> = {
  requirements: "draft",
  design: "requirements",
  tasks: "design",
  implementing: "tasks",
  done: "implementing",
}

export function canAdvance(status: SpecStatus): boolean {
  return status in FORWARD_TRANSITIONS
}

export function canRevert(status: SpecStatus): boolean {
  return status in BACKWARD_TRANSITIONS
}

export function advance(status: SpecStatus): SpecStatus {
  const next = FORWARD_TRANSITIONS[status]
  if (!next) throw new Error(`Cannot advance from terminal status: ${status}`)
  return next
}

export function revert(status: SpecStatus): SpecStatus {
  const prev = BACKWARD_TRANSITIONS[status]
  if (!prev) throw new Error(`Cannot revert from initial status: ${status}`)
  return prev
}

export function statusIndex(status: SpecStatus): number {
  return LIFECYCLE_ORDER.indexOf(status)
}

export function isAtLeast(status: SpecStatus, minimum: SpecStatus): boolean {
  return statusIndex(status) >= statusIndex(minimum)
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

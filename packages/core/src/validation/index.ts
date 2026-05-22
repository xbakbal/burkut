/**
 * Validation utilities for spec documents
 */

import type { Requirement, Task } from "../types.js"

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// ─── EARS Notation ────────────────────────────────────────────────────────────

/**
 * EARS (Easy Approach to Requirements Syntax) patterns:
 *   Ubiquitous:   THE SYSTEM SHALL <action>
 *   Event-driven: WHEN <trigger> THE SYSTEM SHALL <action>
 *   State-driven: WHILE <state> THE SYSTEM SHALL <action>
 *   Optional:     WHERE <feature> THE SYSTEM SHALL <action>
 *   Unwanted:     IF <condition> THEN THE SYSTEM SHALL <action>
 *   Complex:      WHEN <trigger> WHILE <state> THE SYSTEM SHALL <action>
 */
const EARS_PATTERNS = [
  /THE SYSTEM SHALL/i,
  /WHEN .+ THE SYSTEM SHALL/i,
  /WHILE .+ THE SYSTEM SHALL/i,
  /WHERE .+ THE SYSTEM SHALL/i,
  /IF .+ THEN THE SYSTEM SHALL/i,
]

export function isValidEars(ears: string): boolean {
  return EARS_PATTERNS.some((pattern) => pattern.test(ears))
}

// ─── Requirement Validation ───────────────────────────────────────────────────

export function validateRequirement(req: Requirement): ValidationResult {
  const errors: ValidationError[] = []

  if (!req.id.match(/^REQ-\d{3,}$/)) {
    errors.push({ field: "id", message: `Invalid requirement ID format: "${req.id}". Expected REQ-NNN` })
  }

  if (!req.title || req.title.trim().length === 0) {
    errors.push({ field: "title", message: "Requirement title cannot be empty" })
  }

  if (!req.ears || req.ears.trim().length === 0) {
    errors.push({ field: "ears", message: "EARS notation string is required" })
  } else if (!isValidEars(req.ears)) {
    errors.push({
      field: "ears",
      message: `EARS notation must contain "THE SYSTEM SHALL". Got: "${req.ears.slice(0, 80)}..."`,
    })
  }

  if (req.acceptanceCriteria.length === 0) {
    errors.push({ field: "acceptanceCriteria", message: "At least one acceptance criterion is required" })
  }

  return { valid: errors.length === 0, errors }
}

export function validateRequirements(requirements: Requirement[]): ValidationResult {
  const errors: ValidationError[] = []

  if (requirements.length === 0) {
    errors.push({ field: "requirements", message: "At least one requirement is needed" })
    return { valid: false, errors }
  }

  // Check for duplicate IDs
  const ids = requirements.map((r) => r.id)
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
  for (const dup of [...new Set(duplicates)]) {
    errors.push({ field: "id", message: `Duplicate requirement ID: ${dup}` })
  }

  for (const req of requirements) {
    const result = validateRequirement(req)
    errors.push(...result.errors)
  }

  return { valid: errors.length === 0, errors }
}

// ─── Task Validation ──────────────────────────────────────────────────────────

export function validateTask(task: Task, allTaskIds: Set<string>): ValidationResult {
  const errors: ValidationError[] = []

  if (!task.id.match(/^TASK-\d{3,}$/)) {
    errors.push({ field: "id", message: `Invalid task ID format: "${task.id}". Expected TASK-NNN` })
  }

  if (!task.title || task.title.trim().length === 0) {
    errors.push({ field: "title", message: "Task title cannot be empty" })
  }

  if (task.wave < 1) {
    errors.push({ field: "wave", message: "Wave must be >= 1" })
  }

  for (const dep of task.dependsOn) {
    if (!allTaskIds.has(dep)) {
      errors.push({ field: "dependsOn", message: `Unknown dependency: ${dep}` })
    }
    if (dep === task.id) {
      errors.push({ field: "dependsOn", message: `Task ${task.id} cannot depend on itself` })
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validateTasks(tasks: Task[]): ValidationResult {
  const errors: ValidationError[] = []
  const allIds = new Set(tasks.map((t) => t.id))

  // Duplicate IDs
  const ids = tasks.map((t) => t.id)
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
  for (const dup of [...new Set(duplicates)]) {
    errors.push({ field: "id", message: `Duplicate task ID: ${dup}` })
  }

  for (const task of tasks) {
    const result = validateTask(task, allIds)
    errors.push(...result.errors)
  }

  return { valid: errors.length === 0, errors }
}

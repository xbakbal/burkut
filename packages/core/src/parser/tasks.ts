/**
 * tasks.md parser & serializer
 *
 * Format:
 *   # Implementation Tasks
 *
 *   ## Wave 1 (parallel)
 *   - [ ] TASK-001: Title
 *   - [x] TASK-002: Title
 *     - Depends on: none
 *     - Refs: REQ-001, REQ-002
 *
 *   ## Wave 2 (depends on Wave 1)
 *   - [~] TASK-003: Title
 *     - Depends on: TASK-001, TASK-002
 *     - Refs: REQ-001
 */

import type { Task, TaskStatus } from "../types.js"

const STATUS_CHAR: Record<string, TaskStatus> = {
  " ": "pending",
  "~": "in_progress",
  x: "done",
  "-": "skipped",
}

const CHAR_STATUS: Record<TaskStatus, string> = {
  pending: " ",
  in_progress: "~",
  done: "x",
  skipped: "-",
}

// ─── Parser ──────────────────────────────────────────────────────────────────

export function parseTasks(markdown: string): Task[] {
  const tasks: Task[] = []
  const lines = markdown.split("\n")

  let currentWave = 1

  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ""

    // Wave heading: ## Wave N ...
    const waveMatch = line.match(/^##\s+Wave\s+(\d+)/i)
    if (waveMatch) {
      currentWave = parseInt(waveMatch[1]!, 10)
      i++
      continue
    }

    // Task line: - [X] TASK-001: Title
    const taskMatch = line.match(/^-\s+\[([x ~\-])\]\s+(TASK-\d+):\s+(.+)$/i)
    if (taskMatch) {
      const statusChar = taskMatch[1]!.toLowerCase()
      const id = taskMatch[2]!
      const title = taskMatch[3]!
      const status: TaskStatus = STATUS_CHAR[statusChar] ?? "pending"

      let dependsOn: string[] = []
      let requirementRefs: string[] = []

      // Read indented metadata lines
      i++
      while (i < lines.length) {
        const meta = lines[i] ?? ""
        if (!meta.startsWith("  ") && meta.trim().length > 0) break

        const depsMatch = meta.match(/^\s+-\s+Depends on:\s+(.+)$/i)
        if (depsMatch) {
          const raw = depsMatch[1]!.trim()
          dependsOn = raw.toLowerCase() === "none" ? [] : raw.split(/,\s*/)
          i++
          continue
        }

        const refsMatch = meta.match(/^\s+-\s+Refs:\s+(.+)$/i)
        if (refsMatch) {
          requirementRefs = refsMatch[1]!.trim().split(/,\s*/)
          i++
          continue
        }

        i++
      }

      tasks.push({ id, title, status, dependsOn, wave: currentWave, requirementRefs })
      continue
    }

    i++
  }

  return tasks
}

// ─── Serializer ──────────────────────────────────────────────────────────────

export function serializeTasks(tasks: Task[]): string {
  const lines: string[] = ["# Implementation Tasks", ""]

  // Group by wave
  const byWave = new Map<number, Task[]>()
  for (const task of tasks) {
    const existing = byWave.get(task.wave) ?? []
    existing.push(task)
    byWave.set(task.wave, existing)
  }

  const waveNums = [...byWave.keys()].sort((a, b) => a - b)

  for (const waveNum of waveNums) {
    const waveTasks = byWave.get(waveNum)!
    const prevWave = waveNum === 1 ? "(parallel)" : `(depends on Wave ${waveNum - 1})`
    lines.push(`## Wave ${waveNum} ${prevWave}`)

    for (const task of waveTasks) {
      const char = CHAR_STATUS[task.status]
      lines.push(`- [${char}] ${task.id}: ${task.title}`)

      if (task.dependsOn.length > 0) {
        lines.push(`  - Depends on: ${task.dependsOn.join(", ")}`)
      }
      if (task.requirementRefs.length > 0) {
        lines.push(`  - Refs: ${task.requirementRefs.join(", ")}`)
      }
      if (task.description) {
        lines.push(`  - ${task.description}`)
      }
    }

    lines.push("")
  }

  return lines.join("\n")
}

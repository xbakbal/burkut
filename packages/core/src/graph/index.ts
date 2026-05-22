/**
 * Task dependency graph + wave assignment
 *
 * A "wave" groups tasks that can run in parallel.
 * Wave N can start only after all tasks in Wave N-1 are done.
 *
 * Algorithm: topological sort via Kahn's algorithm,
 * then assign each task to wave = max(wave of deps) + 1.
 */

import type { Task } from "../types.js"

export interface GraphResult {
  /** Tasks with wave numbers assigned */
  tasks: Task[]
  /** Whether a cycle was detected */
  hasCycle: boolean
  /** Task IDs involved in the cycle (if any) */
  cycleNodes: string[]
}

export function computeWaves(tasks: Task[]): GraphResult {
  if (tasks.length === 0) {
    return { tasks: [], hasCycle: false, cycleNodes: [] }
  }

  const taskMap = new Map<string, Task>(tasks.map((t) => [t.id, t]))

  // Build adjacency + in-degree for Kahn's
  const inDegree = new Map<string, number>()
  const dependents = new Map<string, string[]>() // id -> tasks that depend on id

  for (const task of tasks) {
    inDegree.set(task.id, task.dependsOn.length)
    dependents.set(task.id, dependents.get(task.id) ?? [])
    for (const dep of task.dependsOn) {
      const list = dependents.get(dep) ?? []
      list.push(task.id)
      dependents.set(dep, list)
    }
  }

  // Wave assignment: wave[id] = max(wave[dep]) + 1 for all deps, or 1 if no deps
  const waveMap = new Map<string, number>()
  const queue: string[] = []

  // Seed queue with tasks that have no dependencies
  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      queue.push(id)
      waveMap.set(id, 1)
    }
  }

  const processed: string[] = []

  while (queue.length > 0) {
    const id = queue.shift()!
    processed.push(id)
    const currentWave = waveMap.get(id) ?? 1

    for (const dependentId of dependents.get(id) ?? []) {
      // Update wave for dependent: it must be at least currentWave + 1
      const existingWave = waveMap.get(dependentId) ?? 0
      waveMap.set(dependentId, Math.max(existingWave, currentWave + 1))

      const newDeg = (inDegree.get(dependentId) ?? 1) - 1
      inDegree.set(dependentId, newDeg)
      if (newDeg === 0) {
        queue.push(dependentId)
      }
    }
  }

  // Cycle detection: any node not processed is part of a cycle
  const cycleNodes = tasks.map((t) => t.id).filter((id) => !processed.includes(id))

  // Apply computed waves back to tasks
  const updatedTasks: Task[] = tasks.map((task) => {
    const task_ = taskMap.get(task.id)!
    return { ...task_, wave: waveMap.get(task.id) ?? task_.wave }
  })

  return {
    tasks: updatedTasks,
    hasCycle: cycleNodes.length > 0,
    cycleNodes,
  }
}

/** Sort tasks by wave, then by their original order within each wave */
export function sortByWave(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.wave !== b.wave) return a.wave - b.wave
    return a.id.localeCompare(b.id)
  })
}

/** Get the next batch of tasks that can run (all pending tasks in the lowest wave) */
export function nextPendingWave(tasks: Task[]): Task[] {
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress")
  if (pendingTasks.length === 0) return []

  const minWave = Math.min(...pendingTasks.map((t) => t.wave))
  return pendingTasks.filter((t) => t.wave === minWave)
}

/** Check if all dependencies of a task are done */
export function areDependenciesMet(task: Task, allTasks: Task[]): boolean {
  const taskMap = new Map(allTasks.map((t) => [t.id, t]))
  return task.dependsOn.every((depId) => taskMap.get(depId)?.status === "done")
}

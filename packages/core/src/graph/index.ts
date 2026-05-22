/**
 * Task dependency graph + wave assignment
 *
 * A "wave" groups tasks that can run in parallel.
 * Wave N can start only after all tasks in Wave N-1 are done.
 *
 * Algorithm: Kahn's algorithm (topological sort) — processes nodes level by
 * level, assigning each task to wave = max(wave of deps) + 1.
 */

import type { Task } from "../types.js"

export interface GraphResult {
  /** Tasks with wave numbers re-computed from their dependencies */
  tasks: Task[]
  /** Whether a circular dependency was detected */
  hasCycle: boolean
  /** Task IDs involved in the cycle (if any) */
  cycleNodes: string[]
}

export function computeWaves(tasks: Task[]): GraphResult {
  if (tasks.length === 0) {
    return { tasks: [], hasCycle: false, cycleNodes: [] }
  }

  const taskMap = new Map<string, Task>(tasks.map((t) => [t.id, t]))

  // Build adjacency + in-degree maps
  const inDegree = new Map<string, number>()
  const dependents = new Map<string, string[]>() // id → tasks that depend on it

  for (const task of tasks) {
    inDegree.set(task.id, task.dependsOn.length)
    dependents.set(task.id, dependents.get(task.id) ?? [])
    for (const dep of task.dependsOn) {
      const list = dependents.get(dep) ?? []
      list.push(task.id)
      dependents.set(dep, list)
    }
  }

  const waveMap = new Map<string, number>()
  const queue: string[] = []

  // Seed: tasks with no dependencies start at wave 1
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
      const existingWave = waveMap.get(dependentId) ?? 0
      waveMap.set(dependentId, Math.max(existingWave, currentWave + 1))

      const newDeg = (inDegree.get(dependentId) ?? 1) - 1
      inDegree.set(dependentId, newDeg)
      if (newDeg === 0) {
        queue.push(dependentId)
      }
    }
  }

  // Any node not processed is part of a cycle
  const cycleNodes = tasks.map((t) => t.id).filter((id) => !processed.includes(id))

  const updatedTasks: Task[] = tasks.map((task) => {
    const original = taskMap.get(task.id)!
    return { ...original, wave: waveMap.get(task.id) ?? original.wave }
  })

  return { tasks: updatedTasks, hasCycle: cycleNodes.length > 0, cycleNodes }
}

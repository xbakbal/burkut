import { describe, it, expect } from "vitest"
import { computeWaves, nextPendingWave, areDependenciesMet, sortByWave } from "../graph/index.js"
import type { Task } from "../types.js"

function makeTask(id: string, dependsOn: string[] = [], wave = 1, status: Task["status"] = "pending"): Task {
  return { id, title: id, status, dependsOn, wave, requirementRefs: [] }
}

describe("computeWaves", () => {
  it("assigns wave 1 to tasks with no deps", () => {
    const tasks = [makeTask("TASK-001"), makeTask("TASK-002")]
    const { tasks: result } = computeWaves(tasks)
    expect(result[0]!.wave).toBe(1)
    expect(result[1]!.wave).toBe(1)
  })

  it("assigns wave 2 to tasks that depend on wave 1", () => {
    const tasks = [
      makeTask("TASK-001"),
      makeTask("TASK-002"),
      makeTask("TASK-003", ["TASK-001", "TASK-002"]),
    ]
    const { tasks: result } = computeWaves(tasks)
    const t3 = result.find((t) => t.id === "TASK-003")!
    expect(t3.wave).toBe(2)
  })

  it("handles a 3-level dependency chain", () => {
    const tasks = [
      makeTask("TASK-001"),
      makeTask("TASK-002", ["TASK-001"]),
      makeTask("TASK-003", ["TASK-002"]),
    ]
    const { tasks: result, hasCycle } = computeWaves(tasks)
    expect(hasCycle).toBe(false)
    expect(result.find((t) => t.id === "TASK-001")!.wave).toBe(1)
    expect(result.find((t) => t.id === "TASK-002")!.wave).toBe(2)
    expect(result.find((t) => t.id === "TASK-003")!.wave).toBe(3)
  })

  it("detects a cycle", () => {
    const tasks = [
      makeTask("TASK-001", ["TASK-002"]),
      makeTask("TASK-002", ["TASK-001"]),
    ]
    const { hasCycle, cycleNodes } = computeWaves(tasks)
    expect(hasCycle).toBe(true)
    expect(cycleNodes).toContain("TASK-001")
    expect(cycleNodes).toContain("TASK-002")
  })

  it("handles empty input", () => {
    const { tasks, hasCycle } = computeWaves([])
    expect(tasks).toHaveLength(0)
    expect(hasCycle).toBe(false)
  })
})

describe("nextPendingWave", () => {
  it("returns the lowest-wave pending tasks", () => {
    const tasks = [
      makeTask("TASK-001", [], 1, "done"),
      makeTask("TASK-002", [], 1, "done"),
      makeTask("TASK-003", [], 2, "pending"),
      makeTask("TASK-004", [], 2, "pending"),
      makeTask("TASK-005", [], 3, "pending"),
    ]
    const next = nextPendingWave(tasks)
    expect(next).toHaveLength(2)
    expect(next.map((t) => t.id)).toEqual(["TASK-003", "TASK-004"])
  })

  it("returns empty when all tasks done", () => {
    const tasks = [makeTask("TASK-001", [], 1, "done")]
    expect(nextPendingWave(tasks)).toHaveLength(0)
  })
})

describe("areDependenciesMet", () => {
  it("returns true when all deps are done", () => {
    const tasks = [
      makeTask("TASK-001", [], 1, "done"),
      makeTask("TASK-002", [], 1, "done"),
      makeTask("TASK-003", ["TASK-001", "TASK-002"], 2, "pending"),
    ]
    expect(areDependenciesMet(tasks[2]!, tasks)).toBe(true)
  })

  it("returns false when a dep is still pending", () => {
    const tasks = [
      makeTask("TASK-001", [], 1, "done"),
      makeTask("TASK-002", [], 1, "pending"),
      makeTask("TASK-003", ["TASK-001", "TASK-002"], 2, "pending"),
    ]
    expect(areDependenciesMet(tasks[2]!, tasks)).toBe(false)
  })

  it("returns true for a task with no deps", () => {
    const tasks = [makeTask("TASK-001")]
    expect(areDependenciesMet(tasks[0]!, tasks)).toBe(true)
  })
})

describe("sortByWave", () => {
  it("sorts tasks in ascending wave order", () => {
    const tasks = [
      makeTask("TASK-003", [], 3),
      makeTask("TASK-001", [], 1),
      makeTask("TASK-002", [], 2),
    ]
    const sorted = sortByWave(tasks)
    expect(sorted[0]!.wave).toBe(1)
    expect(sorted[1]!.wave).toBe(2)
    expect(sorted[2]!.wave).toBe(3)
  })
})

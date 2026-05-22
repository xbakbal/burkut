import { describe, it, expect } from "vitest"
import { computeWaves } from "../graph/index.js"
import type { Task } from "../types.js"

function makeTask(id: string, dependsOn: string[] = [], wave = 1, status: Task["status"] = "pending"): Task {
  return { id, title: id, status, dependsOn, wave, requirementRefs: [] }
}

describe("computeWaves", () => {
  it("assigns wave 1 to tasks with no dependencies", () => {
    const { tasks } = computeWaves([makeTask("TASK-001"), makeTask("TASK-002")])
    expect(tasks[0]!.wave).toBe(1)
    expect(tasks[1]!.wave).toBe(1)
  })

  it("assigns wave 2 to tasks that depend on wave 1 tasks", () => {
    const { tasks } = computeWaves([
      makeTask("TASK-001"),
      makeTask("TASK-002"),
      makeTask("TASK-003", ["TASK-001", "TASK-002"]),
    ])
    expect(tasks.find((t) => t.id === "TASK-003")!.wave).toBe(2)
  })

  it("handles a 3-level dependency chain", () => {
    const { tasks, hasCycle } = computeWaves([
      makeTask("TASK-001"),
      makeTask("TASK-002", ["TASK-001"]),
      makeTask("TASK-003", ["TASK-002"]),
    ])
    expect(hasCycle).toBe(false)
    expect(tasks.find((t) => t.id === "TASK-001")!.wave).toBe(1)
    expect(tasks.find((t) => t.id === "TASK-002")!.wave).toBe(2)
    expect(tasks.find((t) => t.id === "TASK-003")!.wave).toBe(3)
  })

  it("detects circular dependencies", () => {
    const { hasCycle, cycleNodes } = computeWaves([
      makeTask("TASK-001", ["TASK-002"]),
      makeTask("TASK-002", ["TASK-001"]),
    ])
    expect(hasCycle).toBe(true)
    expect(cycleNodes).toContain("TASK-001")
    expect(cycleNodes).toContain("TASK-002")
  })

  it("handles empty task list", () => {
    const { tasks, hasCycle } = computeWaves([])
    expect(tasks).toHaveLength(0)
    expect(hasCycle).toBe(false)
  })

  it("assigns max wave when task depends on multiple waves", () => {
    // TASK-003 depends on TASK-001 (wave 1) and TASK-002 (wave 2)
    // It should be in wave 3, not wave 2
    const { tasks } = computeWaves([
      makeTask("TASK-001"),
      makeTask("TASK-002", ["TASK-001"]),
      makeTask("TASK-003", ["TASK-001", "TASK-002"]),
    ])
    expect(tasks.find((t) => t.id === "TASK-003")!.wave).toBe(3)
  })
})

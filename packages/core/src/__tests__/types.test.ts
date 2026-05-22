import { describe, it, expect } from "vitest"
import type { SpecStatus, TaskStatus, Phase, Requirement, Task } from "../types.js"

describe("SpecStatus type", () => {
  it("accepts all valid status values", () => {
    const statuses: SpecStatus[] = ["draft", "requirements", "design", "tasks", "implementing", "done"]
    expect(statuses).toHaveLength(6)
  })
})

describe("TaskStatus type", () => {
  it("accepts all valid status values", () => {
    const statuses: TaskStatus[] = ["pending", "in_progress", "done", "skipped"]
    expect(statuses).toHaveLength(4)
  })
})

describe("Phase type", () => {
  it("covers the three planning phases", () => {
    const phases: Phase[] = ["requirements", "design", "tasks"]
    expect(phases).toHaveLength(3)
  })
})

describe("Requirement interface", () => {
  it("constructs a valid requirement", () => {
    const req: Requirement = {
      id: "REQ-001",
      title: "User Login",
      ears: "WHEN a user provides valid credentials THE SYSTEM SHALL authenticate the user",
      acceptanceCriteria: ["Returns JWT token", "Returns 401 on failure"],
    }
    expect(req.id).toBe("REQ-001")
    expect(req.acceptanceCriteria).toHaveLength(2)
  })
})

describe("Task interface", () => {
  it("constructs a valid task", () => {
    const task: Task = {
      id: "TASK-001",
      title: "Create user model",
      status: "pending",
      dependsOn: [],
      wave: 1,
      requirementRefs: ["REQ-001"],
    }
    expect(task.wave).toBe(1)
    expect(task.description).toBeUndefined()
  })
})

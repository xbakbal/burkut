import { describe, it, expect } from "vitest"
import {
  SpecStatusSchema,
  TaskStatusSchema,
  PhaseSchema,
  RequirementSchema,
  TaskSchema,
  SpecSchema,
  ok,
  err,
} from "../types.js"

describe("SpecStatusSchema", () => {
  it("accepts valid statuses", () => {
    const statuses = ["draft", "requirements", "design", "tasks", "implementing", "done"] as const
    for (const s of statuses) {
      expect(SpecStatusSchema.parse(s)).toBe(s)
    }
  })

  it("rejects invalid status", () => {
    expect(() => SpecStatusSchema.parse("unknown")).toThrow()
  })
})

describe("TaskStatusSchema", () => {
  it("accepts valid statuses", () => {
    const statuses = ["pending", "in_progress", "done", "skipped"] as const
    for (const s of statuses) {
      expect(TaskStatusSchema.parse(s)).toBe(s)
    }
  })
})

describe("PhaseSchema", () => {
  it("accepts valid phases", () => {
    expect(PhaseSchema.parse("requirements")).toBe("requirements")
    expect(PhaseSchema.parse("design")).toBe("design")
    expect(PhaseSchema.parse("tasks")).toBe("tasks")
  })
})

describe("RequirementSchema", () => {
  it("parses a valid requirement", () => {
    const req = RequirementSchema.parse({
      id: "REQ-001",
      title: "User Login",
      ears: "WHEN a user provides valid credentials THE SYSTEM SHALL authenticate the user",
      acceptanceCriteria: ["Returns JWT token", "Returns 401 on failure"],
    })
    expect(req.id).toBe("REQ-001")
  })
})

describe("TaskSchema", () => {
  it("parses a valid task", () => {
    const task = TaskSchema.parse({
      id: "TASK-001",
      title: "Create user model",
      status: "pending",
      dependsOn: [],
      wave: 1,
      requirementRefs: ["REQ-001"],
    })
    expect(task.wave).toBe(1)
  })

  it("rejects wave < 1", () => {
    expect(() =>
      TaskSchema.parse({
        id: "TASK-001",
        title: "x",
        status: "pending",
        dependsOn: [],
        wave: 0,
        requirementRefs: [],
      }),
    ).toThrow()
  })
})

describe("SpecSchema", () => {
  it("parses a minimal valid spec", () => {
    const spec = SpecSchema.parse({
      name: "User Auth",
      slug: "user-auth",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requirements: [],
      tasks: [],
    })
    expect(spec.slug).toBe("user-auth")
    expect(spec.design).toBeUndefined()
  })
})

describe("Result helpers", () => {
  it("ok() creates a success result", () => {
    const r = ok(42)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(42)
  })

  it("err() creates an error result", () => {
    const r = err(new Error("boom"))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.message).toBe("boom")
  })
})

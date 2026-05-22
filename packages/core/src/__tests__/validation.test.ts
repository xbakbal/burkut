import { describe, it, expect } from "vitest"
import {
  isValidEars,
  validateRequirement,
  validateRequirements,
  validateTasks,
} from "../validation/index.js"
import type { Requirement, Task } from "../types.js"

describe("isValidEars", () => {
  it("accepts ubiquitous pattern", () => {
    expect(isValidEars("THE SYSTEM SHALL store user data")).toBe(true)
  })

  it("accepts WHEN pattern", () => {
    expect(isValidEars("WHEN a user logs in THE SYSTEM SHALL return a JWT")).toBe(true)
  })

  it("accepts WHILE pattern", () => {
    expect(isValidEars("WHILE processing THE SYSTEM SHALL show a spinner")).toBe(true)
  })

  it("accepts IF/THEN pattern", () => {
    expect(isValidEars("IF auth fails THEN THE SYSTEM SHALL return 401")).toBe(true)
  })

  it("rejects missing THE SYSTEM SHALL", () => {
    expect(isValidEars("when a user logs in, return a JWT")).toBe(false)
  })
})

describe("validateRequirement", () => {
  const valid: Requirement = {
    id: "REQ-001",
    title: "User Login",
    ears: "WHEN a user provides credentials THE SYSTEM SHALL authenticate them",
    acceptanceCriteria: ["Returns JWT", "Returns 401 on failure"],
  }

  it("passes for a valid requirement", () => {
    expect(validateRequirement(valid).valid).toBe(true)
  })

  it("fails for invalid ID format", () => {
    const r = { ...valid, id: "R-1" }
    const res = validateRequirement(r)
    expect(res.valid).toBe(false)
    expect(res.errors[0]!.field).toBe("id")
  })

  it("fails for empty EARS", () => {
    const r = { ...valid, ears: "" }
    expect(validateRequirement(r).valid).toBe(false)
  })

  it("fails for invalid EARS notation", () => {
    const r = { ...valid, ears: "User can log in with email and password" }
    const res = validateRequirement(r)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.field === "ears")).toBe(true)
  })

  it("fails for no acceptance criteria", () => {
    const r = { ...valid, acceptanceCriteria: [] }
    expect(validateRequirement(r).valid).toBe(false)
  })
})

describe("validateRequirements", () => {
  it("fails for empty requirements", () => {
    expect(validateRequirements([]).valid).toBe(false)
  })

  it("fails for duplicate IDs", () => {
    const req: Requirement = {
      id: "REQ-001",
      title: "x",
      ears: "THE SYSTEM SHALL do something",
      acceptanceCriteria: ["criterion"],
    }
    const res = validateRequirements([req, req])
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.message.includes("Duplicate"))).toBe(true)
  })
})

describe("validateTasks", () => {
  const makeTask = (id: string, deps: string[] = []): Task => ({
    id,
    title: `Task ${id}`,
    status: "pending",
    dependsOn: deps,
    wave: 1,
    requirementRefs: [],
  })

  it("passes for valid tasks", () => {
    const tasks = [makeTask("TASK-001"), makeTask("TASK-002", ["TASK-001"])]
    expect(validateTasks(tasks).valid).toBe(true)
  })

  it("fails for unknown dependency", () => {
    const tasks = [makeTask("TASK-001", ["TASK-999"])]
    const res = validateTasks(tasks)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.message.includes("Unknown dependency"))).toBe(true)
  })

  it("fails for self-referencing task", () => {
    const tasks = [makeTask("TASK-001", ["TASK-001"])]
    const res = validateTasks(tasks)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.message.includes("itself"))).toBe(true)
  })

  it("fails for duplicate task IDs", () => {
    const tasks = [makeTask("TASK-001"), makeTask("TASK-001")]
    const res = validateTasks(tasks)
    expect(res.valid).toBe(false)
  })
})

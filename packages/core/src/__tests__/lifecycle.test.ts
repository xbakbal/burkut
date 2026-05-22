import { describe, it, expect } from "vitest"
import { advance, isAtLeast, statusLabel } from "../state/lifecycle.js"

describe("advance", () => {
  it("advances through all stages in order", () => {
    expect(advance("draft")).toBe("requirements")
    expect(advance("requirements")).toBe("design")
    expect(advance("design")).toBe("tasks")
    expect(advance("tasks")).toBe("implementing")
    expect(advance("implementing")).toBe("done")
  })

  it("throws when trying to advance from done", () => {
    expect(() => advance("done")).toThrow()
  })
})

describe("isAtLeast", () => {
  it("returns true when at minimum", () => {
    expect(isAtLeast("design", "design")).toBe(true)
  })

  it("returns true when ahead of minimum", () => {
    expect(isAtLeast("tasks", "requirements")).toBe(true)
    expect(isAtLeast("done", "draft")).toBe(true)
  })

  it("returns false when behind minimum", () => {
    expect(isAtLeast("draft", "requirements")).toBe(false)
    expect(isAtLeast("requirements", "design")).toBe(false)
  })
})

describe("statusLabel", () => {
  it("returns human readable labels for all statuses", () => {
    expect(statusLabel("draft")).toBe("Draft")
    expect(statusLabel("requirements")).toBe("Requirements Ready")
    expect(statusLabel("design")).toBe("Design Ready")
    expect(statusLabel("tasks")).toBe("Tasks Ready")
    expect(statusLabel("implementing")).toBe("Implementing")
    expect(statusLabel("done")).toBe("Done")
  })
})

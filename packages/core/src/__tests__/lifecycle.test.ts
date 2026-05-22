import { describe, it, expect } from "vitest"
import { advance, revert, canAdvance, canRevert, isAtLeast, statusLabel } from "../state/lifecycle.js"

describe("advance", () => {
  it("advances through all stages", () => {
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

describe("revert", () => {
  it("reverts through all stages", () => {
    expect(revert("requirements")).toBe("draft")
    expect(revert("design")).toBe("requirements")
    expect(revert("tasks")).toBe("design")
    expect(revert("implementing")).toBe("tasks")
    expect(revert("done")).toBe("implementing")
  })

  it("throws when trying to revert from draft", () => {
    expect(() => revert("draft")).toThrow()
  })
})

describe("canAdvance / canRevert", () => {
  it("canAdvance is false for done", () => {
    expect(canAdvance("done")).toBe(false)
  })

  it("canAdvance is true for all other statuses", () => {
    expect(canAdvance("draft")).toBe(true)
    expect(canAdvance("implementing")).toBe(true)
  })

  it("canRevert is false for draft", () => {
    expect(canRevert("draft")).toBe(false)
  })
})

describe("isAtLeast", () => {
  it("returns true when at minimum", () => {
    expect(isAtLeast("design", "design")).toBe(true)
  })

  it("returns true when ahead of minimum", () => {
    expect(isAtLeast("tasks", "requirements")).toBe(true)
  })

  it("returns false when behind minimum", () => {
    expect(isAtLeast("draft", "requirements")).toBe(false)
  })
})

describe("statusLabel", () => {
  it("returns human readable labels", () => {
    expect(statusLabel("draft")).toBe("Draft")
    expect(statusLabel("implementing")).toBe("Implementing")
    expect(statusLabel("done")).toBe("Done")
  })
})

import { describe, it, expect } from "vitest"
import {
  parseRequirements,
  serializeRequirements,
  parseDesign,
  serializeDesign,
  parseTasks,
  serializeTasks,
} from "../parser/index.js"
import type { Design } from "../types.js"

// ─── Requirements ─────────────────────────────────────────────────────────────

const REQUIREMENTS_MD = `# User Authentication

## Requirements

### REQ-001: Login
WHEN a user provides valid credentials THE SYSTEM SHALL authenticate the user and return a session token

**Acceptance Criteria:**
- [ ] Supports email/password authentication
- [ ] Returns JWT token on success
- [ ] Returns 401 on invalid credentials

### REQ-002: Logout
WHEN a user logs out THE SYSTEM SHALL invalidate the session token

**Acceptance Criteria:**
- [ ] Session is invalidated server-side
`

describe("parseRequirements", () => {
  it("parses multiple requirements", () => {
    const reqs = parseRequirements(REQUIREMENTS_MD)
    expect(reqs).toHaveLength(2)
  })

  it("parses REQ-001 correctly", () => {
    const [req] = parseRequirements(REQUIREMENTS_MD)
    expect(req!.id).toBe("REQ-001")
    expect(req!.title).toBe("Login")
    expect(req!.ears).toContain("THE SYSTEM SHALL")
    expect(req!.acceptanceCriteria).toHaveLength(3)
  })

  it("parses REQ-002 correctly", () => {
    const reqs = parseRequirements(REQUIREMENTS_MD)
    const req = reqs[1]!
    expect(req.id).toBe("REQ-002")
    expect(req.acceptanceCriteria).toHaveLength(1)
  })

  it("returns empty array for empty markdown", () => {
    expect(parseRequirements("# Title\n\n## Overview\nno reqs")).toHaveLength(0)
  })
})

describe("serializeRequirements", () => {
  it("round-trips through parse → serialize → parse", () => {
    const original = parseRequirements(REQUIREMENTS_MD)
    const serialized = serializeRequirements("User Authentication", original)
    const reparsed = parseRequirements(serialized)

    expect(reparsed).toHaveLength(original.length)
    for (let i = 0; i < original.length; i++) {
      expect(reparsed[i]!.id).toBe(original[i]!.id)
      expect(reparsed[i]!.title).toBe(original[i]!.title)
      expect(reparsed[i]!.acceptanceCriteria).toHaveLength(original[i]!.acceptanceCriteria.length)
    }
  })
})

// ─── Design ───────────────────────────────────────────────────────────────────

const DESIGN_MD = `# Design: User Authentication

## Overview
JWT-based authentication using bcrypt for password hashing.

## Components

### AuthService
Handles login, logout, and token refresh logic.

### UserRepository
Database access layer for user records.

## Data Flow
Client sends credentials → AuthService validates → UserRepository looks up user → JWT issued

## Sequence Diagram
\`\`\`mermaid
sequenceDiagram
    Client->>AuthService: POST /login
    AuthService-->>Client: JWT token
\`\`\`

## Technical Decisions
- Use HS256 for JWT signing
- Bcrypt cost factor 12

## Testing Strategy
Unit test AuthService with mocked UserRepository. Integration test the /login endpoint.
`

describe("parseDesign", () => {
  it("parses overview", () => {
    const d = parseDesign(DESIGN_MD)
    expect(d.overview).toContain("JWT-based authentication")
  })

  it("parses components", () => {
    const d = parseDesign(DESIGN_MD)
    expect(d.components).toHaveLength(2)
    expect(d.components[0]!.name).toBe("AuthService")
    expect(d.components[1]!.name).toBe("UserRepository")
  })

  it("parses data flow", () => {
    const d = parseDesign(DESIGN_MD)
    expect(d.dataFlow).toContain("Client sends credentials")
  })

  it("parses sequence diagram (strips mermaid fences)", () => {
    const d = parseDesign(DESIGN_MD)
    expect(d.sequenceDiagram).toContain("Client->>AuthService")
    expect(d.sequenceDiagram).not.toContain("```")
  })

  it("parses technical decisions", () => {
    const d = parseDesign(DESIGN_MD)
    expect(d.technicalDecisions).toHaveLength(2)
    expect(d.technicalDecisions[0]).toContain("HS256")
  })

  it("parses testing strategy", () => {
    const d = parseDesign(DESIGN_MD)
    expect(d.testingStrategy).toContain("Unit test")
  })
})

describe("serializeDesign", () => {
  it("round-trips through parse → serialize → parse", () => {
    const original = parseDesign(DESIGN_MD)
    const serialized = serializeDesign("User Authentication", original)
    const reparsed = parseDesign(serialized)

    expect(reparsed.overview).toBe(original.overview)
    expect(reparsed.components).toHaveLength(original.components.length)
    expect(reparsed.technicalDecisions).toHaveLength(original.technicalDecisions.length)
  })

  it("handles design with no optional fields", () => {
    const minimal: Design = {
      overview: "Simple overview",
      components: [],
      technicalDecisions: [],
    }
    const serialized = serializeDesign("Test", minimal)
    expect(serialized).toContain("## Overview")
    expect(serialized).not.toContain("## Data Flow")
    expect(serialized).not.toContain("## Sequence Diagram")
  })
})

// ─── Tasks ────────────────────────────────────────────────────────────────────

const TASKS_MD = `# Implementation Tasks

## Wave 1 (parallel)
- [x] TASK-001: Create user model
  - Refs: REQ-001

- [ ] TASK-002: Implement password hashing
  - Refs: REQ-001

## Wave 2 (depends on Wave 1)
- [~] TASK-003: Build login endpoint
  - Depends on: TASK-001, TASK-002
  - Refs: REQ-001, REQ-002
`

describe("parseTasks", () => {
  it("parses all tasks", () => {
    const tasks = parseTasks(TASKS_MD)
    expect(tasks).toHaveLength(3)
  })

  it("assigns correct waves", () => {
    const tasks = parseTasks(TASKS_MD)
    expect(tasks[0]!.wave).toBe(1)
    expect(tasks[1]!.wave).toBe(1)
    expect(tasks[2]!.wave).toBe(2)
  })

  it("parses task statuses", () => {
    const tasks = parseTasks(TASKS_MD)
    expect(tasks[0]!.status).toBe("done")
    expect(tasks[1]!.status).toBe("pending")
    expect(tasks[2]!.status).toBe("in_progress")
  })

  it("parses dependencies", () => {
    const tasks = parseTasks(TASKS_MD)
    expect(tasks[2]!.dependsOn).toEqual(["TASK-001", "TASK-002"])
  })

  it("parses requirement refs", () => {
    const tasks = parseTasks(TASKS_MD)
    expect(tasks[2]!.requirementRefs).toEqual(["REQ-001", "REQ-002"])
  })
})

describe("serializeTasks", () => {
  it("round-trips through parse → serialize → parse", () => {
    const original = parseTasks(TASKS_MD)
    const serialized = serializeTasks(original)
    const reparsed = parseTasks(serialized)

    expect(reparsed).toHaveLength(original.length)
    for (let i = 0; i < original.length; i++) {
      expect(reparsed[i]!.id).toBe(original[i]!.id)
      expect(reparsed[i]!.wave).toBe(original[i]!.wave)
      expect(reparsed[i]!.status).toBe(original[i]!.status)
      expect(reparsed[i]!.dependsOn).toEqual(original[i]!.dependsOn)
    }
  })
})

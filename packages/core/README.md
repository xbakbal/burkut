# @burkut/core

> Spec engine for Burkut — parse, validate, transform and manage spec-driven development artifacts

Part of the [Burkut](https://github.com/xbakbal/burkut) monorepo. This package contains all the domain logic for working with specs: reading and writing markdown files, validating requirements notation, computing task execution order, and tracking lifecycle state. It has no dependency on any AI model or agent.

---

## What's inside

### Types

Zod-validated TypeScript types for all spec artifacts:
- `Spec`, `Requirement`, `Design`, `Task`
- `SpecStatus` — the lifecycle stages a spec moves through
- `TaskStatus` — the execution state of a single task
- `ProjectState` — the overall state of all specs in a project

### Markdown Parser / Serializer

Reads and writes the three spec files:

| Module | File | Format |
|--------|------|--------|
| `parseRequirements` / `serializeRequirements` | `requirements.md` | EARS notation |
| `parseDesign` / `serializeDesign` | `design.md` | Overview, components, sequence diagrams |
| `parseTasks` / `serializeTasks` | `tasks.md` | Wave groups with checkbox status |

The parser is deliberately simple (regex-based line scanning, no AST). This keeps it predictable and easy to extend.

### Spec Lifecycle

Specs move through a fixed sequence of stages:

```
draft → requirements → design → tasks → implementing → done
```

- `draft` — spec created, no content yet
- `requirements` — `requirements.md` written and validated
- `design` — `design.md` written and validated
- `tasks` — `tasks.md` written and validated
- `implementing` — at least one task is in progress
- `done` — all tasks completed

Helper functions: `advance(status)`, `revert(status)`, `isAtLeast(status, minimum)`, `statusLabel(status)`

### State Manager

Reads and writes `.specs/.state.json` — the project-level state file that tracks:
- Which specs exist and their current lifecycle status
- Which spec is currently active

```ts
const state = new StateManager(projectRoot)
await state.init("my-project")
await state.addSpec("user-authentication")
await state.setSpecStatus("user-authentication", "requirements")
const specs = await state.listSpecs()
```

### Template Engine

Generates blank spec files and `burkut.config.md` from templates:

```ts
await createSpecFiles({ specDir, title, skipExisting: false })
await createProjectConfig(specsDir, projectName)
```

Also exports `toSlug("User Authentication")` → `"user-authentication"` and `toTitle("user-authentication")` → `"User Authentication"`.

### Validation

Validates spec content before writing to disk.

**EARS notation** (Easy Approach to Requirements Syntax) checker — requirements must follow structured natural language patterns:

| Pattern | Example |
|---------|---------|
| Ubiquitous | `THE SYSTEM SHALL store all events` |
| Event-driven | `WHEN a user logs in THE SYSTEM SHALL record the timestamp` |
| State-driven | `WHILE processing THE SYSTEM SHALL show a spinner` |
| Conditional | `IF the file exceeds 10MB THEN THE SYSTEM SHALL reject it` |

```ts
const { valid, errors } = validateRequirements(requirements)
// errors: [{ field: "ears", message: "EARS notation must contain 'THE SYSTEM SHALL'..." }]

const { valid, errors } = validateTasks(tasks)
// errors: [{ field: "dependsOn", message: "Unknown dependency: TASK-999" }]
```

### Task Dependency Graph

Computes parallel execution waves from a list of tasks and their declared dependencies using **Kahn's algorithm** (a standard topological sort that processes nodes level by level, assigning each to the earliest possible wave).

```ts
const { tasks, hasCycle, cycleNodes } = computeWaves(rawTasks)
// Tasks with no dependencies → Wave 1
// Tasks that depend only on Wave 1 tasks → Wave 2
// And so on...

// hasCycle: true if the dependency graph contains a circular reference
// cycleNodes: the task IDs involved in the cycle
```

Other graph helpers:
- `nextPendingWave(tasks)` — returns the lowest-wave tasks that are still pending
- `areDependenciesMet(task, allTasks)` — checks if all dependencies are `done`
- `sortByWave(tasks)` — sorts tasks by wave number

---

## Install

```bash
npm install @burkut/core
```

---

## Usage

```ts
import {
  parseRequirements,
  serializeRequirements,
  parseTasks,
  serializeTasks,
  computeWaves,
  validateRequirements,
  validateTasks,
  StateManager,
  advance,
  isAtLeast,
} from "@burkut/core"

// ── Parse a requirements.md file ──────────────────────────────────────────
const requirements = parseRequirements(markdownString)
// [{ id: "REQ-001", title: "Login", ears: "WHEN ...", acceptanceCriteria: [...] }]

// ── Validate before saving ─────────────────────────────────────────────────
const { valid, errors } = validateRequirements(requirements)
if (!valid) {
  for (const err of errors) {
    console.error(`${err.field}: ${err.message}`)
  }
}

// ── Serialize back to markdown ─────────────────────────────────────────────
const markdown = serializeRequirements("User Authentication", requirements)

// ── Compute task waves ─────────────────────────────────────────────────────
const rawTasks = parseTasks(tasksMd)
const { tasks, hasCycle, cycleNodes } = computeWaves(rawTasks)

if (hasCycle) {
  console.error(`Circular dependency detected: ${cycleNodes.join(" → ")}`)
}

// Tasks now have correct wave numbers based on their dependencies
const wave1 = tasks.filter((t) => t.wave === 1)
const wave2 = tasks.filter((t) => t.wave === 2)

// ── Manage project state ───────────────────────────────────────────────────
const state = new StateManager("/path/to/project")
await state.init("my-project")
await state.addSpec("user-authentication")

const status = await state.getSpecStatus("user-authentication")
// "draft"

await state.setSpecStatus("user-authentication", advance("draft"))
// Status is now "requirements"

console.log(isAtLeast("design", "requirements")) // true
console.log(isAtLeast("draft", "design"))         // false
```

---

## Error handling

```ts
// validateRequirements returns errors, never throws
const { valid, errors } = validateRequirements([])
// valid: false
// errors: [{ field: "requirements", message: "At least one requirement is needed" }]

// computeWaves never throws — cycles are reported via hasCycle
const { tasks, hasCycle, cycleNodes } = computeWaves(tasksWithCycle)
// hasCycle: true
// cycleNodes: ["TASK-001", "TASK-002"]
// tasks: partially computed (nodes in the cycle get their original wave)

// StateManager methods throw on I/O errors (file not found, permission denied)
// Wrap in try/catch for production use
try {
  await state.init("my-project")
} catch (err) {
  console.error("Could not initialize Burkut:", err)
}
```

---

## License

MIT

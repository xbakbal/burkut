# @burkut/mcp

> MCP server for structured spec-driven development — works with any AI coding agent

Burkut brings structured spec-driven development to any AI coding agent via the [Model Context Protocol](https://modelcontextprotocol.io). Rather than asking an agent to implement a feature directly, Burkut guides it through three planning phases — **requirements → design → tasks** — with human review between each step. The agent generates all spec content using its own intelligence; Burkut handles validation, file persistence, and state tracking.

Named after **Burkut** — the sacred golden eagle of Turkic mythology, seeing the whole from above.

---

## Supported Agents

Any MCP-compatible agent works out of the box:

- **Claude Code** (Anthropic)
- **Claude Desktop** (Anthropic)
- **Cursor**
- **OpenCode**
- **Windsurf** (Codeium)
- **VS Code** (GitHub Copilot Chat)
- **Gemini CLI** (Google)
- **Cline / RooCode**
- Any other MCP client

---

## Install

> **Note:** This is an MCP server — you don't run `npm install @burkut/mcp` directly.
> Instead, add it to your agent's MCP configuration. The agent launches it automatically
> via `npx` on demand. No global install needed.
>
> If you want to install it globally and run it as `burkut-mcp`:
> ```bash
> npm install -g @burkut/mcp
> ```

### Claude Code (`.mcp.json` in project root)

```json
{
  "mcpServers": {
    "burkut": {
      "command": "npx",
      "args": ["-y", "@burkut/mcp"]
    }
  }
}
```

### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "burkut": {
      "command": "npx",
      "args": ["-y", "@burkut/mcp"]
    }
  }
}
```

### OpenCode (`opencode.json`)

```json
{
  "mcp": {
    "burkut": {
      "type": "local",
      "command": ["npx", "-y", "@burkut/mcp"]
    }
  }
}
```

### VS Code / GitHub Copilot (`.vscode/mcp.json`)

```json
{
  "servers": {
    "burkut": {
      "command": "npx",
      "args": ["-y", "@burkut/mcp"]
    }
  }
}
```

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "burkut": {
      "command": "npx",
      "args": ["-y", "@burkut/mcp"]
    }
  }
}
```

### Windsurf (`~/.codeium/windsurf/mcp_config.json`)

```json
{
  "mcpServers": {
    "burkut": {
      "command": "npx",
      "args": ["-y", "@burkut/mcp"]
    }
  }
}
```

---

## How it works

The MCP server exposes 6 tools. The AI agent generates all spec content using its own intelligence; the tools validate the content, write it to the correct files, and advance the spec's lifecycle status.

```
User:  "Add user authentication to this project"
         ↓
Agent: burkut_spec_init    → creates .specs/ directory
Agent: burkut_spec_new     → creates spec files
Agent: generates requirements markdown (EARS notation)
Agent: burkut_spec_plan    → validates + saves requirements.md
Agent: "Here are 5 requirements. Approve?"
User:  "Yes, continue"
Agent: generates design markdown
Agent: burkut_spec_plan    → validates + saves design.md
Agent: "Design ready. Approve?"
User:  "Yes"
Agent: generates tasks markdown
Agent: burkut_spec_plan    → validates + saves tasks.md
Agent: implements TASK-001 (edits files, runs tests)
Agent: burkut_spec_implement → marks TASK-001 as done in tasks.md
         ↓
Agent: burkut_spec_status  → all tasks complete, spec is done
```

---

## Tools

| Tool | Description |
|------|-------------|
| `burkut_spec_init` | Initialize Burkut in the current project |
| `burkut_spec_new` | Create a new spec with blank template files |
| `burkut_spec_plan` | Validate and save one planning phase (requirements / design / tasks) |
| `burkut_spec_implement` | Update a task's implementation status in tasks.md |
| `burkut_spec_status` | Show all specs and task progress |
| `burkut_spec_list` | List all specs |

### `burkut_spec_plan` in detail

The central tool. The agent generates spec content for a phase, then passes it here.

```
Arguments:
  name:    spec slug (e.g. "user-authentication")
  phase:   "requirements" | "design" | "tasks"
  content: the markdown the agent generated for this phase
```

What the tool does:
1. Parses the markdown using `@burkut/core`
2. Validates structure — EARS notation in requirements, required sections in design, valid dependency references in tasks
3. If invalid → returns specific errors so the agent can fix and retry
4. If valid → writes to `.specs/features/<name>/<phase>.md` and advances the spec status

### `burkut_spec_implement` in detail

The agent implements tasks using its own tools (file editing, running commands, etc.), then calls this to keep `tasks.md` in sync.

```
Arguments:
  name:    spec slug
  taskId:  task ID (e.g. "TASK-001")
  status:  "in_progress" | "done" | "skipped"
```

---

## Project context — burkut.config.md

After running `burkut_spec_init`, edit `.specs/burkut.config.md`. The agent reads this file when generating requirements and design. The more context you provide, the more accurate the output.

```markdown
# Project Context

## Project Name
My App

## Description
A B2B invoicing platform for freelancers.

## Tech Stack
- Node.js + TypeScript (backend)
- React + Vite (frontend)
- PostgreSQL + Prisma

## Architecture
REST API with a React SPA. Services organized by domain.

## Conventions
- Controllers in src/controllers/
- Services in src/services/
- Tests co-located (*.test.ts)
```

---

## Spec format

```
.specs/
├── .state.json              ← project state (spec statuses)
├── burkut.config.md         ← project context for the agent
└── features/
    └── user-authentication/
        ├── requirements.md  ← EARS notation requirements
        ├── design.md        ← architecture + sequence diagrams
        └── tasks.md         ← wave-ordered implementation tasks
```

### `requirements.md` — EARS notation

EARS (Easy Approach to Requirements Syntax) uses structured natural language to eliminate ambiguity. The core pattern: `WHEN <condition> THE SYSTEM SHALL <behavior>`

```markdown
### REQ-001: Login
WHEN a user submits valid credentials
THE SYSTEM SHALL return a JWT token valid for 7 days

**Acceptance Criteria:**
- [ ] Returns 401 for invalid credentials
- [ ] Returns 429 after 5 failed attempts in 15 minutes
```

### `tasks.md` — Wave-based execution

Tasks are grouped into waves. Tasks in the same wave can run in parallel. A wave only starts after all tasks in the previous wave are done.

```markdown
## Wave 1 (parallel)
- [ ] TASK-001: Create User model
- [ ] TASK-002: Implement password hashing

## Wave 2 (depends on Wave 1)
- [ ] TASK-003: Build login endpoint
  - Depends on: TASK-001, TASK-002
  - Refs: REQ-001
```

---

## Troubleshooting

### The agent doesn't see any Burkut tools

1. Restart the agent after adding the MCP config — most agents only load MCP servers on startup.
2. Check that `npx` is available in the shell the agent uses: `which npx`
3. Try running the server manually to check for errors:
   ```bash
   npx -y @burkut/mcp
   ```
   You should see: `Burkut MCP server running (stdio)` on stderr. Press Ctrl+C to stop.

### npx hangs or fails

Try with an explicit Node version:
```bash
node --version  # must be >= 20
```
Or install globally and use the binary:
```bash
npm install -g @burkut/mcp
# then in MCP config:
# "command": "burkut-mcp"
```

### "Burkut is not initialized" error

The agent must call `burkut_spec_init` before using other tools. Tell your agent:
```
Initialize Burkut in this project first
```

### Spec not found error

Spec slugs are kebab-case versions of the name you provided to `burkut_spec_new`. If you created a spec called "User Authentication", the slug is `user-authentication`.

### Validation errors in burkut_spec_plan

The tool returns specific error messages. Common issues:
- **Requirements**: Missing `THE SYSTEM SHALL` in an EARS statement
- **Requirements**: Missing `**Acceptance Criteria:**` section
- **Tasks**: A task references a dependency that doesn't exist
- **Tasks**: Two tasks have the same ID

The agent should fix the errors and call the tool again automatically.

---

## Packages

| Package | Description |
|---------|-------------|
| [`@burkut/mcp`](https://npmjs.com/package/@burkut/mcp) | This package — MCP server |
| [`@burkut/core`](https://npmjs.com/package/@burkut/core) | Spec engine (parser, validator, task graph) |

## License

MIT

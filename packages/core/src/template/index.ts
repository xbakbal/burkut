/**
 * Template engine — generates blank spec files and burkut.config.md
 */

import fs from "node:fs/promises"
import path from "node:path"

// ─── Spec Templates ──────────────────────────────────────────────────────────

export function requirementsTemplate(title: string): string {
  return `# ${title}

## Requirements

### REQ-001: <Requirement Title>
WHEN <condition>
THE SYSTEM SHALL <expected behavior>

**Acceptance Criteria:**
- [ ] <criterion 1>
- [ ] <criterion 2>
`
}

export function designTemplate(title: string): string {
  return `# Design: ${title}

## Overview
<High-level description of the technical approach>

## Components

### <ComponentName>
<Description of this component's responsibility>

## Data Flow
<Describe how data moves through the system>

## Sequence Diagram
\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Server
    Client->>Server: request
    Server-->>Client: response
\`\`\`

## Technical Decisions
- <Decision 1: reason>
- <Decision 2: reason>

## Testing Strategy
<Describe the testing approach: unit, integration, e2e>
`
}

export function tasksTemplate(title: string): string {
  return `# Implementation Tasks

<!-- Generated from: ${title} -->
<!-- Status legend: [ ] pending  [~] in_progress  [x] done  [-] skipped -->

## Wave 1 (parallel)
- [ ] TASK-001: <First task title>
  - Refs: REQ-001

## Wave 2 (depends on Wave 1)
- [ ] TASK-002: <Second task title>
  - Depends on: TASK-001
  - Refs: REQ-001
`
}

// ─── Project Config Template ─────────────────────────────────────────────────

export function projectConfigTemplate(projectName: string): string {
  return `# Project Context

## Project Name
${projectName}

## Description
<Brief description of the project>

## Tech Stack
- <Language/Framework>
- <Database>
- <Key libraries>

## Architecture
<High-level architecture overview>

## Conventions
- <Naming conventions>
- <Code style>
- <Testing approach>
`
}

// ─── File Writer ─────────────────────────────────────────────────────────────

export interface CreateSpecFilesOptions {
  specDir: string
  title: string
  /** If true, don't overwrite existing files */
  skipExisting?: boolean
}

export async function createSpecFiles(opts: CreateSpecFilesOptions): Promise<void> {
  await fs.mkdir(opts.specDir, { recursive: true })

  const files = [
    { name: "requirements.md", content: requirementsTemplate(opts.title) },
    { name: "design.md", content: designTemplate(opts.title) },
    { name: "tasks.md", content: tasksTemplate(opts.title) },
  ]

  for (const file of files) {
    const filePath = path.join(opts.specDir, file.name)
    if (opts.skipExisting) {
      try {
        await fs.access(filePath)
        continue // file exists, skip
      } catch {
        // file doesn't exist, create it
      }
    }
    await fs.writeFile(filePath, file.content, "utf-8")
  }
}

export async function createProjectConfig(specsDir: string, projectName: string): Promise<void> {
  const configPath = path.join(specsDir, "burkut.config.md")
  try {
    await fs.access(configPath)
    return // already exists
  } catch {
    // create it
  }
  await fs.writeFile(configPath, projectConfigTemplate(projectName), "utf-8")
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function toTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

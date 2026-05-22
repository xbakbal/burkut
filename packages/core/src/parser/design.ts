/**
 * design.md parser & serializer
 *
 * Format:
 *   # Design: <Spec Title>
 *
 *   ## Overview
 *   <overview text>
 *
 *   ## Components
 *   ### <ComponentName>
 *   <description>
 *
 *   ## Data Flow
 *   <text>
 *
 *   ## Sequence Diagram
 *   ```mermaid
 *   ...
 *   ```
 *
 *   ## Technical Decisions
 *   - decision 1
 *
 *   ## Testing Strategy
 *   <text>
 */

import type { Design } from "../types.js"

// ─── Parser ──────────────────────────────────────────────────────────────────

type Section =
  | "overview"
  | "components"
  | "component-detail"
  | "data-flow"
  | "sequence"
  | "decisions"
  | "testing"
  | null

export function parseDesign(markdown: string): Design {
  const lines = markdown.split("\n")

  const overview: string[] = []
  const components: Array<{ name: string; description: string }> = []
  const dataFlow: string[] = []
  const sequence: string[] = []
  const decisions: string[] = []
  const testing: string[] = []

  let section: Section = null
  let currentComponent: { name: string; lines: string[] } | null = null
  let inMermaid = false

  for (const line of lines) {
    // Track mermaid code blocks for sequence diagram
    if (section === "sequence") {
      if (line.trim() === "```mermaid") {
        inMermaid = true
        continue
      }
      if (inMermaid && line.trim() === "```") {
        inMermaid = false
        continue
      }
      if (inMermaid) {
        sequence.push(line)
        continue
      }
    }

    // Section headings
    if (line.match(/^##\s+Overview/i)) { section = "overview"; continue }
    if (line.match(/^##\s+Components/i)) {
      section = "components"
      if (currentComponent) {
        components.push({ name: currentComponent.name, description: currentComponent.lines.join("\n").trim() })
        currentComponent = null
      }
      continue
    }
    if (line.match(/^##\s+Data Flow/i)) {
      section = "data-flow"
      if (currentComponent) {
        components.push({ name: currentComponent.name, description: currentComponent.lines.join("\n").trim() })
        currentComponent = null
      }
      continue
    }
    if (line.match(/^##\s+Sequence Diagram/i)) { section = "sequence"; inMermaid = false; continue }
    if (line.match(/^##\s+Technical Decisions/i)) { section = "decisions"; continue }
    if (line.match(/^##\s+Testing Strategy/i)) { section = "testing"; continue }
    // Any other h2 — reset section
    if (line.match(/^##\s+/)) { section = null; continue }

    // h3 in components section = new component
    if (section === "components" || section === "component-detail") {
      const compMatch = line.match(/^###\s+(.+)$/)
      if (compMatch) {
        if (currentComponent) {
          components.push({ name: currentComponent.name, description: currentComponent.lines.join("\n").trim() })
        }
        currentComponent = { name: compMatch[1]!, lines: [] }
        section = "component-detail"
        continue
      }
      if (currentComponent) {
        currentComponent.lines.push(line)
        continue
      }
    }

    // Accumulate section content
    switch (section) {
      case "overview":
        overview.push(line)
        break
      case "data-flow":
        dataFlow.push(line)
        break
      case "decisions": {
        const dec = line.match(/^-\s+(.+)$/)
        if (dec) decisions.push(dec[1]!)
        break
      }
      case "testing":
        testing.push(line)
        break
    }
  }

  // Flush last component
  if (currentComponent) {
    components.push({ name: currentComponent.name, description: currentComponent.lines.join("\n").trim() })
  }

  return {
    overview: overview.join("\n").trim(),
    components,
    dataFlow: dataFlow.join("\n").trim() || undefined,
    sequenceDiagram: sequence.join("\n").trim() || undefined,
    technicalDecisions: decisions,
    testingStrategy: testing.join("\n").trim() || undefined,
  }
}

// ─── Serializer ──────────────────────────────────────────────────────────────

export function serializeDesign(title: string, design: Design): string {
  const lines: string[] = [`# Design: ${title}`, ""]

  lines.push("## Overview", design.overview, "")

  if (design.components.length > 0) {
    lines.push("## Components", "")
    for (const c of design.components) {
      lines.push(`### ${c.name}`, c.description, "")
    }
  }

  if (design.dataFlow) {
    lines.push("## Data Flow", design.dataFlow, "")
  }

  if (design.sequenceDiagram) {
    lines.push("## Sequence Diagram", "```mermaid", design.sequenceDiagram, "```", "")
  }

  if (design.technicalDecisions.length > 0) {
    lines.push("## Technical Decisions", "")
    for (const d of design.technicalDecisions) {
      lines.push(`- ${d}`)
    }
    lines.push("")
  }

  if (design.testingStrategy) {
    lines.push("## Testing Strategy", design.testingStrategy, "")
  }

  return lines.join("\n")
}

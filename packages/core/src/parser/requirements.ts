/**
 * requirements.md parser & serializer
 *
 * Format:
 *   # <Spec Title>
 *
 *   ## Requirements
 *
 *   ### REQ-001: <Title>
 *   WHEN ... THE SYSTEM SHALL ...
 *
 *   **Acceptance Criteria:**
 *   - [ ] criterion 1
 */

import type { Requirement } from "../types.js"

// ─── Parser ──────────────────────────────────────────────────────────────────

export function parseRequirements(markdown: string): Requirement[] {
  const requirements: Requirement[] = []
  const lines = markdown.split("\n")

  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ""

    // Match ### REQ-001: Title
    const reqMatch = line.match(/^###\s+(REQ-\d+):\s+(.+)$/)
    if (reqMatch) {
      const id = reqMatch[1]!
      const title = reqMatch[2]!
      const earsParts: string[] = []
      const acceptanceCriteria: string[] = []
      let inAcceptance = false

      i++
      while (i < lines.length) {
        const inner = lines[i] ?? ""

        // Next requirement heading — stop
        if (/^###\s+REQ-\d+:/.test(inner)) break
        // Any h2 heading — stop
        if (/^##\s+/.test(inner)) break

        if (/^\*\*Acceptance Criteria:\*\*/.test(inner)) {
          inAcceptance = true
          i++
          continue
        }

        if (inAcceptance) {
          const criterionMatch = inner.match(/^-\s+\[[ x]\]\s+(.+)$/)
          if (criterionMatch) {
            acceptanceCriteria.push(criterionMatch[1]!)
          }
        } else {
          const trimmed = inner.trim()
          if (trimmed.length > 0) {
            earsParts.push(trimmed)
          }
        }

        i++
      }

      requirements.push({
        id,
        title,
        ears: earsParts.join(" "),
        acceptanceCriteria,
      })
      continue
    }

    i++
  }

  return requirements
}

// ─── Serializer ──────────────────────────────────────────────────────────────

export function serializeRequirements(title: string, requirements: Requirement[]): string {
  const lines: string[] = [`# ${title}`, "", "## Requirements", ""]

  for (const req of requirements) {
    lines.push(`### ${req.id}: ${req.title}`)
    lines.push(req.ears)
    lines.push("")

    if (req.acceptanceCriteria.length > 0) {
      lines.push("**Acceptance Criteria:**")
      for (const criterion of req.acceptanceCriteria) {
        lines.push(`- [ ] ${criterion}`)
      }
      lines.push("")
    }
  }

  return lines.join("\n")
}

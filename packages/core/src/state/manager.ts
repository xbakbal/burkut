import fs from "node:fs/promises"
import path from "node:path"
import type { ProjectState, SpecStatus } from "../types.js"
import { ProjectStateSchema } from "../types.js"

const STATE_VERSION = "1"
const SPECS_DIR = ".specs"
const STATE_FILE = ".state.json"

export class StateManager {
  private readonly stateFilePath: string
  private readonly specsDir: string

  constructor(projectRoot: string) {
    this.specsDir = path.join(projectRoot, SPECS_DIR)
    this.stateFilePath = path.join(this.specsDir, STATE_FILE)
  }

  /** Ensure .specs/ directory structure exists and state file is initialized */
  async init(projectName?: string): Promise<void> {
    await fs.mkdir(this.specsDir, { recursive: true })
    await fs.mkdir(path.join(this.specsDir, "features"), { recursive: true })

    if (!(await this.exists())) {
      const initial: ProjectState = {
        version: STATE_VERSION,
        projectName,
        specs: {},
        activeSpec: undefined,
      }
      await this.write(initial)
    }
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(this.stateFilePath)
      return true
    } catch {
      return false
    }
  }

  async read(): Promise<ProjectState> {
    const raw = await fs.readFile(this.stateFilePath, "utf-8")
    return ProjectStateSchema.parse(JSON.parse(raw) as unknown)
  }

  async write(state: ProjectState): Promise<void> {
    await fs.writeFile(this.stateFilePath, JSON.stringify(state, null, 2) + "\n", "utf-8")
  }

  async getSpecStatus(slug: string): Promise<SpecStatus | undefined> {
    const state = await this.read()
    return state.specs[slug]
  }

  async setSpecStatus(slug: string, status: SpecStatus): Promise<void> {
    const state = await this.read()
    state.specs[slug] = status
    await this.write(state)
  }

  async addSpec(slug: string): Promise<void> {
    const state = await this.read()
    if (!state.specs[slug]) state.specs[slug] = "draft"
    if (!state.activeSpec) state.activeSpec = slug
    await this.write(state)
  }

  async listSpecs(): Promise<Array<{ slug: string; status: SpecStatus }>> {
    const state = await this.read()
    return Object.entries(state.specs).map(([slug, status]) => ({ slug, status }))
  }

  /** Absolute path to a spec's feature directory */
  specDir(slug: string): string {
    return path.join(this.specsDir, "features", slug)
  }

  specsRootDir(): string {
    return this.specsDir
  }
}

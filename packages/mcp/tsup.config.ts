import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: false,
  clean: true,
  external: ["@modelcontextprotocol/sdk"],
  // tsup strips the shebang from src/index.ts during bundling
  // and re-injects it via the banner option
  banner: {
    js: "#!/usr/bin/env node",
  },
  // Also strip the source-level shebang before bundling
  esbuildOptions(opts) {
    opts.supported = { ...opts.supported }
  },
})

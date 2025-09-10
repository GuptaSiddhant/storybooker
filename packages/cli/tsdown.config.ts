import { defineConfig } from "tsdown";

export default defineConfig({
  banner: { js: "#!/usr/bin/env node" },
  dts: false,
  entry: ["./src/index.ts"],
  platform: "node",
  treeshake: true,
});

import { defineConfig } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: ["./src/dynamo-db.ts", "./src/lambda.ts", "./src/s3.ts"],
  exports: { devExports: "source" },
  format: ["esm"],
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: true,
});

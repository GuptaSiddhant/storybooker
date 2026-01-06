import { defineConfig, type UserConfig } from "tsdown";

export const adapterBaseConfig: UserConfig = {
  cjsDefault: false,
  dts: { tsgo: true },
  exports: {},
  failOnWarn: true,
  format: ["esm"],
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: true,
};

export function definedAdapterConfig(entry: NonNullable<UserConfig["entry"]>): UserConfig {
  return defineConfig({
    ...adapterBaseConfig,
    entry,
  });
}

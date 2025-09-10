import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  addons: ["@storybook/addon-vitest"],
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.tsx"],
};

export default config;

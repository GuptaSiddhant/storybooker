// @ts-expect-error importing raw svg file to embed in generated sprite
import SBRLogoIcon from "./logo-icon.svg?raw" with { type: "text" };

export type IconName = keyof typeof icons;
export const icons = {
  logo: SBRLogoIcon,
} satisfies Record<string, unknown>;

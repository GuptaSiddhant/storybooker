// @ts-expect-error importing raw svg file to embed in generated sprite
import ExternalLinkIcon from "./external-link-icon.svg?raw" with { type: "text" };
// @ts-expect-error importing raw svg file to embed in generated sprite
import SBRLogoIcon from "./logo-icon.svg?raw" with { type: "text" };

export type IconName = keyof typeof icons;
/** Record of icons */
export const icons = {
  logo: SBRLogoIcon,
  externalLink: ExternalLinkIcon,
} satisfies Record<string, unknown>;

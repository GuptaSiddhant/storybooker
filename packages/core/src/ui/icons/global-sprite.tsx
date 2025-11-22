import { SBRLogoIcon } from "./logo-icon";

export type IconName = keyof typeof icons;
export const icons = {
  logo: <SBRLogoIcon />,
};

export function generateGlobalSprite(): string {
  const content = Object.entries(icons)
    .map(([name, icon]) => {
      return String(icon)
        .replace("<svg", `<symbol id="${name}"`)
        .replace("</svg>", "</symbol>");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0">
  <defs>
    ${content}
  </defs>
</svg>`;
}

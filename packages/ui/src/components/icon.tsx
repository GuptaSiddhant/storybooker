import type { JSX } from "hono/jsx";
import type { IconName } from "../icons/global-sprite";
import { ASSETS } from "../utils/constants";
import { toTitleCase } from "../utils/text-utils";
import { getUIStore } from "../utils/ui-store";

export type { IconName };

export interface IconProps extends JSX.HTMLAttributes {
  name: IconName;
  label?: string;
}

export function Icon({ name, label, style, ...props }: IconProps): JSXElement {
  const { urlBuilder } = getUIStore();

  const href = `${urlBuilder.staticFile(ASSETS.globalSprite)}#${name}`;
  const styleObj = typeof style === "object" ? style : {};

  return (
    <div {...props} style={{ display: "inline-block", position: "relative", ...styleObj }}>
      <svg aria-hidden style="width:100%;height:100%">
        <use href={href} />
      </svg>
      <span
        style={{
          position: "absolute",
          height: 0,
          width: 0,
          overflow: "hidden",
        }}
      >
        {label ?? toTitleCase(name)}
      </span>
    </div>
  );
}

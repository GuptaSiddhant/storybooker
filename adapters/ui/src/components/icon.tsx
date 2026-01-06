import type { JSX } from "hono/jsx";
import type { IconName } from "../icons/_icons.ts";
import { ASSETS } from "../utils/constants.ts";
import { toTitleCase } from "../utils/text-utils.ts";
import { getUIStore } from "../utils/ui-store.ts";

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
    <div
      title={label}
      {...props}
      style={{
        display: "inline-block",
        position: "relative",
        overflow: "hidden",
        height: "1em",
        width: "1em",
        ...styleObj,
      }}
    >
      <svg aria-hidden style="width:100%;height:100%;">
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

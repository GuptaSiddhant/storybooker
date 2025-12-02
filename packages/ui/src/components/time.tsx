import type { JSX } from "hono/jsx";
import { toLocalTime } from "../utils/text-utils";

export interface TimeProps extends JSX.HTMLAttributes {
  datetime: string | Date;
}

export function Time(props: TimeProps): JSXElement {
  return (
    <time
      {...props}
      datetime={props.datetime instanceof Date ? props.datetime.toISOString() : props.datetime}
    >
      {toLocalTime(props.datetime)}
    </time>
  );
}

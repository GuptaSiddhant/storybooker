import type { JSX } from "hono/jsx";
import { renderLocalTime } from "../../utils/date-utils";

export interface TimeProps extends JSX.HTMLAttributes {
  datetime: string | Date;
}

export function Time(props: TimeProps): JSXElement {
  return (
    <time
      {...props}
      datetime={
        props.datetime instanceof Date
          ? props.datetime.toISOString()
          : props.datetime
      }
    >
      {renderLocalTime(props.datetime)}
    </time>
  );
}

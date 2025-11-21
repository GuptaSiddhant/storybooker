import { renderLocalTime } from "../../utils/date-utils";

export interface TimeProps extends JSX.HtmlTimeTag {
  datetime: string | Date;
}

export function Time(props: TimeProps): JSXElement {
  return (
    <time {...props} safe>
      {renderLocalTime(props.datetime)}
    </time>
  );
}

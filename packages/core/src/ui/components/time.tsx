import { renderLocalTime } from "../../utils/date-utils";

export interface TimeProps extends JSX.HtmlTimeTag {
  datetime: string | Date;
}

export function Time(props: TimeProps): JSX.Element {
  return (
    <time {...props} safe>
      {renderLocalTime(props.datetime)}
    </time>
  );
}

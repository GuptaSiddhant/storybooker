import { ISO_DATE_REGEXP } from "../utils/constants";
import { camelCaseToSentenceCase } from "../utils/text-utils";
import { getUIStore } from "../utils/ui-store";

export function RawDataPreview({
  data,
  open,
  summary,
}: {
  data: unknown;
  open?: boolean;
  summary?: JSXElement;
}): JSXElement {
  const content = (
    <pre safe class="raw-data">
      {JSON.stringify(data, null, 2)}
    </pre>
  );

  if (summary) {
    return (
      <details open={open}>
        <summary>{summary}</summary>
        {content}
      </details>
    );
  }

  return content;
}

export function RawDataList({
  data,
  open,
  summary,
}: {
  data: Record<string, unknown>;
  open?: boolean;
  summary?: JSXElement;
}): JSXElement {
  const { locale } = getUIStore();

  const content = (
    <dl style={{ margin: 0 }}>
      {Object.entries(data).map(([key, value]) => (
        <div style={{ marginBottom: "1rem" }}>
          <dt
            style={{
              fontSize: "0.8em",
              fontWeight: "500",
              marginBottom: "2px",
              opacity: 0.8,
            }}
          >
            {key.includes(" ") ? key : camelCaseToSentenceCase(key)}
          </dt>
          <dd style={{ fontSize: "0.9em", margin: 0, overflowWrap: "break-word" }}>
            {(typeof value === "string" ? (
              ISO_DATE_REGEXP.test(value) ? (
                new Date(value).toLocaleString(locale)
              ) : value.startsWith("http") ? (
                <a href={value} target="_blank">
                  {value}
                </a>
              ) : (
                value
              )
            ) : (
              JSON.stringify(value)
            )) || "-"}
          </dd>
        </div>
      ))}
    </dl>
  );

  if (summary) {
    return (
      <details open={open}>
        <summary>{summary}</summary>
        {content}
      </details>
    );
  }

  return <div style={{ width: "100%" }}>{content}</div>;
}

export function RawDataTabular({
  data,
  open,
  summary,
}: {
  data: Record<string, unknown>;
  open?: boolean;
  summary?: JSXElement;
}): JSXElement {
  const content = (
    <table>
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(data).map(([key, value]) => (
          <tr>
            <td style={{ opacity: 0.8 }}>{key}</td>
            <td>{typeof value === "string" ? value : JSON.stringify(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (summary) {
    return (
      <details open={open}>
        <summary>{summary}</summary>
        {content}
      </details>
    );
  }

  return <div style={{ height: "auto", overflow: "auto", width: "100%" }}>{content}</div>;
}

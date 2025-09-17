export function RawDataPreview({
  data,
  open,
  summary,
}: {
  data: unknown;
  open?: boolean;
  summary?: JSX.Element;
}): JSX.Element {
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

export function RawDataTabular({
  data,
  open,
  summary,
}: {
  data: Record<string, unknown>;
  open?: boolean;
  summary?: JSX.Element;
}): JSX.Element {
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
            <td style={{ fontSize: "0.8rem", opacity: 0.8 }}>{key}</td>
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

  return (
    <div style={{ height: "auto", overflow: "auto", width: "100%" }}>
      {content}
    </div>
  );
}

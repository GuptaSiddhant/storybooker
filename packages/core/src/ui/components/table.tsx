export type TableItem = Record<string, unknown>;

export interface TableProps<Item extends TableItem> {
  data: Item[];
  columns: (TableColumn<NoInfer<Item>> | undefined)[];
  caption?: JSX.Element;
  toolbar?: JSX.Element;
}

export interface TableColumn<Item extends TableItem> {
  // oxlint-disable-next-line ban-types
  id: keyof Item | (string & {});
  header?: JSX.Element;
  cell?: (item: Item) => JSX.Element | null;
  style?: JSX.HtmlTag["style"];
}

export function Table<Item extends TableItem>({
  caption,
  columns,
  data,
  toolbar,
}: TableProps<Item>): JSX.Element {
  const cols = columns.filter(Boolean) as TableColumn<Item>[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {caption || toolbar ? (
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: "1rem",
            justifyContent: "space-between",
            padding: "0.5rem 1rem 0",
          }}
        >
          <div style={{ fontSize: "1.1em", fontWeight: "600" }}>{caption}</div>
          <div>{toolbar}</div>
        </div>
      ) : null}

      <div style={{ flex: 1 }}>
        <table>
          <thead>
            <tr>
              {cols.map((col) => (
                <th safe>
                  {col.header && typeof col.header === "string"
                    ? col.header
                    : col.id.toString()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              return (
                <tr>
                  {cols.map((col) => {
                    const value = col.cell?.(item) || item[col.id];
                    if (!value) {
                      return <td></td>;
                    }

                    if (typeof value === "string") {
                      const safeValue = value;
                      return <td style={col.style}>{safeValue}</td>;
                    }

                    if (typeof value === "object") {
                      return (
                        <td safe style={col.style}>
                          {JSON.stringify(value)}
                        </td>
                      );
                    }

                    return (
                      <td safe style={col.style}>
                        {String(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

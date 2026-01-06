import type { JSX } from "hono/jsx";

export type TableItem = Record<string, unknown>;

export interface TableProps<Item extends TableItem> {
  data: Item[];
  columns: (TableColumn<NoInfer<Item>> | undefined)[];
  caption?: JSXChildren;
  toolbar?: JSXChildren;
}

export interface TableColumn<Item extends TableItem> {
  // oxlint-disable-next-line ban-types
  id: keyof Item | (string & {});
  header?: JSXChildren;
  cell?: (item: Item) => JSXElement;
  style?: JSX.CSSProperties;
}

export function Table<Item extends TableItem>({
  caption,
  columns,
  data,
  toolbar,
}: TableProps<Item>): JSXElement {
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
                  {col.header && typeof col.header === "string" ? col.header : col.id.toString()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              return (
                <tr>
                  {cols.map((col) => {
                    const value = col.cell?.(item) ?? item[col.id];
                    return <td style={col.style}>{value}</td>;
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

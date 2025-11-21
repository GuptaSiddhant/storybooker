import type { JSX } from "hono/jsx";

export function Card({
  children,
  style,
  ...props
}: JSX.IntrinsicElements["article"]): JSXElement {
  return (
    <article
      {...props}
      style={
        typeof style === "string"
          ? style
          : {
              border: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              justifyContent: "space-between",
              maxWidth: "500px",
              minHeight: "12rem",
              padding: "1rem",
              position: "relative",
              width: "100%",
              ...style,
            }
      }
    >
      {children}
    </article>
  );
}

export function CardGrid({
  children,
  style,
  ...props
}: JSX.IntrinsicElements["div"]): JSXElement {
  return (
    <div
      {...props}
      style={
        typeof style === "string"
          ? style
          : {
              position: "relative",
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              padding: "1rem",
              justifyContent: "start",
              ...style,
            }
      }
    >
      {children}
    </div>
  );
}

export function CardRow({
  children,
  style,
  ...props
}: JSX.IntrinsicElements["div"]): JSXElement {
  return (
    <div
      {...props}
      style={
        typeof style === "string"
          ? style
          : {
              position: "relative",
              display: "flex",
              gap: "1rem",
              padding: "1rem",
              justifyContent: "start",
              flexWrap: "wrap",
              ...style,
            }
      }
    >
      {children}
    </div>
  );
}

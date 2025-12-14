import { css, cx } from "hono/css";
import type { JSX } from "hono/jsx";

export function Badge(props: JSX.IntrinsicElements["span"]): JSXElement {
  return (
    <span
      {...props}
      class={cx(
        props.class,
        css`
          font-size: 0.8rem;
          border-radius: 0.25rem;
          padding: 0.1rem 0.25rem;
          background-color: var(--color-bg-card);
          border: 1px solid var(--color-border);
          width: fit-content;
        `,
      )}
    />
  );
}

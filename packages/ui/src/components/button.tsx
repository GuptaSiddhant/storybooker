import type { JSX } from "hono/jsx";

export function LinkButton(props: JSX.IntrinsicElements["a"]): JSXElement {
  return <a {...props} class={`button ${props.class?.toString()}`} />;
}

export function DestructiveButton(props: JSX.IntrinsicElements["button"]): JSXElement {
  return <button {...props} class="destructive" />;
}

export function LinkButton(props: JSX.HtmlAnchorTag): JSXElement {
  return <a {...props} class={`button ${props.class?.toString()}`} />;
}

export function DestructiveButton(props: JSX.HtmlButtonTag): JSXElement {
  return <button {...props} class="destructive" />;
}

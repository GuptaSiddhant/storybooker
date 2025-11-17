export function LinkButton(props: JSX.HtmlAnchorTag): JSX.Element {
  return <a {...props} class={`button ${props.class?.toString()}`} />;
}

export function DestructiveButton(props: JSX.HtmlButtonTag): JSX.Element {
  return <button {...props} class="destructive" />;
}

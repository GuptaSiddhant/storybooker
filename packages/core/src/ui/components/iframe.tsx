import type { JSX } from "hono/jsx";

export type IFrameProps = JSX.IntrinsicElements["iframe"];
export function IFrameContainer({
  children,
  ...props
}: IFrameProps): JSXElement {
  return (
    <iframe
      srcdoc={`
        <html style="width:100%; height:100%;">          
        <head><meta charset="utf-8"><meta name="color-scheme" content="light dark"></head>
        <body style="width:100%; height:100%; padding:0; margin:0; font-family:sans-serif; font-size:16px;">
        ${children}</body>
        </html>
        `}
      style={{
        background: "transparent",
        border: "none",
        height: "100%",
        padding: 0,
      }}
      {...props}
      allowTransparency="true"
    />
  );
}

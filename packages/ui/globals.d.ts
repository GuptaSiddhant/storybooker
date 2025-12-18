import type { Child, FC } from "hono/jsx";

declare global {
  /**  */
  type JSXElement = ReturnType<FC>;
  type JSXChildren = Child;
}

declare module "*?raw" {
  const content: string;
  export default content;
}

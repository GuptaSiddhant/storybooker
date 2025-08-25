export interface RouterContext {
  logger: (...args: unknown[]) => void;
  prefix: `/${string}` | undefined;
}

export async function router(
  request: Request,
  context: RouterContext,
): Promise<Response> {
  const body = await request.text();
  context.logger("Hello from Router!");

  return new Response(
    `<html><body><h1>Hello from Router!</h1><pre>${body}<pre></body></html>`,
    {
      headers: { "Content-Type": "text/html" },
      status: 200,
    },
  );
}

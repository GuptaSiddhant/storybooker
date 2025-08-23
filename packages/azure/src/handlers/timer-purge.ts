import { getStore } from "#store";

export function timerPurgeHandler(): void {
  const { context, connectionString } = getStore();
  context.log({ connectionString });
}

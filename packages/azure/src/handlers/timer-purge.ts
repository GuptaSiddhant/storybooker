import { setTimeout } from "node:timers/promises";
import { getStore } from "#store";

export async function timerPurgeHandler(): Promise<void> {
  const { context, connectionString } = getStore();
  await setTimeout(1000);
  context.log({ connectionString });
}

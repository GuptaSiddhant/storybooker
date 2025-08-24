// oxlint-disable-next-line no-abusive-eslint-disable
// oxlint-disable
import type { IncomingHttpHeaders } from "node:http";
import { os } from "@orpc/server";
import z from "zod";

export const PlanetSchema = z.object({
  description: z.string().optional(),
  id: z.number().int().min(1),
  name: z.string(),
});

const listPlanet = os
  .route({ method: "GET", path: "/planets" })
  .input(
    z.object({
      cursor: z.number().int().min(0).default(0),
      limit: z.number().int().min(1).max(100).optional(),
    }),
  )
  .output(z.array(PlanetSchema))
  .handler(({ input }) => {
    return [{ id: 1, name: "name" }];
  });

const findPlanet = os
  .route({ method: "GET", path: "/planets/{id}" })
  .input(z.object({ id: z.coerce.number().int().min(1) }))
  .output(PlanetSchema)
  .handler(({ input }) => {
    return { id: 1, name: "name" };
  });

export const createPlanet = os
  .$context<{ headers: IncomingHttpHeaders }>()
  // .use(({ context, next }) => {
  //   // const user = parseJWT(context.headers.authorization?.split(" ")[1]);

  //   if (user) {
  //     return next({ context: { user } });
  //   }

  //   throw new ORPCError("UNAUTHORIZED");
  // })
  .route({ method: "POST", path: "/planets" })
  .input(PlanetSchema.omit({ id: true }))
  .output(PlanetSchema)
  .handler(({ input }) => {
    return { id: 1, name: "name" };
  });

export default {
  createPlanet,
  findPlanet,
  listPlanet,
};

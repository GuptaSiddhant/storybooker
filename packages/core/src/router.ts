import * as buildsRoutes from "#builds/routes";
import * as labelsRoutes from "#labels/routes";
import * as projectsRoutes from "#projects/routes";
import { router } from "#utils/router-utils";
import * as openapiRoutes from "./root/openapi";
import * as rootRoutes from "./root/routes";
import * as serveRoutes from "./root/serve";

router.registerGroup(rootRoutes);
router.registerGroup(openapiRoutes);
router.registerGroup(serveRoutes);
router.registerGroup(projectsRoutes);
router.registerGroup(labelsRoutes);
router.registerGroup(buildsRoutes);

export { router };

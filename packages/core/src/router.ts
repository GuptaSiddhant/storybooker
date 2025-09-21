import * as buildsRoutes from "#builds/routes";
import * as labelsRoutes from "#labels/routes";
import * as projectsRoutes from "#projects/routes";
import { router } from "#utils/router-utils";
import * as accountRoutes from "./account/routes";
import * as rootRoutes from "./root/routes";

router.registerGroup(rootRoutes);
router.registerGroup(projectsRoutes);
router.registerGroup(labelsRoutes);
router.registerGroup(buildsRoutes);
router.registerGroup(accountRoutes);

export { router };

import { generateOpenApiSpec } from "../../../scripts/gen-openapi-json.ts";
import { router, SERVICE_NAME } from "../src/index.ts";

await generateOpenApiSpec(undefined, router.paths, SERVICE_NAME);

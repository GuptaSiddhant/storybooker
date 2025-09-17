import type { Client } from "openapi-fetch";
import type { paths } from "../service-schema";

export type ServiceClient = Client<paths>;

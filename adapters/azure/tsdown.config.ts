import { definedAdapterConfig } from "../adapters-tsdown-config.ts";

export default definedAdapterConfig({
  "blob-storage": "./src/azure-blob-storage.ts",
  "cosmos-db": "./src/azure-cosmos-db.ts",
  "data-tables": "./src/azure-data-tables.ts",
  "easy-auth": "./src/azure-easy-auth.ts",
  functions: "./src/azure-functions.ts",
});

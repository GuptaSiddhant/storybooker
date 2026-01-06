import { definedAdapterConfig } from "../adapters-tsdown-config.ts";

export default definedAdapterConfig({
  dynamodb: "./src/aws-dynamodb.ts",
  s3: "./src/aws-s3.ts",
});

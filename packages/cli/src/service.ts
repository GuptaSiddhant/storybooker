// oxlint-disable max-lines-per-function
// oxlint-disable new-cap

import fs from "node:fs";
import path from "node:path";
import { styleText } from "node:util";
import type { Client } from "openapi-fetch";
import type { CreateSchemaInputs } from "./schema";
import type { paths } from "./service-schema";
import { toReadableStream } from "./utils";
import { zip } from "./zip";

type ServiceClient = Client<paths, `${string}/${string}`>;

export async function createSBRBuild(
  client: ServiceClient,
  { project, sha, message, labels }: CreateSchemaInputs,
  ignorePrevious?: boolean,
): Promise<void> {
  const { error, response } = await client.POST(
    "/projects/{projectId}/builds/create",
    {
      params: { path: { projectId: project } },
      body: {
        authorEmail: "Siddhant@asd.com",
        authorName: "Siddhant",
        labels,
        sha,
        message,
      },
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  if (error) {
    if (ignorePrevious) {
      console.warn(styleText("yellow", "> StoryBooker Build already exits."));
    } else {
      throw new Error(
        error.errorMessage ||
          `Request to StoryBooker service failed with status: ${response.status}.`,
      );
    }
  } else {
    console.log("StoryBooker Build '%s - %s' created.", project, sha);
  }
}

export async function uploadSBRBuild(
  client: ServiceClient,
  {
    project,
    sha,
    dirpath,
    variant,
    cwd,
  }: {
    project: string;
    sha: string;
    dirpath: string;
    variant: "storybook" | "testReport" | "coverage" | "screenshots";
    cwd: string;
  },
): Promise<void> {
  const zipFilepath = path.join(cwd, `${variant}.zip`);

  console.log(
    `> Compressing directory '%s' to file '%s'...`,
    path.relative(cwd, dirpath),
    path.relative(cwd, zipFilepath),
  );
  zip(path.join(dirpath, "*"), zipFilepath);

  const fileSize = fs.statSync(zipFilepath).size;

  console.log(`> Uploading file '%s'...`, path.relative(cwd, zipFilepath));
  const { error, response } = await client.POST(
    "/projects/{projectId}/builds/{buildSHA}/upload",
    {
      params: {
        path: { projectId: project, buildSHA: sha },
        query: { variant },
      },
      // @ts-expect-error assign stream to object
      body: toReadableStream(fs.createReadStream(zipFilepath), fileSize),
      bodySerializer: (body) => body,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/zip",
        "Content-Length": fileSize.toString(),
      },
      duplex: "half",
    },
  );

  if (error) {
    throw new Error(
      error.errorMessage ||
        `Request to StoryBooker service failed with status: ${response.status}.`,
    );
  } else {
    console.log(
      "> StoryBooker uploaded '%s / %s / %s'.",
      project,
      sha,
      variant,
    );
  }
}

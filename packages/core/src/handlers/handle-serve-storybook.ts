import path from "node:path";
import { urlBuilder } from "../urls";
import { authenticateOrThrow } from "../utils/auth";
import {
  CACHE_CONTROL_PUBLIC_YEAR,
  HEADERS,
  SERVICE_NAME,
} from "../utils/constants";
import { getMimeType } from "../utils/mime-utils";
import { responseError } from "../utils/response";
import { generateStorageContainerId } from "../utils/shared-model";
import { getStore } from "../utils/store";

export async function handleServeStoryBook({
  buildSHA,
  filepath,
  projectId,
}: {
  buildSHA: string;
  projectId: string;
  filepath: string;
}): Promise<Response> {
  const { abortSignal, logger, storage, ui } = getStore();
  const storageFilepath = path.posix.join(buildSHA, filepath);
  await authenticateOrThrow({ action: "read", projectId, resource: "build" });

  try {
    const { content, mimeType } = await storage.downloadFile(
      generateStorageContainerId(projectId),
      storageFilepath,
      { abortSignal, logger },
    );

    if (!content) {
      return await responseError("File does not contain any content", 404);
    }

    const headers = new Headers();
    headers.set(HEADERS.contentType, mimeType ?? getMimeType(filepath));
    headers.append(HEADERS.cacheControl, CACHE_CONTROL_PUBLIC_YEAR);

    if (filepath.endsWith("index.html")) {
      // Appending custom UI to index.html
      const data =
        typeof content === "string"
          ? content
          : await new Response(content).text();
      const bodyWithBackButton = data.replace(
        `</body>`,
        `
              <div><a id="view-all" href="${urlBuilder.allBuilds(projectId)}"
              style="position: fixed; bottom: 0.5rem; left: 0.5rem; z-index: 9999; padding: 0.25rem 0.5rem; background-color: black; color: white; border-radius: 0.25rem; text-decoration: none; font-size: 1rem; font-face: sans-serif; font-weight: 400;">
              ← ${SERVICE_NAME}
              </a></div></body>`,
      );

      return new Response(bodyWithBackButton, { headers, status: 200 });
    }

    if (ui?.streaming === false && content instanceof ReadableStream) {
      const body = await new Response(content).arrayBuffer();
      return new Response(body, { headers, status: 200 });
    }

    return new Response(content, { headers, status: 200 });
  } catch (error) {
    return await responseError(error, 404);
  }
}

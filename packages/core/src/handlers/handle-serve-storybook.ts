import path from "node:path";
import { SuperHeaders } from "@remix-run/headers";
import { urlBuilder } from "../urls";
import { generateStorageContainerId } from "../utils/adapter-utils";
import { authenticateOrThrow } from "../utils/auth";
import { CACHE_CONTROL_PUBLIC_YEAR, SERVICE_NAME } from "../utils/constants";
import { getMimeType } from "../utils/mime-utils";
import { responseError } from "../utils/response";
import { getStore } from "../utils/store";

export async function handleServeStoryBook({
  buildId,
  filepath,
  projectId,
}: {
  buildId: string;
  projectId: string;
  filepath: string;
}): Promise<Response> {
  const { abortSignal, logger, storage } = getStore();
  const storageFilepath = path.posix.join(buildId, filepath);
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

    const headers = new SuperHeaders();
    headers.contentType = mimeType ?? getMimeType(filepath);
    headers.cacheControl = CACHE_CONTROL_PUBLIC_YEAR;

    if (filepath.endsWith("index.html")) {
      // Appending custom UI to index.html
      const data = typeof content === "string" ? content : await new Response(content).text();
      const bodyWithBackButton = data.replace(
        `</body>`,
        `
  <div><a id="view-all" href="${urlBuilder.buildsList(projectId)}"
  style="position: fixed; bottom: 0.5rem; left: 0.5rem; z-index: 9999; padding: 0.25rem 0.5rem; background-color: black; color: white; border-radius: 0.25rem; text-decoration: none; font-size: 1rem; font-face: sans-serif; font-weight: 400;">
  ← ${SERVICE_NAME}
  </a></div>
  
  ${relativeHrefScripts}
</body>`,
      );

      return new Response(bodyWithBackButton, { headers, status: 200 });
    }

    if (filepath.endsWith("iframe.html")) {
      // Appending custom UI to index.html
      const data = typeof content === "string" ? content : await new Response(content).text();
      const bodyWithBackButton = data.replace(
        `</body>`,
        `
${relativeHrefScripts}
</body>`,
      );

      return new Response(bodyWithBackButton, { headers, status: 200 });
    }

    if (content instanceof ReadableStream) {
      const body = await new Response(content).arrayBuffer();
      return new Response(body, { headers, status: 200 });
    }

    return new Response(content, { headers, status: 200 });
  } catch (error) {
    return await responseError(error, 404);
  }
}

const relativeHrefScripts = `
<script defer>
// script to replace absolute links with relative links 
window.addEventListener('load', () => {
  const linkElements = document.querySelectorAll("[href^='/']");
  linkElements.forEach((el) => {
    const href = typeof el.href === "string" ? el.href : el.href.baseVal;
    const newHref = "." + href.replace(origin, "");
    el.setAttribute("href", newHref);
  });
  const mediaElements = document.querySelectorAll("[src^='/']");
  mediaElements.forEach((el) => {    
    const newSrc = el.src.replace(origin, ".");
    el.setAttribute("src", newSrc);
    if (el.hasAttribute("srcset")) {
      const newSrcset = el.srcset.replaceAll(origin, ".");
      el.setAttribute("srcset", newSrcset);
    }
  });
}, { once: true });
</script>`;

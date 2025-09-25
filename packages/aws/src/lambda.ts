import { createRequestHandler } from "@storybooker/core";
import { CONTENT_TYPES, HEADERS } from "@storybooker/core/constants";
import type {
  RequestHandlerOptions,
  StoryBookerUser,
} from "@storybooker/core/types";
import { generatePrefixFromBaseRoute } from "@storybooker/core/utils";
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

export interface CreateStorybookerRouterOptions<User extends StoryBookerUser>
  extends Omit<RequestHandlerOptions<User>, "abortSignal" | "prefix"> {
  /**
   * Define the route prefix for the Lambda handler.
   * @default ''
   */
  route?: string;
}

export function createStoryBookerRouterHandler<User extends StoryBookerUser>(
  options: CreateStorybookerRouterOptions<User>,
) {
  const route = options.route || "";

  const requestHandler = createRequestHandler({
    ...options,
    prefix: generatePrefixFromBaseRoute(route) || "/",
  });

  // Return a Lambda handler function
  return async (
    event: APIGatewayProxyEventV2,
    _context: Context,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const request = transformApiGatewayEventToWebRequest(event);
      const response = await requestHandler(request);

      return await transformWebResponseToApiGatewayResult(response);
    } catch (error) {
      return {
        body: JSON.stringify({ error, message: "Internal Server Error" }),
        headers: { [HEADERS.contentType]: CONTENT_TYPES.JSON },
        statusCode: 500,
      };
    }
  };
}

function transformApiGatewayEventToWebRequest(
  event: APIGatewayProxyEventV2,
): Request {
  const { method } = event.requestContext.http;

  return new Request(
    event.rawPath + (event.rawQueryString ? "?" + event.rawQueryString : ""),
    {
      body: event.body
        ? Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8")
        : undefined,
      // @ts-expect-error - Duplex is required for streaming but not supported in Node.js typings yet
      duplex: "half",
      headers: generateHttpHeadersFromApiGatewayProxyEvent(event),
      method,
    },
  );
}

function generateHttpHeadersFromApiGatewayProxyEvent(
  event: APIGatewayProxyEventV2 | APIGatewayProxyEvent,
): Headers {
  const headers = new Headers();

  const eventHeaders = event.headers;
  for (const [name, value] of Object.entries(eventHeaders)) {
    if (value) {
      headers.set(name, value);
    }
  }

  const eventMultiValueHeaders =
    "multiValueHeaders" in event ? event.multiValueHeaders : {};
  for (const [name, values] of Object.entries(eventMultiValueHeaders)) {
    if (values && Array.isArray(values) && values.length > 0) {
      for (const value of values) {
        headers.append(name, value);
      }
    }
  }

  return headers;
}

async function transformWebResponseToApiGatewayResult(
  response: Response,
): Promise<APIGatewayProxyResult> {
  const headers: Record<string, string> = {};
  const multiValueHeaders: Record<string, string[]> = {};
  for (const [key, value] of response.headers) {
    if (value !== undefined) {
      if (key in headers) {
        if (multiValueHeaders[key]) {
          multiValueHeaders[key].push(value);
        } else {
          multiValueHeaders[key] = [value];
        }
      } else {
        headers[key] = value;
      }
    }
  }

  const contentType = response.headers.get(HEADERS.contentType);
  if (
    contentType?.startsWith("text/") ||
    contentType?.startsWith(CONTENT_TYPES.JSON)
  ) {
    const body = await response.text();

    return {
      body,
      headers,
      isBase64Encoded: false,
      multiValueHeaders,
      statusCode: response.status,
    };
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const body = buffer.toString("base64");

  return {
    body,
    headers,
    isBase64Encoded: true,
    multiValueHeaders,
    statusCode: response.status,
  };
}

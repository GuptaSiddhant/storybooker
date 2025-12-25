import type { RenderedContent } from "storybooker/~internal/adapter/ui";
import type { ParsedError } from "storybooker/~internal/types";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document.tsx";
import { ErrorMessage } from "../components/error-message.tsx";

export function ErrorPage({ errorMessage, errorType, errorStatus }: ParsedError): RenderedContent {
  const title = `${errorType} ${errorStatus ? `- ${errorStatus}` : ""}`;
  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          {
            href: "javascript:history.back()",
            label: `< Back`,
          },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: 0 }}>
        <ErrorMessage>{errorMessage}</ErrorMessage>
      </DocumentMain>
      <DocumentSidebar />
      <DocumentUserSection />
    </DocumentLayout>
  );
}

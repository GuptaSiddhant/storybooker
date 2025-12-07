import type { ParsedError } from "@storybooker/core/types";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { ErrorMessage } from "../components/error-message";

export function ErrorPage({ errorMessage, errorType, errorStatus }: ParsedError): JSXElement {
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

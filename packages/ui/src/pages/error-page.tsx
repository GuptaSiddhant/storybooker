import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { ErrorMessage } from "../components/error-message";

export function ErrorPage({
  title,
  message,
}: {
  title: string;
  message: string;
}): JSXElement {
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
        <ErrorMessage>{message}</ErrorMessage>
      </DocumentMain>
      <DocumentSidebar />
      <DocumentUserSection />
    </DocumentLayout>
  );
}

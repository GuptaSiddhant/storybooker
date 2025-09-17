// oxlint-disable max-lines-per-function
// oxlint-disable sort-keys

import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "#components/document";
import { ErrorMessage } from "#components/error-message";
import { RawDataPreview } from "#components/raw-data";
import { ProjectsTable } from "#projects-ui/projects-table";
import type { ProjectType } from "#projects/schema";
import { getStore } from "#store";
import { href, urlBuilder, URLS } from "#urls";
import type { StoryBookerUser } from "../types";

export interface RootPageProps {
  projects: ProjectType[];
}
export function renderRootPage({ projects }: RootPageProps): JSX.Element {
  return (
    <DocumentLayout title="Home">
      <DocumentHeader
        toolbar={
          <a href={href(URLS.ui.openapi)} target="_blank">
            OpenAPI
          </a>
        }
      >
        Home
      </DocumentHeader>
      <DocumentMain style={{ padding: 0 }}>
        <ProjectsTable
          projects={projects}
          toolbar={<a href={urlBuilder.allProjects()}>View all</a>}
        />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <a href={href(URLS.projects.create)}>Create project</a>
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderErrorPage({
  title,
  message,
}: {
  title: string;
  message: string;
}): JSX.Element {
  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[{ href: "javascript:history.back()", label: "< Back" }]}
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

// oxlint-disable-next-line max-lines-per-function
export function renderAccountPage({
  children,
}: {
  children: string | undefined;
}): JSX.Element {
  const { auth, user } = getStore();

  // oxlint-disable-next-line no-non-null-assertion
  const { displayName, id, imageUrl, title, ...rest } = user!;

  return (
    <DocumentLayout title="Account">
      <DocumentHeader breadcrumbs={["Home"]}>Account</DocumentHeader>

      <DocumentMain style={children ? {} : { padding: "1rem" }}>
        {children ? (
          <iframe
            title="Account Details"
            srcdoc={`
          <html style="width:100%; height:100%;">          
          <head><meta charset="utf-8"><meta name="color-scheme" content="light dark"></head>
          <body style="width:100%; height:100%; padding:0; margin:0; font-family:sans-serif; font-size:16px;">
          ${children}</body>
          </html>
          `}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              height: "100%",
            }}
            // @ts-expect-error missing property
            allowTransparency="true"
          />
        ) : (
          <span class="description">
            No further information about the Account is provided by the service.
          </span>
        )}
      </DocumentMain>

      <DocumentSidebar style={{ padding: "1rem" }}>
        <UserInfo
          displayName={displayName}
          id={id}
          imageUrl={imageUrl}
          title={title}
        />
        {Object.keys(rest).length > 0 ? <RawDataPreview data={rest} /> : null}
      </DocumentSidebar>

      {auth?.logout ? (
        <form
          id="user"
          action={href(URLS.ui.logout)}
          hx-get={href(URLS.ui.logout)}
          hx-confirm="Are you sure about logging out?"
        >
          <button class="destructive" style={{ height: "100%" }}>
            Logout
          </button>
        </form>
      ) : (
        <DocumentUserSection />
      )}
    </DocumentLayout>
  );
}

function UserInfo({
  displayName,
  id,
  imageUrl,
  title,
}: StoryBookerUser): JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {imageUrl ? (
        <img
          alt={id}
          src={imageUrl}
          style={{
            width: "8rem",
            minWidth: "8rem",
            height: "8rem",
            borderRadius: "0.5rem",
            overflow: "hidden",
            objectFit: "cover",
            border: "1px solid",
          }}
        />
      ) : null}

      <div
        style={{
          overflow: "hidden",
          textWrap: "nowrap",
          textOverflow: "ellipsis",
          fontWeight: "bold",
          fontSize: "1.5rem",
        }}
        title={displayName}
      >
        {displayName}
      </div>
      {title ? (
        <div
          style={{
            overflow: "hidden",
            textWrap: "nowrap",
            textOverflow: "ellipsis",
            opacity: 0.8,
          }}
          title={title}
        >
          {title}
        </div>
      ) : null}
    </div>
  );
}

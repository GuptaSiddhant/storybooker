// oxlint-disable max-lines-per-function
// oxlint-disable sort-keys

import { DestructiveButton } from "#components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "#components/document";
import { ErrorMessage } from "#components/error-message";
import { IFrameContainer } from "#components/iframe";
import { RawDataList } from "#components/raw-data";
import { ProjectsTable } from "#projects-ui/projects-table";
import type { ProjectType } from "#projects/schema";
import { getStore } from "#store";
import { href, urlBuilder, URLS } from "#urls";
import { commonT } from "#utils/i18n";
import { toTitleCase } from "#utils/text-utils";
import type { StoryBookerUser } from "../types";

export interface RootPageProps {
  projects: ProjectType[];
}
export function renderRootPage({ projects }: RootPageProps): JSX.Element {
  const { translation } = getStore();
  const pageTitle = commonT.Home();

  return (
    <DocumentLayout title={pageTitle}>
      <DocumentHeader
        toolbar={
          <a href={href(URLS.ui.openapi)} target="_blank">
            OpenAPI
          </a>
        }
      >
        {pageTitle}
      </DocumentHeader>
      <DocumentMain style={{ padding: 0 }}>
        <ProjectsTable
          projects={projects}
          toolbar={
            <a href={urlBuilder.allProjects()}>
              {toTitleCase(translation.dictionary.view_all)}
            </a>
          }
        />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <a href={href(URLS.projects.create)}>
          {toTitleCase(
            `${translation.dictionary.create} ${translation.dictionary.project}`,
          )}
        </a>
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
  const { translation } = getStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          {
            href: "javascript:history.back()",
            label: `< ${toTitleCase(translation.dictionary.back)}`,
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

// oxlint-disable-next-line max-lines-per-function
export function renderAccountPage({
  children,
}: {
  children: string | undefined;
}): JSX.Element {
  const { auth, translation, user } = getStore();
  const pageTitle = toTitleCase(translation.dictionary.account);
  // oxlint-disable-next-line no-non-null-assertion
  const { displayName, id, imageUrl, title, ...rest } = user!;

  return (
    <DocumentLayout title={pageTitle}>
      <DocumentHeader breadcrumbs={[commonT.Home()]}>
        {pageTitle}
      </DocumentHeader>

      <DocumentMain style={children ? {} : { padding: "1rem" }}>
        {children ? (
          <IFrameContainer title={translation.dictionary.account}>
            {children}
          </IFrameContainer>
        ) : (
          <span class="description">
            {translation.messages.no_account_details_provided}
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
        {Object.keys(rest).length > 0 ? <RawDataList data={rest} /> : null}
      </DocumentSidebar>

      {auth?.logout ? (
        <form
          id="user"
          action={href(URLS.ui.logout)}
          hx-get={href(URLS.ui.logout)}
          hx-confirm={translation.confirmations.logout}
        >
          <DestructiveButton style={{ height: "100%" }}>
            {toTitleCase(translation.dictionary.logout)}
          </DestructiveButton>
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        marginBottom: "1rem",
      }}
    >
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

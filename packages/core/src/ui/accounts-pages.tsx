import type { StoryBookerUser } from "../types";
import { href, URLS } from "../urls";
import { getStore } from "../utils/store";
import { toTitleCase } from "../utils/text-utils";
import { DestructiveButton } from "./components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "./components/document";
import { IFrameContainer } from "./components/iframe";
import { RawDataList } from "./components/raw-data";
import { commonT } from "./translations/i18n";

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
            width: "100%",
            minWidth: "8rem",
            aspectRatio: "1",
            overflow: "hidden",
            objectFit: "cover",
            border: "1px solid",
            maxWidth: "10rem",
          }}
        />
      ) : null}

      <div
        style={{
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

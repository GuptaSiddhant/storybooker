import type { StoryBookerUser } from "@storybooker/core";
import { getStore } from "@storybooker/core/store";
import { urlBuilder } from "@storybooker/core/url";
import { DestructiveButton } from "../components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { IFrameContainer } from "../components/iframe";
import { RawDataList } from "../components/raw-data";

export function AccountPage({
  children,
}: {
  children: string | undefined;
}): JSXElement {
  const { auth, user } = getStore();

  const pageTitle = "Account";
  // oxlint-disable-next-line no-non-null-assertion
  const { displayName, id, imageUrl, title, ...rest } = user!;
  const logoutUrl = urlBuilder.logout();

  return (
    <DocumentLayout title={pageTitle}>
      <DocumentHeader breadcrumbs={["Home"]}>{pageTitle}</DocumentHeader>

      <DocumentMain style={children ? {} : { padding: "1rem" }}>
        {children ? (
          <IFrameContainer title={pageTitle}>{children}</IFrameContainer>
        ) : (
          <span class="description">No account details are provided.</span>
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
          action={logoutUrl}
          hx-get={logoutUrl}
          hx-confirm={"Are you sure that you wish to logout?"}
        >
          <DestructiveButton style={{ height: "100%" }}>
            Logout
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
}: StoryBookerUser): JSXElement {
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

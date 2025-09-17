// oxlint-disable sort-keys
// oxlint-disable max-lines
// oxlint-disable max-lines-per-function

import { SERVICE_NAME } from "#constants";
import { getStore } from "#store";
import { href, urlBuilder, URLS } from "#urls";
import { urlJoin } from "#utils/url";
import { globalStyleSheet } from "./_global";

type Children = JSX.Element | null | (JSX.Element | null)[];

export function DocumentLayout({
  title,
  children,
  footer,
}: {
  id?: string;
  title: string;
  children: Children;
  footer?: JSX.Element | null;
  account?: JSX.Element | null;
}): JSX.Element {
  const safeStylesheet = globalStyleSheet();

  return (
    <>
      {"<!DOCTYPE html>"}
      <html lang="en">
        <head>
          <title safe>
            {title} | {SERVICE_NAME}
          </title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>{safeStylesheet}</style>
          <script
            src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.6/dist/htmx.min.js"
            crossorigin="anonymous"
          ></script>
          <script
            src="https://cdn.jsdelivr.net/npm/htmx-ext-response-targets@2.0.2"
            crossorigin="anonymous"
          ></script>
        </head>
        <body>
          <div id="app">
            <div id="logo">
              <Logo />
            </div>

            {children}

            <footer>
              {footer ?? (
                <div
                  style={{
                    color: "var(--color-text-secondary)",
                    textAlign: "end",
                    width: "100%",
                    fontSize: "0.8rem",
                  }}
                >
                  {SERVICE_NAME} 2025
                </div>
              )}
            </footer>
          </div>

          <script
            defer
            src="https://unpkg.com/htmx-toaster/dist/htmx-toaster.min.js"
          />
        </body>
      </html>
    </>
  );
}

function Logo(): JSX.Element {
  return (
    <a href={urlBuilder.root()} title="Home">
      <strong
        style={{
          color: "var(--color-text-primary)",
          display: "block",
          fontFamily: "monospace",
          fontSize: "1.2em",
          lineHeight: "0.8",
          textAlign: "center",
        }}
      >
        STORY
        <br />
        <span style={{ fontSize: "0.7em" }}>BOOKER</span>
      </strong>
    </a>
  );
}

export function DocumentHeader({
  breadcrumbs = [],
  children,
  toolbar,
}: {
  breadcrumbs?: string[] | Array<{ label: string; href?: string }>;
  children: Children;
  toolbar?: JSX.Element | null;
}): JSX.Element {
  const store = getStore();

  return (
    <header>
      <div class="page-heading" style={{ flex: 1 }}>
        {breadcrumbs.length > 0 ? (
          <ul>
            {breadcrumbs.map((crumb, index, arr) => {
              const href =
                (typeof crumb === "object" ? crumb.href : "") ||
                urlJoin(
                  store.url,
                  ...Array.from({ length: arr.length - index }).map(() => ".."),
                );
              return (
                <li>
                  <a safe href={href}>
                    {typeof crumb === "object" ? crumb.label : crumb}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
        <div safe>{children}</div>
      </div>

      {toolbar ? <div>{toolbar}</div> : null}
    </header>
  );
}

export function DocumentMain({
  children,
  style,
}: {
  style?: JSX.CSSProperties;
  children: Children;
}): JSX.Element {
  return <main style={style}>{children}</main>;
}

export function DocumentSidebar({
  children,
  style,
}: {
  style?: JSX.CSSProperties;
  children?: Children;
}): JSX.Element {
  return <aside style={style}>{children}</aside>;
}

export function DocumentUserSection(): JSX.Element {
  const { auth, user } = getStore();

  if (!user) {
    return (
      <div id="user" style={{ padding: "1rem" }}>
        {auth?.login ? (
          <form action={href(URLS.ui.login)}>
            <button style={"padding:0"}>Login</button>
          </form>
        ) : (
          <span style={{ opacity: 0.5 }}>Anonymous</span>
        )}
      </div>
    );
  }

  return (
    <a
      id="user"
      href={href(URLS.ui.account)}
      style={{
        padding: 0,
        paddingLeft: user.imageUrl ? "0.5rem" : "1rem",
        paddingRight: auth?.logout ? "0.5rem" : "1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        textDecoration: "none",
      }}
    >
      {user.imageUrl ? (
        <img
          alt={user.id}
          src={user.imageUrl}
          style={{
            width: "2rem",
            minWidth: "2rem",
            height: "2rem",
            borderRadius: "0.25rem",
            overflow: "hidden",
            objectFit: "cover",
            border: "1px solid",
          }}
        />
      ) : null}

      <div style={{ flex: 1, overflow: "hidden" }}>
        <div
          style={{
            overflow: "hidden",
            textWrap: "nowrap",
            textOverflow: "ellipsis",
          }}
          title={user.displayName}
        >
          {user.displayName}
        </div>
        {user.title ? (
          <div
            style={{
              fontSize: "0.8em",
              opacity: 0.8,
              overflow: "hidden",
              textWrap: "nowrap",
              textOverflow: "ellipsis",
            }}
            title={user.title}
          >
            {user.title}
          </div>
        ) : null}
      </div>

      <span style={{ opacity: 0.5 }}>{"&rarr;"}</span>
    </a>
  );
}

import { html } from "hono/html";
import type { JSX } from "hono/jsx";
import { href, urlBuilder, URLS } from "../../urls";
import { SCRIPTS, SERVICE_NAME, STYLESHEETS } from "../../utils/constants";
import { getStore } from "../../utils/store";
import { urlJoin } from "../../utils/url-utils";
import { SBRLogo } from "./logo";

export function DocumentLayout({
  title,
  children,
  footer,
}: {
  id?: string;
  title: string;
  children: JSXChildren;
  footer?: JSXChildren;
  account?: JSXChildren;
}): JSXElement {
  return (
    <>
      {html`<!DOCTYPE html>`}
      <html lang="en">
        <head>
          <title>
            {title} | {SERVICE_NAME}
          </title>
          <link
            rel="icon"
            href={"https://storybooker.js.org/img/SBR_white_128.jpg"}
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href={urlBuilder.staticFile(STYLESHEETS.globalStyles)}
            rel="stylesheet"
          />
          <script
            src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.6/dist/htmx.min.js"
            crossorigin="anonymous"
          ></script>
          <script
            src="https://cdn.jsdelivr.net/npm/htmx-ext-response-targets@2.0.2"
            crossorigin="anonymous"
          ></script>
          <script
            src={urlBuilder.staticFile(SCRIPTS.globalScript)}
            defer
            async
          />
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
                    width: "100%",
                    fontSize: "0.8rem",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "end",
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

function Logo(): JSXElement {
  const { ui } = getStore();
  const { logo } = ui || {};

  const logoElement = logo ? (
    logo.includes("<") && logo.includes(">") ? (
      logo // HTML
    ) : (
      <img
        src={logo}
        style="width:100%; object-fit:contain; background:white; padding:4px; border-radius: 4px;"
      />
    )
  ) : undefined;

  return (
    <a
      href={urlBuilder.homepage()}
      title="Home"
      style={{
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
      }}
    >
      <SBRLogo
        style={{
          color: "var(--color-text-primary)",
          height: "32px",
          width: "64px",
        }}
      />

      {logoElement ? (
        <>
          <div
            style={{
              background: "var(--color-border)",
              width: "1px",
              height: "40px",
            }}
          />
          <div
            style={{
              maxWidth: "80px",
              maxHeight: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {logoElement}
          </div>
        </>
      ) : null}
    </a>
  );
}

export function DocumentHeader({
  breadcrumbs = [],
  children,
  toolbar,
}: {
  breadcrumbs?: string[] | Array<{ label: string; href?: string }>;
  children: JSXChildren;
  toolbar?: JSXElement | null;
}): JSXElement {
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
        <div>{children}</div>
      </div>

      {toolbar ? (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            justifyContent: "end",
          }}
        >
          {toolbar}
        </div>
      ) : null}
    </header>
  );
}

export function DocumentMain({
  children,
  style,
}: {
  style?: JSX.CSSProperties;
  children: JSXChildren;
}): JSXElement {
  return <main style={style}>{children}</main>;
}

export function DocumentSidebar({
  children,
  style,
}: {
  style?: JSX.CSSProperties;
  children?: JSXChildren;
}): JSXElement {
  return <aside style={style}>{children}</aside>;
}

export function DocumentUserSection(): JSXElement {
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

import { css, Style } from "hono/css";
import { html } from "hono/html";
import type { JSX } from "hono/jsx";
import { SERVICE_NAME } from "storybooker/_internal/constants";
import { ASSETS } from "../utils/constants.ts";
import { getUIStore } from "../utils/ui-store.ts";
import { Icon } from "./icon.tsx";

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
  const { urlBuilder } = getUIStore();

  return (
    <>
      {html`<!DOCTYPE html>`}
      <html lang="en">
        <head>
          <title>
            {title} | {SERVICE_NAME}
          </title>
          <link rel="icon" href={"https://storybooker.js.org/img/SBR_white_128.jpg"} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link href={urlBuilder.staticFile(ASSETS.globalStyles)} rel="stylesheet" />
          <link
            rel="preload"
            as="image"
            type="image/svg+xml"
            href={urlBuilder.staticFile(ASSETS.globalSprite)}
          />
          <script
            src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.6/dist/htmx.min.js"
            crossorigin="anonymous"
          ></script>
          <script
            src="https://cdn.jsdelivr.net/npm/htmx-ext-response-targets@2.0.2"
            crossorigin="anonymous"
          ></script>
          <Style />
        </head>
        <body>
          <div id="app">
            <div id="logo">
              <Logo href={urlBuilder.homepage()} />
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
        </body>
      </html>
    </>
  );
}

function Logo({ href }: { href: string }): JSXElement {
  const { logo } = getUIStore();

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
      href={href}
      title="Home"
      style={{
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
      }}
    >
      <Icon
        name="logo"
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
  breadcrumbs?: { label: string; href?: string }[];
  children: JSXChildren;
  toolbar?: JSXElement | null;
}): JSXElement {
  return (
    <header>
      <div class="page-heading" style={{ flex: 1 }}>
        {breadcrumbs.length > 0 ? (
          <ul>
            {breadcrumbs.map((crumb) => {
              const href = typeof crumb === "object" ? crumb.href : "";
              return (
                <li>
                  <a href={href}>{typeof crumb === "object" ? crumb.label : crumb}</a>
                  <span class={css`display: inline-block; padding: 0 0.25rem; opacity: 0.5;`}>
                    /
                  </span>
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
  const { isAuthEnabled, user, url, urlBuilder } = getUIStore();

  if (!user) {
    const { pathname } = new URL(url);
    const actionUrl = urlBuilder.login(pathname);

    return (
      <div id="user" style={{ padding: "1rem" }}>
        {isAuthEnabled ? (
          <form action={actionUrl}>
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
      href={urlBuilder.account()}
      style={{
        padding: 0,
        paddingLeft: user.imageUrl ? "0.5rem" : "1rem",
        paddingRight: isAuthEnabled ? "0.5rem" : "1rem",
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

      <span style={{ opacity: 0.5 }}>→</span>
    </a>
  );
}

// oxlint-disable sort-keys
// oxlint-disable max-lines
// oxlint-disable max-lines-per-function

import { SERVICE_NAME } from "#constants";
import { getStore } from "#store";
import { urlBuilder } from "#urls";
import { urlJoin } from "#utils/url";
import { globalStyleSheet } from "./_global";

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

export function DocumentLayout({
  title,
  breadcrumbs = [],
  children,
  footer,
  toolbar,
  sidebar,
  style,
}: {
  title: string;
  breadcrumbs?: string[] | Array<{ label: string; href?: string }>;
  children: JSX.Element;
  footer?: JSX.Element | null;
  toolbar?: JSX.Element | null;
  sidebar?: JSX.Element | null;
  style?: JSX.CSSProperties;
}): JSX.Element {
  const safeStylesheet = globalStyleSheet();
  const store = getStore();

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

            <header>
              <div class="page-heading" style={{ flex: 1 }}>
                {breadcrumbs.length > 0 ? (
                  <ul>
                    {breadcrumbs.map((crumb, index, arr) => {
                      const href =
                        (typeof crumb === "object" ? crumb.href : "") ||
                        urlJoin(
                          store.url,
                          ...Array.from({ length: arr.length - index }).map(
                            () => "..",
                          ),
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
                <div safe>{title}</div>
              </div>

              {toolbar ? <div>{toolbar}</div> : null}
            </header>

            <main style={style}>{children}</main>

            <footer>
              {footer ?? (
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {SERVICE_NAME} 2025
                </span>
              )}
            </footer>

            <aside>{sidebar}</aside>

            <div style={{ gridArea: "user", padding: "1rem" }}>
              <span style={{ opacity: 0.5 }}>Anonymous</span>
            </div>
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

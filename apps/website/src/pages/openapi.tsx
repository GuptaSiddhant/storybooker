import Layout from "@theme/Layout";

export default function OpenApi(): React.ReactNode {
  return (
    <Layout title="OpenAPI" description="StoryBooker OpenAPI">
      <iframe
        style={{ border: "none", height: "100vh", width: "100%" }}
        srcDoc={`<!doctype html>
<html>
  <head>
    <title>StoryBooker API Reference</title>
    <meta name="description" content="StoryBooker SwaggerUI"></meta>
    <meta charset="utf-8"></meta>
    <meta name="viewport" content="width=device-width, initial-scale=1" ></meta>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css"></link>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js" crossorigin></script>
  </head>

<body style="position: relative;">
  <div id="swagger-ui"></div>
  <a style="position: absolute; top: 0; right: 0; padding-right: 16px; display: flex; gap: 0.5rem;"
    href="/openapi.json">
    Download
  </a>
  <script async defer>
      window.swaggerUI = SwaggerUIBundle(${JSON.stringify({
        dom_id: "#swagger-ui",
        url: "/openapi.json",
      })});
  </script>
</body>
</html>`}
      />
    </Layout>
  );
}

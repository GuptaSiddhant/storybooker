import Layout from "@theme/Layout";

export default function OpenApi(): React.ReactNode {
  const id = "app";
  const options = { dom_id: `#${id}`, url: "/openapi.json" };

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
  <body>
    <div id="${id}"></div>
    <script async defer>
      window.swaggerUI = SwaggerUIBundle(${JSON.stringify(options)});
    </script>
  </body>
</html>`}
      />
    </Layout>
  );
}

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
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>

  <body>
    <div id="app"></div>

    <!-- Load the Script -->
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

    <!-- Initialize the Scalar API Reference -->
    <script>
      Scalar.createApiReference('#app', {        
        url: '/openapi.json',
        title: 'StoryBooker',
        hideClientButton: true,
        hideTestRequestButton: true,
        showToolbar: 'never',
      })
    </script>
  </body>
</html>`}
      />
    </Layout>
  );
}

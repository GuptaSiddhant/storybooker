// oxlint-disable sort-keys

import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "StoryBooker",
  tagline: "Host and manage your own Storybooks",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
    experimental_faster: true,
  },

  // Set the production url of your site here
  url: "https://storybooker.js.org",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "GuptaSiddhant", // Usually your GitHub org/user name.
  projectName: "storybooker", // Usually your repo name.

  onBrokenLinks: "throw",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
        },

        theme: {
          // customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [require.resolve("@easyops-cn/docusaurus-search-local")],

  themeConfig: {
    // Replace with your project's social card
    // image: "img/docusaurus-social-card.jpg",
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "StoryBooker",
      // logo: {
      //   alt: "StoryBooker Logo",
      //   src: "img/logo.svg",
      // },
      items: [
        {
          type: "docSidebar",
          sidebarId: "mainSidebar",
          position: "left",
          label: "Docs",
        },
        {
          href: "/openapi",
          label: "OpenAPI",
          position: "right",
        },
        {
          href: "https://github.com/GuptaSiddhant/storybooker",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      // links: [
      //   {
      //     title: "Docs",
      //     items: [
      //       {
      //         label: "Core",
      //         to: "/docs/core",
      //       },
      //     ],
      //   },

      //   {
      //     title: "More",
      //     items: [
      //       {
      //         label: "GitHub",
      //         href: "https://github.com/GuptaSiddhant/storybooker",
      //       },
      //     ],
      //   },
      // ],
      copyright: `Copyright © 2025 StoryBooker, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

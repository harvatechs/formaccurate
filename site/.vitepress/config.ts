import { defineConfig } from "vitepress";

export default defineConfig({
  title: "FormAccurate",
  description: "Native Form Protocol & Autonomous Agent Schema Infrastructure",
  base: process.env.GITHUB_PAGES ? "/formaccurate/" : "/",

  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    ["meta", { name: "theme-color", content: "#ffffff" }],
    ["meta", { property: "og:type", content: "website" }],
    [
      "meta",
      { property: "og:title", content: "FormAccurate — Native Form Protocol for AI Agents" },
    ],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Turn web forms into agent-readable schemas and programmable APIs without screenshots, vision models, or DOM guessing.",
      },
    ],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    [
      "meta",
      { name: "twitter:title", content: "FormAccurate — Native Form Protocol for AI Agents" },
    ],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "Turn web forms into agent-readable schemas and programmable APIs without screenshots, vision models, or DOM guessing.",
      },
    ],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  ],

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Protocol Specs", link: "/spec/schema" },
      { text: "Packages", link: "/packages/core" },
      { text: "Security", link: "/guide/security" },
      { text: "GitHub", link: "https://github.com/harvatechs/formaccurate" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "What is FormAccurate?", link: "/guide/getting-started" },
          { text: "Architecture Overview", link: "/guide/architecture" },
          { text: "Security & Consent Model", link: "/guide/security" },
        ],
      },
      {
        text: "Specifications",
        items: [
          { text: "Schema Specification (v1)", link: "/spec/schema" },
          { text: "Protocol Specification (REST/Bridge/MCP)", link: "/spec/protocol" },
        ],
      },
      {
        text: "Packages API Reference",
        items: [
          { text: "@formaccurate/core", link: "/packages/core" },
          { text: "@formaccurate/web", link: "/packages/web" },
          { text: "@formaccurate/server", link: "/packages/server" },
          { text: "@formaccurate/react", link: "/packages/react" },
          { text: "@formaccurate/mcp", link: "/packages/mcp" },
          { text: "@formaccurate/cli", link: "/packages/cli" },
        ],
      },
      {
        text: "Integrations & Examples",
        items: [
          { text: "Autonomous Agent Flow Demo", link: "/examples/demo-server" },
          { text: "React 18 Component Hook", link: "/examples/react" },
          { text: "MCP Client Setup (Claude / Cursor)", link: "/examples/mcp-setup" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/harvatechs/formaccurate" }],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Harsha Vardhan and FormAccurate Contributors",
    },
  },
});

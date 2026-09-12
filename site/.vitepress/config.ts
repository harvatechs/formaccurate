import { defineConfig } from "vitepress";

export default defineConfig({
  title: "FormAccurate",
  description: "Deterministic Agent Form Protocol & Open-Source Monorepo",
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

    socialLinks: [
      { icon: "github", link: "https://github.com/harvatechs/formaccurate" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 FormAccurate Contributors",
    },
  },
});

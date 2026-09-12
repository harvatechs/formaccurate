import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
  {
    files: ["packages/*/src/**/*.{ts,tsx}"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-exports": [
        "error",
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
    },
  },
  {
    files: ["packages/core/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "node:*",
                "fs",
                "path",
                "crypto",
                "http",
                "https",
                "os",
                "child_process",
                "stream",
                "buffer",
                "util",
                "events",
                "@formaccurate/web",
                "@formaccurate/server",
                "@formaccurate/react",
                "@formaccurate/mcp",
                "@formaccurate/cli",
              ],
              message:
                "@formaccurate/core must remain runtime-agnostic: zero node:* and zero internal dependencies.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/web/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@formaccurate/server",
                "@formaccurate/react",
                "@formaccurate/mcp",
                "@formaccurate/cli",
              ],
              message: "@formaccurate/web must not depend on server, react, mcp, or cli.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/server/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@formaccurate/web",
                "@formaccurate/react",
                "@formaccurate/mcp",
                "@formaccurate/cli",
              ],
              message: "@formaccurate/server must not depend on web, react, mcp, or cli.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/react/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@formaccurate/server", "@formaccurate/mcp", "@formaccurate/cli"],
              message: "@formaccurate/react must not depend on server, mcp, or cli.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/mcp/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@formaccurate/web", "@formaccurate/react"],
              message: "@formaccurate/mcp must not depend on web or react.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/cli/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@formaccurate/web", "@formaccurate/react"],
              message: "@formaccurate/cli must not depend on web or react.",
            },
          ],
        },
      ],
    },
  },
);

import { defineConfig } from "vite-plus";

// Generated output, build artifacts, and tool caches: never formatted, never linted.
const IGNORE_PATTERNS = ["**/*.gen.ts", "**/dist/**", "**/build/**", "**/coverage/**", ".tanstack/**", ".wrangler/**"];

export default defineConfig({
  root: ".",
  logLevel: "error",
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: IGNORE_PATTERNS,
    useTabs: false,
    tabWidth: 2,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    printWidth: 120,
    insertFinalNewline: true,
    sortImports: true,
    sortPackageJson: true,
  },
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "effecttsgo"],
    jsPlugins: [
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
      // This repository's own rules. See `tools/lint/plugin.ts` for why one had to be written.
      { name: "feelsie", specifier: "./tools/lint/plugin.ts" },
    ],
    ignorePatterns: IGNORE_PATTERNS,
    options: {
      typeAware: true,
      typeCheck: true,
      maxWarnings: 0,
    },
    categories: {
      correctness: "error",
    },
    rules: {
      "effecttsgo/floating-effect": "error",
      "vite-plus/prefer-vite-plus-imports": "error",
      "typescript/no-explicit-any": "error",
      "react/no-array-index-key": "error",
      "no-console": ["error", { allow: ["debug", "time", "timeEnd", "assert"] }],
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          fix: {
            imports: "safe-fix",
            variables: "fix",
          },
        },
      ],
      "typescript/consistent-type-imports": "error",
      "typescript/no-non-null-assertion": "error",
      "no-param-reassign": "error",
      "typescript/prefer-as-const": "error",
      "default-param-last": "error",
      "react/self-closing-comp": "error",
      "react/rules-of-hooks": "error",
      "typescript/no-unnecessary-template-expression": "error",
      "eslint/prefer-template": "error",
      "unicorn/prefer-number-properties": "error",
      "typescript/no-inferrable-types": "error",
      "eslint/no-else-return": "error",
      "eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../**/*"],
              message: "Use absolute imports (unless import is sibling)",
            },
          ],
        },
      ],
      "typescript/no-floating-promises": "error",
    },
    env: {
      builtin: true,
    },
    overrides: [
      // @attests root/token/cannot-be-guessed
      {
        files: ["packages/core/**"],
        rules: {
          "no-restricted-properties": [
            "error",
            {
              object: "Math",
              property: "random",
              message: "Use Web Crypto for token bytes.",
            },
          ],
        },
      },
      // @attests:end
      {
        files: ["apps/checkin/**"],
        rules: {
          // @attests root/checkin/email/sender-follows-the-configured-domain
          "feelsie/no-email-literals": "error",
          // @attests:end
          // @attests root/checkin/routes/expose-no-history
          "feelsie/no-d1-query": "error",
          "no-restricted-imports": [
            "error",
            {
              paths: [
                {
                  name: "@feelsie/core/database",
                  message:
                    "The check-in Worker takes named capabilities, never the SQL interface. A statement can return any number of entries.",
                },
                {
                  name: "@feelsie/core",
                  // The names A003 will add. Denying them before they exist is the point: this
                  // rule is what holds the type witness in place across that addition, and a
                  // rule written afterwards is a rule written after the regression.
                  importNames: ["EntryHistory", "EntryRead", "listEntries"],
                  message:
                    "A list operation belongs to the dashboard. This Worker serves no route returning anything but the entry a presented token authorises.",
                },
              ],
              // Carried forward from the base configuration: an override replaces the rule's
              // options rather than merging them, so omitting this would quietly re-permit
              // `../**` imports inside this package alone.
              patterns: [
                {
                  group: ["../**/*"],
                  message: "Use absolute imports (unless import is sibling)",
                },
              ],
            },
          ],
          // @attests:end
        },
      },
      {
        // The prohibition is about the Worker, and a test that asserts an address has to write
        // one. The positive-polarity witness in `schedule.test.ts` configures two mail domains
        // and reads back what the handler sent from; it cannot do that without literals, and it
        // is not code that ships in the Worker. `src/test-support.ts` is deliberately **not**
        // here: it lives in `src/`, where an exemption would be a hole in the rule rather than a
        // boundary around it, so it composes its address instead.
        files: ["apps/checkin/**/*.test.ts"],
        rules: {
          "feelsie/no-email-literals": "off",
        },
      },
    ],
  },
  run: {
    cache: true,
  },
  test: {
    passWithNoTests: false,
    // Vitest's 5s default is smaller than the waits real suites declare (an SSE reader asking
    // for 10s, a process probe allowing 20s), so the generic "Test timed out in 5000ms" wins
    // over the assertion that would have said what actually broke. A budget must exceed the
    // longest wait a test can perform; passing tests never spend it.
    testTimeout: 30_000,
    // Suites that stand up a real harness in `beforeAll` need the same margin.
    hookTimeout: 30_000,
    env: {
      ALCHEMY_DEV: "1",
      CI: "1",
      CLOUDFLARE_ACCOUNT_ID: "00000000000000000000000000000000",
      CLOUDFLARE_API_TOKEN: "placeholder-not-a-real-token",
    },
  },
});

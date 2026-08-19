// The repository's own Oxlint rules.
//
// **This file exists because Oxlint 1.77.0 ships no `no-restricted-syntax`.** A002 names a lint
// witness that denies an email-shaped string literal, and the built-in restriction rules all key
// on an identifier — `no-restricted-imports`, `no-restricted-properties`,
// `no-restricted-globals`. None of them can see a string. Oxlint's JS-plugin API can, so the
// witness stays at kind 3 rather than dropping to a test that greps the source.
//
// A006 already plans more of these ("one custom lint rule per claim that names one"), so this is
// the first tenant of a building that was going to be built anyway.
//
// The plugin is a plain object rather than `definePlugin`/`defineRule` from `@oxlint/plugins`:
// that package arrives transitively at 1.73.0 against an Oxlint at 1.77.0, and
// `docs/gotchas.md` is explicit that this toolchain's versions move as a set. Its helpers are
// identity functions, so declaring the shape locally costs a few lines and no version risk.

interface Literal {
  readonly type: "Literal";
  readonly value: unknown;
}

interface Identifier {
  readonly type: "Identifier";
  readonly name: string;
}

interface TemplateElement {
  readonly type: "TemplateElement";
  readonly value: { readonly cooked?: string | null; readonly raw: string };
}

interface RuleContext {
  report: (descriptor: { node: unknown; messageId: string }) => void;
}

/**
 * An address-shaped literal: something, an `@`, a host with a dot. Deliberately loose. The
 * failure it prevents is a real address pasted in while debugging and never taken out, and a
 * loose pattern catches that while a precise RFC-5322 matcher would mostly catch nothing.
 */
const addressShaped = /[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+/;

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Deny email addresses written as literals.",
      recommended: false,
    },
    messages: {
      emailLiteral:
        "Build the address from configuration instead. The mail domain is a secret, so an address written here is both wrong and unchangeable.",
    },
  },
  createOnce(context: RuleContext) {
    return {
      Literal(node: Literal) {
        if (typeof node.value === "string" && addressShaped.test(node.value)) {
          context.report({ node, messageId: "emailLiteral" });
        }
      },
      // A template literal is how the address is *supposed* to be built, so only its fixed
      // parts are checked: `prompt@${domain}` is the mechanism, `prompt@mail.example.com`
      // spelled as a template is the literal wearing a hat.
      TemplateElement(node: TemplateElement) {
        const text = node.value.cooked ?? node.value.raw;
        if (addressShaped.test(text)) {
          context.report({ node, messageId: "emailLiteral" });
        }
      },
    };
  },
};

const noD1QueryRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Deny direct database bindings in the public check-in Worker.",
      recommended: false,
    },
    messages: {
      directD1Query:
        "Use the token-authorized capabilities from @feelsie/core/d1. The public Worker must not receive arbitrary SQL.",
    },
  },
  createOnce(context: RuleContext) {
    return {
      Identifier(node: Identifier) {
        if (node.name === "QueryDatabase" || node.name === "QueryDatabaseLocal" || node.name === "WorkerEnvironment") {
          context.report({ node, messageId: "directD1Query" });
        }
      },
      Literal(node: Literal) {
        if (
          node.value === "QueryDatabase" ||
          node.value === "QueryDatabaseLocal" ||
          node.value === "WorkerEnvironment"
        ) {
          context.report({ node, messageId: "directD1Query" });
        }
      },
    };
  },
};

export default {
  meta: { name: "feelsie" },
  rules: { "no-d1-query": noD1QueryRule, "no-email-literals": rule },
};

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Sohba quality gates.
 *
 * The UI is Arabic and RTL-first (`<html lang="ar" dir="rtl">`), so every
 * spacing, alignment and corner utility MUST be a logical one:
 *   `ms-` / `me-` / `ps-` / `pe-` / `text-start` / `text-end` /
 *   `border-s` / `border-e` / `rounded-s` / `rounded-e` / `start-` / `end-`
 *
 * A physical utility (`ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`,
 * `left-`, `right-`, ...) mirrors the layout and silently breaks the Arabic
 * reading direction, so it is reported as an ERROR (never as a warning).
 */

/** Tailwind classes that encode a physical (left/right) direction. */
const PHYSICAL_UTILITY_PATTERNS = [
  /^-?m[lr]-/, // ml-*, mr-* (including the negative variants)
  /^-?p[lr]-/, // pl-*, pr-*
  /^text-(left|right)$/, // text-left, text-right
  /^(left|right)-/, // left-*, right-*
  /^border-[lr](-[0-9]+)?(-[a-z0-9-]+)?$/, // border-l, border-l-2, border-l-red-500
  /^divide-[lr](-[0-9]+)?$/, // divide-l-2
  /^rounded-[lr](-[a-z0-9]+)?$/, // rounded-l, rounded-l-lg
  /^rounded-[tb][lr](-[a-z0-9]+)?$/, // rounded-tl, rounded-tl-lg
  /^inset-[lr](-[0-9]+)?$/, // inset-l-0
  /^float-(left|right)$/,
  /^clear-(left|right)$/,
  /^origin-(top|bottom)-(left|right)$/,
  /^space-[xy]-reverse$/,
];

/** True when a single CSS class token encodes a physical direction. */
function isPhysicalUtility(token) {
  return PHYSICAL_UTILITY_PATTERNS.some((pattern) => pattern.test(token));
}

/**
 * Collects every string literal inside an expression (template chunks,
 * conditional branches, array items, ...) so a class name can never hide
 * inside a nested expression.
 */
function collectStringLiterals(node) {
  const found = [];
  const stack = [node];
  const visited = new Set();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current.type !== "string" || visited.has(current)) {
      continue;
    }
    visited.add(current);

    if (current.type === "Literal" && typeof current.value === "string") {
      found.push({ node: current, text: current.value });
    } else if (current.type === "TemplateElement") {
      found.push({ node: current, text: current.value.raw });
    }

    for (const key of Object.keys(current)) {
      if (key === "parent" || key === "loc" || key === "range") continue;
      const child = current[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item.type === "string") stack.push(item);
        }
      } else if (child && typeof child.type === "string") {
        stack.push(child);
      }
    }
  }

  return found;
}

/** Local plugin holding the Sohba specific rules. */
const sohbaPlugin = {
  rules: {
    "no-physical-css-utilities": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow physical (left/right) Tailwind utilities in the RTL-first Arabic UI.",
        },
        schema: [],
        messages: {
          physical:
            "الأداة الفيزيائية '{{token}}' ممنوعة لأن الواجهة عربية من اليمين لليسار. استخدم الأداة المنطقية بدلاً منها (ms-/me-/ps-/pe-/text-start/text-end/border-s/border-e/rounded-s).",
        },
      },
      create(context) {
        function reportTokens(text, node) {
          for (const token of text.split(/\s+/)) {
            if (token && isPhysicalUtility(token)) {
              context.report({ node, messageId: "physical", data: { token } });
            }
          }
        }

        return {
          // className="..." and className={...} on any JSX element.
          JSXAttribute(node) {
            if (!node.name || node.name.type !== "JSXIdentifier") return;
            if (node.name.name !== "className") return;
            if (!node.value) return;

            for (const literal of collectStringLiterals(node.value)) {
              reportTokens(literal.text, literal.node);
            }
          },

          // Shared class recipes such as `inputClassName` or `cardClassNames`.
          VariableDeclarator(node) {
            const name = node.id && node.id.type === "Identifier" ? node.id.name : "";
            if (!/classname/i.test(name)) return;
            if (!node.init || node.init.type !== "Literal") return;
            if (typeof node.init.value !== "string") return;

            reportTokens(node.init.value, node.init);
          },

          // Class recipes stored as object properties.
          Property(node) {
            const key = node.key;
            const keyName =
              key.type === "Identifier"
                ? key.name
                : key.type === "Literal" && typeof key.value === "string"
                  ? key.value
                  : "";
            if (!/classname/i.test(keyName)) return;
            if (!node.value || node.value.type !== "Literal") return;
            if (typeof node.value.value !== "string") return;

            reportTokens(node.value.value, node.value);
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    name: "sohba/quality-gates",
    plugins: {
      sohba: sohbaPlugin,
    },
    rules: {
      // --- RTL: physical utilities are an error, never a warning. ---
      "sohba/no-physical-css-utilities": "error",

      // --- Restore the strictness that eslint-config-next downgrades. ---
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-unused-expressions": "error",

      // --- Baseline correctness gates. ---
      eqeqeq: ["error", "always", { null: "ignore" }],
      curly: ["error", "multi-line"],
      "no-duplicate-case": "error",
      "no-self-compare": "error",

      // --- Security gates that protect privacy, RLS and the 18+ rule. ---
      "no-restricted-properties": [
        "error",
        {
          object: "process.env",
          property: "/SERVICE_ROLE|SECRET_KEY|PRIVATE_KEY/i",
          message:
            "مفتاح بخدمة 수준 (service role) أو مفتاح سري لا يجوز الوصول إليه من التطبيق. استخدم مفتاح publishable فقط، واعمل عمليات قاعدة البيانات الحساسة داخل Supabase Row Level Security.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            "لا تستخدم dangerouslySetInnerHTML مع محتوى المستخدمين. اعرض النص كـ children عادي.",
        },
        {
          selector: "CallExpression[callee.name='eval']",
          message: "استخدام eval محظور لأنه يفتح باب حقن الشيفرة.",
        },
        {
          selector: "NewExpression[callee.name='Function']",
          message:
            "استخدام new Function محظور لأنه يفتح باب حقن الشيفرة.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

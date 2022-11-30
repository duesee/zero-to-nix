import { IlesModule } from "iles";
import { Root } from "mdast";
import prism from "prismjs";
import type { Grammar } from "prismjs";
import loadLanguages from "prismjs/components/index.js";
import { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";

export interface CodeBlockConfig {
  aliases?: Record<string, string>;
}

const CodeBlocks = (config: CodeBlockConfig): IlesModule => {
  return {
    name: "code-blocks",
    markdown: {
      remarkPlugins: [[codeBlockPlugin, config]],
    },
  };
};

type Meta = {
  filename?: string;
};

const highlightCode = (
  code: string,
  grammar: Grammar,
  lang: string,
  meta: string
): string => {
  code = prism.highlight(code, grammar, lang);
  const cls = `language-${lang}`;
  const dataLang = lang === "text" ? "" : lang;
  const innerHtml = `<pre class="${cls}"><code>${code}</code></pre>`;

  let blockMeta: Meta = {};
  if (meta) {
    console.log(meta);
  }

  return `<div class="${cls}" data-lang="${dataLang}">${innerHtml}</div>`;
};

const getGrammar = (lang: string): Grammar | undefined => {
  if (!prism.languages[lang]) {
    try {
      loadLanguages([lang]);
    } catch (e) {
      console.warn(
        `[prismjs] Syntax highlight for language "${lang}" is not supported.`
      );
    }
  }
  return prism.languages[lang];
};

const codeBlockPlugin: Plugin<[CodeBlockConfig], Root> =
  function RemarkPrismPlugin(config: CodeBlockConfig) {
    return (ast) => {
      visit(ast, "code", (node, index, parent) => {
        const aliases = config.aliases ?? {};
        const code = node.value ?? "";
        const lang = node.lang ?? "text";
        const grammar = getGrammar(aliases[lang] || lang);
        const meta = node.meta ?? "";

        if (grammar) {
          const codeHtml = highlightCode(code, grammar, lang, meta);
          parent!.children[index!] = {
            type: "mdxFlowExpression",
            value: codeHtml,
            data: { raw: true, count: 1 },
          } as any;
        }

        return SKIP;
      });
    };
  };

export default CodeBlocks;

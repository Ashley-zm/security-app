import MarkdownIt, {
  type MarkdownIt as MarkdownItInstance,
  type RendererRule,
  type Token,
} from "markdown-it";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import xss, { escapeHtml, getDefaultWhiteList } from "xss";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("text", plaintext);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);

const markdown: MarkdownItInstance = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: false,
  highlight(code, language): string {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, {
        language,
        ignoreIllegals: true,
      }).value;
    }
    return escapeHtml(code);
  },
});

const defaultLinkOpen = markdown.renderer.rules.link_open;
const renderLinkOpen: RendererRule = (tokens, index, options, env, self) => {
  tokens[index].attrSet("target", "_blank");
  tokens[index].attrSet("rel", "noopener noreferrer");
  tokens[index].attrJoin("class", "md-link");
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, index, options, env, self)
    : self.renderToken(tokens, index, options);
};
markdown.renderer.rules.table_open = () =>
  '<div class="md-table-scroll"><table class="md-table">';
markdown.renderer.rules.link_open = renderLinkOpen;
markdown.renderer.rules.table_close = () => "</table></div>";

const whiteList = getDefaultWhiteList();
whiteList.a = ["href", "title", "target", "rel", "class"];
whiteList.code = ["class"];
whiteList.div = ["class"];
whiteList.img = ["src", "alt", "title", "width", "height"];
whiteList.pre = ["class"];
whiteList.span = ["class"];
whiteList.table = ["class"];
whiteList.td = ["colspan", "rowspan"];
whiteList.th = ["colspan", "rowspan"];

export function renderAssistantMarkdown(content: string) {
  if (!content) return "";
  return xss(markdown.render(content), {
    whiteList,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
  });
}

export interface AssistantMarkdownTable {
  id: string;
  rows: string[][];
}

export interface AssistantMarkdownImage {
  id: string;
  url: string;
  alt: string;
}

export function extractAssistantMarkdownAssets(content: string) {
  const tables: AssistantMarkdownTable[] = [];
  const images: AssistantMarkdownImage[] = [];
  if (!content) return { tables, images };

  const tokens = markdown.parse(content, {});
  let tableRows: string[][] | undefined;
  let row: string[] | undefined;

  const collectImages = (token: Token) => {
    for (const child of token.children || []) {
      if (child.type !== "image") continue;
      const url = String(child.attrGet("src") || "");
      if (!url || images.some((item) => item.url === url)) continue;
      images.push({
        id: `image-${images.length + 1}`,
        url,
        alt: child.content || `图片 ${images.length + 1}`,
      });
    }
  };

  for (const token of tokens) {
    if (token.type === "table_open") {
      tableRows = [];
    } else if (token.type === "tr_open" && tableRows) {
      row = [];
    } else if (token.type === "inline") {
      collectImages(token);
      if (row) {
        row.push(
          markdown.renderer.renderInlineAsText(
            token.children || [],
            markdown.options,
            {},
          ),
        );
      }
    } else if (token.type === "tr_close" && tableRows && row) {
      tableRows.push(row);
      row = undefined;
    } else if (token.type === "table_close" && tableRows) {
      tables.push({ id: `table-${tables.length + 1}`, rows: tableRows });
      tableRows = undefined;
    }
  }

  return { tables, images };
}

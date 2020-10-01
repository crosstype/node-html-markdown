import { HtmlToMarkdownOptions } from './options';
import { FileCollection, NodeHtmlMarkdown } from './main';
import { HtmlNode, isElementNode, isTextNode, VisitedNode } from './nodes';
import { parseHTML, surround, truthyStr } from './utilities';


/* ****************************************************************************************************************** */
// region: Types
/* ****************************************************************************************************************** */

export type TranslatorConfigFactory = {
  (ctx: TranslatorContext): TranslatorConfig
  base?: TranslatorConfig
}

export type TranslatorCollection = { [tags: string]: TranslatorConfig | TranslatorConfigFactory }

export type TranslatorContext = {
  node: VisitedNode
  options: HtmlToMarkdownOptions
  parent?: VisitedNode
}

type NodeVisitor = (node: HtmlNode, textOnly?: boolean) => string

export type TranslatorConfig = {
  /**
   * Preceeds caption, follows surroundingNewLines
   */
  prefix?: string,
  /**
   * Follows caption preceeds surroundingNewLines
   */
  postfix?: string,
  /**
   * Override output caption
   */
  caption?: string | ((ctx: TranslatorContext & { caption: string }) => string),
  /**
   * If false, no child elements will be scanned
   * @default true
   */
  recurse?: boolean,
  /**
   * Adds newline before and after (true, false, or number of newlines to add per side)
   * @default false
   */
  surroundingNewlines?: boolean | number
  /**
   * Ignore node entirely
   */
  ignore?: boolean
}

interface VisitorContext {
  visitNode: NodeVisitor
  fileName?: string
  instance: NodeHtmlMarkdown
  options: HtmlToMarkdownOptions
}

// endregion


/* ****************************************************************************************************************** */
// region: Visitor
/* ****************************************************************************************************************** */

function createVisitor(instance: NodeHtmlMarkdown, fileName?: string) {
  const createTranslatorContext = (node: VisitedNode) => Object.freeze({
    node,
    options: instance.options,
    parent: <VisitedNode>node.parentNode
  });

  /* Create Visitor Context */
  const context = <VisitorContext>{
    fileName,
    instance,
    get options() { return this.instance.options },
  };

  context.visitNode = (function (this: VisitorContext, node: HtmlNode, textOnly?: boolean): string {
    const { visitNode } = this;

    if (isTextNode(node)) return node.text;
    if (textOnly) return '';

    if (isElementNode(node)) {
      const { instance: { translators } } = this;
      const cfgOrFactory = translators.get(node.tagName);
      if (cfgOrFactory) {
        /* Get Translator Config */
        let cfg: TranslatorConfig;
        let ctx: TranslatorContext | undefined;
        if (typeof cfgOrFactory === 'function') {
          const base = cfgOrFactory.base;
          ctx = createTranslatorContext(node);
          cfg = { ...base, ...cfgOrFactory(ctx) };
        } else cfg = cfgOrFactory;

        /* Get markdown text */
        if (cfg.ignore) return '';

        let res = '';
        if (typeof cfg.caption === 'string') {
          res = cfg.caption;
        } else {
          // Get markdown from child nodes
          node.childNodes.forEach((n:HtmlNode) => { res += visitNode(n, !cfg.recurse) });

          /* Apply translator post-processing */
          if (typeof cfg.caption === 'function')
            res = cfg.caption({
              ...(ctx || createTranslatorContext(node)),
              caption: res
            });
        }

        /* Render final markdown for node */
        const { prefix, postfix, surroundingNewlines } = cfg;
        return surround(truthyStr(prefix) + res + truthyStr(postfix), '\n'.repeat(+(surroundingNewlines || 0)));
      }
    }

    return '';
  }).bind(context);

  return context.visitNode;
}

// endregion


/* ****************************************************************************************************************** */
// region: Utilities
/* ****************************************************************************************************************** */

export function translateHtml(this: NodeHtmlMarkdown, htmlOrFiles: string | FileCollection): string | FileCollection {
  const inputIsCollection = typeof htmlOrFiles === 'string';
  const inputFiles: FileCollection = !inputIsCollection ? { 'default': <string>htmlOrFiles } : <FileCollection>htmlOrFiles;
  const outputFiles: FileCollection = {};

  for (const [ fileName, html ] of Object.entries(inputFiles)) {
    const visitor = createVisitor(this, fileName !== 'default' ? fileName : void 0);
    const parsedHtml = parseHTML(html, this.options);
    outputFiles[fileName] = visitor(parsedHtml);
  }

  return inputIsCollection ? outputFiles : outputFiles['default'];
}

// endregion

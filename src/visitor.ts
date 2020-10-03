import { NodeHtmlMarkdown } from './main';
import { ElementNode, HtmlNode, isElementNode, isTextNode } from './nodes';
import { getWhitespaceStats } from './utilities';
import {
  createTranslatorContext, isTranslatorConfig, PostProcess, TranslatorConfig, TranslatorConfigFactory, TranslatorContext
} from './translator';


/* ****************************************************************************************************************** */
// region: Types
/* ****************************************************************************************************************** */

export type NodeMetadata = { indentLevel?: number, listKind?: 'OL' | 'UL', listItemNumber?: number, noEscape?: boolean }
export type NodeMetadataMap = Map<ElementNode, NodeMetadata>

type VisitorResult = {
  text: string
  trailingNewlineStats: {
    length: number
    newLines: number
  }
}

// endregion


/* ****************************************************************************************************************** */
// region: Visitor
/* ****************************************************************************************************************** */

export class Visitor {
  public result: VisitorResult
  public nodeMetadata: NodeMetadataMap = new Map();

  constructor(
    public instance: NodeHtmlMarkdown,
    private rootNode: HtmlNode,
    public fileName?: string,
  )
  {
    this.result = {
      text: '',
      trailingNewlineStats: {
        length: 0,
        newLines: 0
      }
    };
    this.visitNode(rootNode);
  }

  /* ********************************************************* */
  // region: Accessors
  /* ********************************************************* */

  get options() { return this.instance.options }

  // endregion

  /* ********************************************************* */
  // region: Methods
  /* ********************************************************* */

  appendResult(s: string, startPos?: number) {
    if (!s && startPos === undefined) return;
    const { result } = this;

    if (startPos !== undefined) result.text = result.text.substr(0, startPos);
    result.text += s;

    result.trailingNewlineStats = getWhitespaceStats(result.text, 'end');
  }

  appendNewlines(count: number) {
    const { newLines } = this.result.trailingNewlineStats;
    this.appendResult('\n'.repeat(Math.max(0, (+count - newLines))));
  }

  // endregion

  /* ********************************************************* */
  // region: Internal Methods
  /* ********************************************************* */

  private visitNode(node: HtmlNode, textOnly?: boolean, metadata?: NodeMetadata): void {
    const { result, instance: { escaper } } = this;

    /* Handle text node */
    if (isTextNode(node) && !node.isWhitespace)
      return this.appendResult(metadata?.noEscape ? node.text : escaper.escape(node.text));

    if (textOnly) return;

    /* Handle element node */
    if (isElementNode(node)) {
      const { instance: { translators } } = this;
      const translatorCfgOrFactory = translators[node.tagName] as TranslatorConfig | TranslatorConfigFactory;

      /* Update metadata with list detail */
      switch (node.tagName) {
        case 'UL':
        case 'OL':
          metadata = {
            ...metadata,
            listItemNumber: 0,
            listKind: (<any>node.tagName),
            indentLevel: (metadata?.indentLevel ?? -1) + 1
          };
          break;
        case 'LI':
          if (metadata?.listKind === 'OL') metadata.listItemNumber = (metadata.listItemNumber || 0) + 1;
      }
      if (metadata) this.nodeMetadata.set(node, metadata);

      // If no translator for element, visit children
      if (!translatorCfgOrFactory) return node.childNodes.forEach((n: HtmlNode) => this.visitNode(n));

      /* Get Translator Config */
      let cfg: TranslatorConfig;
      let ctx: TranslatorContext | undefined;
      if (!isTranslatorConfig(translatorCfgOrFactory)) {
        ctx = createTranslatorContext(this, node, metadata);
        cfg = { ...translatorCfgOrFactory.base, ...translatorCfgOrFactory(ctx) };
      } else cfg = translatorCfgOrFactory;

      // Skip and don't check children if ignore flag set
      if (cfg.ignore) return;

      /* Update metadata for noEscape flag */
      if (cfg.noEscape && !metadata?.noEscape) {
        metadata = { ...metadata, noEscape: true };
        this.nodeMetadata.set(node, metadata);
      }

      const startPosOuter = result.text.length;

      /* Write opening */
      if (cfg.surroundingNewlines) this.appendNewlines(+cfg.surroundingNewlines);
      if (cfg.prefix) this.appendResult(cfg.prefix);

      /* Write inner content */
      if (typeof cfg.content === 'string') this.appendResult(cfg.content);
      else {
        const startPos = result.text.length;

        // Process child nodes
        node.childNodes.forEach((n: HtmlNode) => this.visitNode(n, (cfg.recurse === false), metadata));

        /* Apply translator post-processing */
        if (cfg.postprocess) {
          const postRes = cfg.postprocess({
            ...(ctx || createTranslatorContext(this, node, metadata)),
            content: result.text.substr(startPos)
          });

          // If remove flag sent, remove / omit everything for this node (prefix, newlines, content, postfix)
          if (postRes === PostProcess.RemoveNode) return this.appendResult('', startPosOuter);

          if (typeof postRes === 'string') this.appendResult(postRes, startPos);
        }
      }

      /* Write closing */
      if (cfg.postfix) this.appendResult(cfg.postfix);
      if (cfg.surroundingNewlines) this.appendNewlines(+cfg.surroundingNewlines);
    }
  }

  // endregion
}

// endregion


/* ****************************************************************************************************************** */
// region: Utilities
/* ****************************************************************************************************************** */

export function getMarkdownForHtmlNodes(instance: NodeHtmlMarkdown, rootNode: HtmlNode, fileName?: string): string {
  let result = new Visitor(instance, rootNode, fileName).result.text;

  const { maxConsecutiveNewlines } = instance.options;
  if (maxConsecutiveNewlines) result = result.replace(
    new RegExp(String.raw`(\r?\n\s*){${maxConsecutiveNewlines}}(\r?\n\s*)`, 'g'),
    '$1'
  );

  return result.trim();
}

// endregion

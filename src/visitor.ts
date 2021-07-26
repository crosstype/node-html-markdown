import { NodeHtmlMarkdown } from './main';
import { ElementNode, HtmlNode, isElementNode, isTextNode } from './nodes';
import { getChildNodes, getTrailingWhitespaceInfo, perfStart, perfStop, trimNewLines } from './utilities';
import {
  createTranslatorContext, isTranslatorConfig, PostProcessResult, TranslatorConfig, TranslatorConfigFactory,
  TranslatorConfigObject, TranslatorContext
} from './translator';
import { NodeHtmlMarkdownOptions } from './options';
import { contentlessElements } from './config';


/* ****************************************************************************************************************** */
// region: Types
/* ****************************************************************************************************************** */

export interface NodeMetadata {
  indentLevel?: number
  listKind?: 'OL' | 'UL'
  listItemNumber?: number
  noEscape?: boolean
  preserveWhitespace?: boolean
  translators?: TranslatorConfigObject
}

export type NodeMetadataMap = Map<ElementNode, NodeMetadata>

type VisitorResult = {
  text: string
  trailingNewlineStats: {
    whitespace: number
    newLines: number
  }
}

// endregion


/* ****************************************************************************************************************** */
// region: Visitor
/* ****************************************************************************************************************** */

/**
 * Properties & methods marked public are designated as such due to the fact that we may add middleware / transformer
 * support in the future
 */
export class Visitor {
  public result: VisitorResult
  public nodeMetadata: NodeMetadataMap = new Map();
  public urlDefinitions: string[] = [];
  private options: NodeHtmlMarkdownOptions;

  constructor(
    public instance: NodeHtmlMarkdown,
    public rootNode: HtmlNode,
    public fileName?: string,
  )
  {
    this.result = {
      text: '',
      trailingNewlineStats: {
        whitespace: 0,
        newLines: 0
      }
    };
    this.options = instance.options;

    this.optimizeTree(rootNode);
    this.visitNode(rootNode);
  }

  /* ********************************************************* */
  // region: Methods
  /* ********************************************************* */

  public addOrGetUrlDefinition(url: string): number {
    let id = this.urlDefinitions.findIndex(u => u === url);
    if (id < 0) id = this.urlDefinitions.push(url) - 1;
    return id + 1;
  }

  public appendResult(s: string, startPos?: number, spaceIfRepeatingChar?: boolean) {
    if (!s && startPos === undefined) return;
    const { result } = this;

    if (startPos !== undefined) result.text = result.text.substr(0, startPos);
    result.text += (spaceIfRepeatingChar && result.text.slice(-1) === s[0] ? ' ' : '') + s;

    result.trailingNewlineStats = getTrailingWhitespaceInfo(result.text);
  }

  public appendNewlines(count: number) {
    const { newLines } = this.result.trailingNewlineStats;
    this.appendResult('\n'.repeat(Math.max(0, (+count - newLines))));
  }

  // endregion

  /* ********************************************************* */
  // region: Internal Methods
  /* ********************************************************* */

  /**
   * Optimize tree, flagging nodes that have usable content
   */
  private optimizeTree(node: HtmlNode) {
    perfStart('Optimize tree');
    const { translators } = this.instance;
    (function visit(node: HtmlNode): boolean {
      let res = false
      if (isTextNode(node) || (isElementNode(node) && contentlessElements.includes(node.tagName))) {
        res = true;
      }
      else {
        const childNodes = getChildNodes(node);
        if (!childNodes.length) {
          const translator = translators[(node as ElementNode).tagName];
          if (translator?.preserveIfEmpty || typeof translator === 'function') res = true;
        }
        else
          for (const child of childNodes) {
            if (!res) res = visit(child);
            else visit(child);
          }
      }
      return node.preserve = res;
    })(node);
    perfStop('Optimize tree');
  }

  /**
   * Apply escaping and custom replacement rules
   */
  private processText(text: string, metadata: NodeMetadata | undefined) {
    let res = text;
    if (!metadata?.preserveWhitespace) res = res.replace(/\s+/g, ' ');
    if (metadata?.noEscape) return res;

    const { lineStartEscape, globalEscape, textReplace } = this.options;
    res = res
      .replace(globalEscape[0], globalEscape[1])
      .replace(lineStartEscape[0], lineStartEscape[1])

    /* If specified, apply custom replacement patterns */
    if (textReplace)
      for (const [ pattern, r ] of textReplace) res = res.replace(pattern, r);

    return res;
  }

  public visitNode(node: HtmlNode, textOnly?: boolean, metadata?: NodeMetadata): void {
    const { result } = this;

    if (!node.preserve) return;

    /* Handle text node */
    if (isTextNode(node))
      return node.isWhitespace && !metadata?.preserveWhitespace
             ? (!result.text.length || result.trailingNewlineStats.whitespace > 0) ? void 0 : this.appendResult(' ')
             : this.appendResult(this.processText(node.trimmedText, metadata));

    if (textOnly || !isElementNode(node)) return;

    /* Handle element node */
    const translators = metadata?.translators ?? this.instance.translators;
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
        if (metadata?.listKind === 'OL') metadata.listItemNumber = (metadata.listItemNumber ?? 0) + 1;
        break;
      case 'PRE':
        metadata = {
          ...metadata,
          preserveWhitespace: true
        }
    }
    if (metadata) this.nodeMetadata.set(node, metadata);

    // If no translator for element, visit children
    if (!translatorCfgOrFactory) {
      for (const child of getChildNodes(node)) this.visitNode(child, textOnly, metadata);
      return;
    }

    /* Get Translator Config */
    let cfg: TranslatorConfig;
    let ctx: TranslatorContext | undefined;
    if (!isTranslatorConfig(translatorCfgOrFactory)) {
      ctx = createTranslatorContext(this, node, metadata, translatorCfgOrFactory.base);
      cfg = { ...translatorCfgOrFactory.base, ...translatorCfgOrFactory(ctx) };
    } else cfg = translatorCfgOrFactory;

    // Skip and don't check children if ignore flag set
    if (cfg.ignore) return;

    /* Update metadata if needed */
    if ((cfg.noEscape && !metadata?.noEscape) || (cfg.childTranslators && !metadata?.translators)) {
      metadata = { ...metadata, noEscape: cfg.noEscape, translators: cfg.childTranslators };
      this.nodeMetadata.set(node, metadata);
    }

    const startPosOuter = result.text.length;

    /* Write opening */
    if (cfg.surroundingNewlines) this.appendNewlines(+cfg.surroundingNewlines);
    if (cfg.prefix) this.appendResult(cfg.prefix);

    /* Write inner content */
    if (typeof cfg.content === 'string') this.appendResult(cfg.content, void 0, cfg.spaceIfRepeatingChar);
    else {
      const startPos = result.text.length;

      // Process child nodes
      for (const child of getChildNodes(node)) this.visitNode(child, (cfg.recurse === false), metadata);

      /* Apply translator post-processing */
      if (cfg.postprocess) {
        const postRes = cfg.postprocess({
          ...(ctx || createTranslatorContext(this, node, metadata)),
          content: result.text.substr(startPos)
        });

        // If remove flag sent, remove / omit everything for this node (prefix, newlines, content, postfix)
        if (postRes === PostProcessResult.RemoveNode) {
          if (node.tagName === 'LI' && metadata?.listItemNumber) --metadata.listItemNumber;
          return this.appendResult('', startPosOuter);
        }

        if (typeof postRes === 'string') this.appendResult(postRes, startPos, cfg.spaceIfRepeatingChar);
      }
    }

    /* Write closing */
    if (cfg.postfix) this.appendResult(cfg.postfix);
    if (cfg.surroundingNewlines) this.appendNewlines(+cfg.surroundingNewlines);
  }

  // endregion
}

// endregion


/* ****************************************************************************************************************** */
// region: Utilities
/* ****************************************************************************************************************** */

export function getMarkdownForHtmlNodes(instance: NodeHtmlMarkdown, rootNode: HtmlNode, fileName?: string): string {
  perfStart('walk');
  const visitor = new Visitor(instance, rootNode, fileName);
  let result = visitor.result.text;
  perfStop('walk');

  /* Post-processing */
  // Add link references, if set
  if (instance.options.useLinkReferenceDefinitions) {
    if (/[^\r\n]/.test(result.slice(-1))) result += '\n';
    visitor.urlDefinitions.forEach((url, idx) => {
      result += `\n[${idx + 1}]: ${url}`;
    });
  }

  // Fixup repeating newlines
  const { maxConsecutiveNewlines } = instance.options;
  if (maxConsecutiveNewlines) result = result.replace(
    new RegExp(String.raw`(?:\r?\n\s*)+((?:\r?\n\s*){${maxConsecutiveNewlines}})`, 'g'),
    '$1'
  );

  return trimNewLines(result);
}

// endregion

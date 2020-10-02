import { HtmlToMarkdownOptions } from './options';
import { FileCollection, NodeHtmlMarkdown } from './main';
import { parseHTML } from './utilities';
import { getMarkdownForHtmlNodes, NodeMetadata, NodeMetadataMap, Visitor } from './visitor';
import { ElementNode } from './nodes';


/* ****************************************************************************************************************** */
// region: Types
/* ****************************************************************************************************************** */

export type TranslatorConfigFactory = {
  (ctx: TranslatorContext): TranslatorConfig
  base?: TranslatorConfig
}

export type TranslatorCollection = { [tags: string]: TranslatorConfig | TranslatorConfigFactory }

export type TranslatorContext = Partial<NodeMetadata> & {
  node: ElementNode
  options: HtmlToMarkdownOptions
  parent?: ElementNode
  nodeMetadata: NodeMetadataMap
}

export type TranslatorConfig = {
  /**
   * Preceeds content, follows surroundingNewLines
   */
  prefix?: string,
  /**
   * Follows content, preceeds surroundingNewLines
   */
  postfix?: string,
  /**
   * Set fixed output content
   */
  content?: string,
  /**
   * Post-process content after inner nodes have been rendered.
   * Returning undefined will cause the content to not be updated
   */
  postprocess?: (ctx: TranslatorContext & { content: string }) => string | PostProcess
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

export enum PostProcess {
  NoChange,
  RemoveNode
}

// endregion


/* ****************************************************************************************************************** */
// region: Utilities
/* ****************************************************************************************************************** */

export function createTranslatorContext(visitor: Visitor, node: ElementNode, metadata?: NodeMetadata): TranslatorContext
{
  const { instance, nodeMetadata, } = visitor;
  return Object.freeze({
    node,
    options: instance.options,
    parent: <ElementNode>node.parentNode,
    nodeMetadata,
    ...metadata
  });
}

export function translateHtml(this: NodeHtmlMarkdown, htmlOrFiles: string | FileCollection): string | FileCollection {
  const inputIsCollection = typeof htmlOrFiles !== 'string';
  const inputFiles: FileCollection = !inputIsCollection ? { 'default': <string>htmlOrFiles } : <FileCollection>htmlOrFiles;
  const outputFiles: FileCollection = {};

  for (const [ fileName, html ] of Object.entries(inputFiles)) {
    const parsedHtml = parseHTML(html, this.options);
    outputFiles[fileName] = getMarkdownForHtmlNodes(this, parsedHtml, fileName !== 'default' ? fileName : void 0);
  }

  return inputIsCollection ? outputFiles : outputFiles['default'];
}

// endregion

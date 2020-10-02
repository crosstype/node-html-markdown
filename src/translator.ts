import { NodeHtmlMarkdownOptions } from './options';
import { hasKeys } from './utilities';
import { NodeMetadata, NodeMetadataMap, Visitor } from './visitor';
import { ElementNode } from './nodes';


/* ****************************************************************************************************************** */
// region: Types
/* ****************************************************************************************************************** */

export type TranslatorConfigFactory = {
  (ctx: TranslatorContext): TranslatorConfig
  base?: TranslatorConfig
}

export type TranslatorConfigObject = { [tags: string]: TranslatorConfig | TranslatorConfigFactory }

export type TranslatorContext = Partial<NodeMetadata> & {
  node: ElementNode
  options: NodeHtmlMarkdownOptions
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
// region: TranslatorCollection
/* ****************************************************************************************************************** */

export class TranslatorCollection {
  /**
   * @internal
   */
  [tagName: string]: any

  get size() { return Object.keys(this).length }

  /**
   * Add / update translator config for one or more element tags
   */
  set(keys: string, config: TranslatorConfig | TranslatorConfigFactory, /* @internal */ preserveBase?: boolean) {
    keys.split(',').forEach(el => {
      el = el.toUpperCase();

      if (preserveBase) {
        const base = this[el];
        if (isTranslatorConfig(base))
          config = !isTranslatorConfig(config)
                   ? Object.assign((...args: any[]) => (<Function>config).apply(void 0, args), { base })
                   : { ...base, ...config };
      }

      this[el] = config;
    });
  }

  /**
   * Get translator config for element tag
   */
  get(key: string): TranslatorConfig | TranslatorConfigFactory {
    return this[key.toUpperCase()] as any;
  }

  /**
   * Returns array of entries
   */
  entries(): [ elementName: string, config: TranslatorConfig | TranslatorConfigFactory ][] {
    return Object.entries(this);
  }

  /**
   * Remove translator config for one or more element tags
   */
  remove(keys: string): void {
    keys.split(',').forEach(el => delete this[el.toUpperCase()]);
  }
}

// endregion


/* ****************************************************************************************************************** */
// region: Utilities
/* ****************************************************************************************************************** */

export const isTranslatorConfig = (v: any): v is TranslatorConfig =>
  typeof v === 'object' &&
  hasKeys(v, [ 'prefix', 'postfix', 'content', 'postprocess', 'recurse', 'surroundingNewlines', 'ignore' ], true);

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

// endregion

import { NodeHtmlMarkdownOptions } from './options';
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
  postprocess?: (ctx: TranslatorContext & { content: string }) => string | PostProcessResult
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
  /**
   * Do not escape content
   */
  noEscape?: boolean
}

export enum PostProcessResult {
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

      let res = config;
      if (preserveBase) {
        const base = this[el];
        if (isTranslatorConfig(base))
          res = !isTranslatorConfig(config)
                ? Object.assign((...args: any[]) => (<Function>config).apply(void 0, args), { base })
                : { ...base, ...config };
      }

      this[el] = res;
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

/**
 * Only use to narrow union of types where only TranslatorConfig has JS type 'object'
 */
export const isTranslatorConfig = (v: any): v is TranslatorConfig => typeof v === 'object';

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

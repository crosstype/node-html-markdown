import { defaultBlockElements, defaultIgnoreElements } from './config';


/* ****************************************************************************************************************** */
// region: Type / Defaults
/* ****************************************************************************************************************** */

export type HtmlToMarkdownOptions = typeof HtmlToMarkdownOptions;

export const HtmlToMarkdownOptions = Object.freeze({
  /**
   * Use native window DOMParser when available
   * @default false
   */
  preferNativeParser: false,

  /**
   * Code block fence
   * @default ```
   */
  codeFence: '```',

  /**
   * Bullet marker
   */
  bulletMarker: '*',

  /**
   * Indent string
   */
  indent: '  ',

  /**
   * Style for code block
   * @default fence
   */
  codeBlockStyle: <'indented' | 'fenced'>'fenced',

  /**
   * Emphasis delimiter
   * @default _
   */
  emDelimiter: '_',

  /**
   * Strong delimiter
   */
  strongDelimiter: '**',

  /**
   * Ignore elements (tag) - Ignore inner text does not parse children
   */
  ignore: <string[]><any>void 0,

  /**
   * Add elements to block elements list (surrounds with newlines)
   */
  blockElements: <string[]><any>void 0
});

// endregion


/* ****************************************************************************************************************** */
// region: Utilities
/* ****************************************************************************************************************** */

export function createOptions(options: Partial<HtmlToMarkdownOptions> = {}): HtmlToMarkdownOptions {
  const { ignore, blockElements } = options;

  return {
    ...HtmlToMarkdownOptions,
    ...options,
    ignore: ignore ? defaultIgnoreElements.concat(ignore.map(e => e.toUpperCase())) : defaultIgnoreElements,
    blockElements: blockElements
                   ? defaultBlockElements.concat(blockElements.map(e => e.toUpperCase()))
                   : defaultBlockElements
  }
}

// endregion

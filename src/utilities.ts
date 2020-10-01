import { HtmlToMarkdownOptions } from './options';
import { parse } from 'node-html-parser';
import { ElementNode } from './nodes';


/* ****************************************************************************************************************** */
// region: Utility Types
/* ****************************************************************************************************************** */

/**
 * Make certain properties required
 */
export declare type RequireSome<T, K extends keyof T> = T & Pick<Required<T>, K>;

// endregion


/* ****************************************************************************************************************** */
// region: String Utils
/* ****************************************************************************************************************** */

export const trimNewLines = (s: string) => s.replace(/^\n+|\n+$/g, '');
export const surround = (source: string, surroundStr: string) => `${surroundStr}${source}${surroundStr}`;
export const isWhiteSpaceOnly = (s: string) => !/\S/.test(s);
/**
 * If value is truthy, returns `value` (or `v` if no `value` provided), otherwise, returns an empty string
 * @param v - Var to check for truthiness
 * @param value - Value to return if true
 */
export const truthyStr = (v: any, value?: string): string => v ? ((value !== undefined) ? value : String(v)) : '';
export const getWhitespaceStats = (s: string, pos: 'start' | 'end'): { length: number, newLines: number } => {
  const regexp = new RegExp(String.raw`${truthyStr(pos === 'start','^')}(\r?\n\s*)+${truthyStr(pos === 'end', '$')}`);
  const whitespace = s.match(regexp);
  if (!whitespace) return { length: 0, newLines: 0 };
  return { length: whitespace[0].length, newLines: whitespace[0].match(/\r?\n/g)![0].length }
}

// endregion


/* ****************************************************************************************************************** */
// region: Parser
/* ****************************************************************************************************************** */

/**
 * Determine if environment provides a working, native DOM Parser
 */
const hasNativeDomParser = (): boolean => {
  try {
    return !!(window?.DOMParser && (new window.DOMParser()).parseFromString('', 'text/html'));
  } catch {
    return false;
  }
}

/**
 * Parser string to HTMLElement
 */
export function parseHTML(html: string, options: HtmlToMarkdownOptions): ElementNode {
  let doc: HTMLDocument;

  /* Parse with native engine, if specified and possible */
  if (options.preferNativeParser && hasNativeDomParser()) {
    try {
      doc = document.implementation.createHTMLDocument('').open()
    } catch (e) {
      const { ActiveXObject } = (<any>window);
      if (ActiveXObject) {
        doc = ActiveXObject('htmlfile');
        doc.designMode = 'on';        // disable on-page scripts
        doc.open();
      }
      else throw e;
    }

    doc.write(html);
    doc.close();

    return doc.documentElement;
  }

  // Parse with node-html-parser (do not change config - set for optimal performance)
  return parse(html, { lowerCaseTagName: false, script: false, style: false, pre: true, comment: false });
}

// endregion

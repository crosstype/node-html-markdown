import { NodeHtmlMarkdownOptions } from './options';
import { ElementNode, HtmlNode } from './nodes';
import { nodeHtmlParserConfig } from './config';


/* ****************************************************************************************************************** */
// region: String Utils
/* ****************************************************************************************************************** */

export const trimNewLines = (s: string) => s.replace(/^\n+|\n+$/g, '');
export const surround = (source: string, surroundStr: string) => `${surroundStr}${source}${surroundStr}`;
export const isWhiteSpaceOnly = (s: string) => !/\S/.test(s);

export const getTrailingWhitespaceInfo = (s: string): { whitespace: number, newLines: number } => {
  const res = { whitespace: 0, newLines: 0 };
  const minI = Math.max(s.length - 10, 0);
  for (let i = s.length-1; i >= minI; i--) {
    const token = s.slice(i, i+1);
    if (!/\s/.test(token)) break;
    res.whitespace++;
    if ([ '\r', '\n' ].includes(token)) ++res.newLines;
  }
  return res;
}

/**
 * If value is truthy, returns `value` (or `v` if no `value` provided), otherwise, returns an empty string
 * @param v - Var to check for truthiness
 * @param value - Value to return if true
 */
export const truthyStr = (v: any, value?: string): string => v ? ((value !== undefined) ? value : String(v)) : '';

// endregion


/* ****************************************************************************************************************** */
// region: Parser
/* ****************************************************************************************************************** */

function tryParseWithNativeDom(html: string): ElementNode | undefined {
  try {
    if (!(window?.DOMParser && (new window.DOMParser()).parseFromString('', 'text/html'))) return void 0;
  } catch {
    return void 0;
  }

  /* Get a document */
  let doc: Document;
  try {
    doc = document.implementation.createHTMLDocument('').open()
  } catch (e) {
    const { ActiveXObject } = (<any>window);
    if (ActiveXObject) {
      const doc = ActiveXObject('htmlfile');
      doc.designMode = 'on';        // disable on-page scripts
      return doc.open();
    }
    throw e;
  }

  // Prepare document, ensuring we have a wrapper node
  doc.write('<node-html-markdown>' + html + '</node-html-markdown>');
  doc.close();

  return doc.documentElement;
}

const getNodeHtmlParser = () => {
  try {
    return require('node-html-parser').parse as typeof import('node-html-parser').parse
  } catch {
    return undefined;
  }
}

/**
 * Parser string to HTMLElement
 */
export function parseHTML(html: string, options: NodeHtmlMarkdownOptions): ElementNode {
  let nodeHtmlParse: ReturnType<typeof getNodeHtmlParser>;

  /* If specified, try to parse with native engine, fallback to node-html-parser */
  perfStart('parse');
  let el: ElementNode | undefined;
  if (options.preferNativeParser) {
    try {
      el = tryParseWithNativeDom(html);
    }
    catch (e) {
      nodeHtmlParse = getNodeHtmlParser();
      if (nodeHtmlParse) console.warn('Native DOM parser encountered an error during parse', e);
      else throw e;
    }
  }
  else nodeHtmlParse = getNodeHtmlParser();

  if (!el) el = nodeHtmlParse!(html, nodeHtmlParserConfig).removeWhitespace();
  perfStop('parse');

  return el;
}

// endregion


/* ****************************************************************************************************************** */
// region: General
/* ****************************************************************************************************************** */

export function getChildNodes<T extends HtmlNode | Node>(node: T): T[]
export function getChildNodes(node: HtmlNode | Node): (Node | HtmlNode)[] {
  if (!isNodeList(node.childNodes)) return node.childNodes;

  const res: (ChildNode)[] = [];
  node.childNodes.forEach(n => res.push(n));

  return res;

  function isNodeList(v: any): v is NodeListOf<ChildNode> {
    return (v != null) || (typeof v[Symbol.iterator] === 'function');
  }
}

export function perfStart(label: string) {
  if (process.env.LOG_PERF) console.time(label);
}

export function perfStop(label: string) {
  if (process.env.LOG_PERF) console.timeEnd(label);
}

// endregion

import type * as NHParser from 'node-html-parser';


/* ****************************************************************************************************************** */
// region: Locals
/* ****************************************************************************************************************** */

const NodeType = {
  ELEMENT_NODE: 1,
  TEXT_NODE: 3,
  COMMENT_NODE: 8
}

// endregion


/* ****************************************************************************************************************** */
// region: Types
/* ****************************************************************************************************************** */

/* ********************************************************* *
 * Merged Nodes - Unions of node-html-parser and common DOM
 * ********************************************************* */

type NodeBase = { preserve?: boolean }

export type HtmlNode = (NHParser.Node | Node) & NodeBase
export type ElementNode = (NHParser.HTMLElement | HTMLElement) & NodeBase
export type TextNode = (NHParser.TextNode) & NodeBase
export type CommentNode = (NHParser.CommentNode) & NodeBase

// endregion


/* ****************************************************************************************************************** */
// region: TypeGuards
/* ****************************************************************************************************************** */

export const isTextNode = (node: HtmlNode): node is TextNode => node.nodeType === NodeType.TEXT_NODE;
export const isCommentNode = (node: HtmlNode): node is CommentNode => node.nodeType === NodeType.COMMENT_NODE;
export const isElementNode = (node: HtmlNode): node is ElementNode => node.nodeType === NodeType.ELEMENT_NODE;

// endregion

import * as NHParser from 'node-html-parser';
import { CommentNode, NodeType, TextNode } from 'node-html-parser';


/* ****************************************************************************************************************** */
// region: Types
/* ****************************************************************************************************************** */

export { TextNode, NodeType, CommentNode }

/* ********************************************************* *
 * Merged Nodes - Unions of node-html-parser and common DOM
 * ********************************************************* */

export type HtmlNode = NHParser.Node | Node
export type ElementNode = NHParser.HTMLElement | HTMLElement

// endregion


/* ****************************************************************************************************************** */
// region: TypeGuards
/* ****************************************************************************************************************** */

export const isTextNode = (node: HtmlNode): node is TextNode => node.nodeType === NodeType.TEXT_NODE;
export const isCommentNode = (node: HtmlNode): node is CommentNode => node.nodeType === NodeType.COMMENT_NODE;
export const isElementNode = (node: HtmlNode): node is ElementNode => node.nodeType === NodeType.ELEMENT_NODE;

// endregion

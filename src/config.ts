import { isWhiteSpaceOnly, surround, trimNewLines } from './utilities';
import { PostProcess, TranslatorConfigObject } from './translator';
import { NodeHtmlMarkdownOptions } from './options';
import { Options as NodeHtmlParserOptions } from 'node-html-parser'
import { EscapeConfig } from './escape';


/* ****************************************************************************************************************** */
// region: Elements
/* ****************************************************************************************************************** */

export const defaultBlockElements = [
  'ADDRESS', 'ARTICLE', 'ASIDE', 'AUDIO', 'BLOCKQUOTE', 'BODY', 'CANVAS', 'CENTER', 'DD', 'DIR', 'DIV', 'DL',
  'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'HEADER', 'HGROUP', 'HR', 'HTML', 'ISINDEX', 'LI', 'MAIN', 'MENU', 'NAV', 'NOFRAMES', 'NOSCRIPT', 'OL',
  'OUTPUT', 'P', 'PRE', 'SECTION', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'UL', 'BLOCKQUOTE',
  'PRE', 'UL', 'OL'
]

export const defaultIgnoreElements = [
  'AREA', 'BASE', 'COL', 'COMMAND', 'EMBED', 'INPUT', 'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'
];

// endregion


/* ****************************************************************************************************************** */
// region: Options
/* ****************************************************************************************************************** */

export const defaultOptions: Readonly<NodeHtmlMarkdownOptions> = Object.freeze({
  preferNativeParser: false,
  codeFence: '```',
  bulletMarker: '*',
  indent: '  ',
  codeBlockStyle: <'indented' | 'fenced'>'fenced',
  emDelimiter: '_',
  strongDelimiter: '**',
  maxConsecutiveNewlines: 3,
});

// endregion


/* ****************************************************************************************************************** */
// region: Escapes
/* ****************************************************************************************************************** */

/**
 * @see EscapeConfig
 */
export const defaultEscapes: EscapeConfig = {
  // Pattern / Character            Affected                        Affected Examples
  singleCharacters: [
    '\\\\',                      // Escaping                        \-
    '`',                         // Code                            `` code ``,  ```lang\n code block \n```
    '\*',                        // Bullet & Separators             * item,  ***
    '_',                         // Bold, Italics                   _italic_,  __bold__
    '~',                         // Strikethrough, Code             ~~strike~~,  ~~~lang\n code block \n~~~
    '\\[',                       // Url                             [caption](url)
    '\\]',                       // Url                             [caption](url)
  ],

  /**
   * See comments on EscapeConfig for detail on how this works
   */
  startLinePatterns: [
    /\+\s/,                      // Bullets                          + item
    /_{3,}/,                     // Separators                       ___
    /=+/,                        // Heading                          heading\n====
    /#{1,6}\s/,                  // Heading                          ## Heading
    />/,                         // Blockquote                       > quote
    /-/,                         // Bullet, Header, Separator        - item, heading\n---, ---
    /\d+(\.\s)/                  // Numbered list item               1. Item
  ]
}

// endregion


/* ****************************************************************************************************************** */
// region: Translators
/* ****************************************************************************************************************** */

export const defaultTranslators: TranslatorConfigObject = {
  /* Pre-formatted text */
  'pre': { noEscape: true },

  /* Line break */
  'br': { content: `  \n`, recurse: false },

  /* Horizontal Rule*/
  'hr': { content: '---', recurse: false },

  /* Headings */
  'h1,h2,h3,h4,h5,h6': ({ node }) => ({
    prefix: '#'.repeat(+node.tagName.charAt(1)) + ' '
  }),

  /* Strikethrough */
  'del,s,strike': {
    postprocess: ({ content }) => isWhiteSpaceOnly(content)
                                  ? PostProcess.RemoveNode
                                  : content.replace(/^(.+)$/gm, '~~$1~~')
  },

  /* Italic / Emphasis */
  'em,i': ({ options: { emDelimiter } }) => ({
    prefix: emDelimiter,
    postfix: emDelimiter,
    postprocess: ({ content }) => isWhiteSpaceOnly(content) ? PostProcess.RemoveNode : PostProcess.NoChange
  }),

  /* Lists (ordered & unordered) */
  'ol,ul': ({ listKind }) => ({
    surroundingNewlines: listKind ? 1 : 2
  }),

  /* Bold / Strong */
  'strong,b': ({ options: { strongDelimiter } }) => ({
    prefix: strongDelimiter,
    postfix: strongDelimiter,
    postprocess: ({ content }) => isWhiteSpaceOnly(content) ? PostProcess.RemoveNode : PostProcess.NoChange
  }),

  /* Block Quote */
  'blockquote': {
    postprocess: ({ content }) => trimNewLines(content).replace(/^(>*)[^\S\r\n]?/gm, `>$1 `)
  },

  /* List Item */
  'li': ({ options: { indent, bulletMarker }, indentLevel, listKind, listItemNumber }) => ({
    prefix: indent.repeat(+(indentLevel || 0)) +
      (((listKind === 'OL') && (listItemNumber !== undefined)) ? `${listItemNumber}. ` : `${bulletMarker} `),
    surroundingNewlines: 1
  }),

  /* Code (block / inline) */
  'code': ({ node, parent, options: { codeFence, codeBlockStyle } }) => {
    const isCodeBlock = parent?.tagName === 'PRE' && parent.childNodes.length < 2;

    /* Handle code (non-block) */
    if (!isCodeBlock)
      return {
        noEscape: true,
        postprocess: ({ content }) => {
          // Find longest occurring sequence of running backticks and add one more (so content is escaped)
          const delimiter = '`' + (content.match(/`+/g)?.sort((a, b) => b.length - a.length)?.[0] || '');
          const padding = delimiter.length > 1 ? ' ' : '';

          return surround(surround(content, padding), delimiter)
        }
      }

    /* Handle code block */
    if (codeBlockStyle === 'fenced') {
      const language = node.getAttribute('class')?.match(/language-(\S+)/)?.[1] || '';
      return {
        noEscape: true,
        prefix: codeFence + language + '\n',
        postfix: '\n' + codeFence,
      }
    } else {
      return {
        noEscape: true,
        surroundingNewlines: 2,
        postprocess: ({ content }) => content.replace(/^/gm, '    ')
      }
    }
  },

  /* Link */
  'a': ({ node }) => {
    const href = node.getAttribute('href');
    if (!href) return { ignore: true };

    const title = node.getAttribute('title');

    return {
      prefix: '[',
      postfix: `](${href}${title ? ` "${title}"` : ''})`
    }
  },

  /* Image */
  'img': ({ node }) => {
    const src = node.getAttribute('src') || '';
    if (!src) return { ignore: true };

    const alt = node.getAttribute('alt') || '';
    const title = node.getAttribute('title') || '';

    return {
      content: `![${alt}](${src}${title && ` "${title}"`})`,
      recurse: false
    }
  },
}

// endregion


/* ****************************************************************************************************************** */
// region: General
/* ****************************************************************************************************************** */

/**
 * Note: Do not change - values are tuned for performance
 */
export const nodeHtmlParserConfig: NodeHtmlParserOptions = {
  lowerCaseTagName: false,
  script: false,
  style: false,
  pre: true,
  comment: false
};

// endregion

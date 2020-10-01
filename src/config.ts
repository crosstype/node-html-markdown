import { isWhiteSpaceOnly, surround, trimNewLines } from './utilities';
import { TranslatorCollection } from './translator';


/* ****************************************************************************************************************** */
// region: Elements
/* ****************************************************************************************************************** */

export const defaultBlockElements = [
  'ADDRESS', 'ARTICLE', 'ASIDE', 'AUDIO', 'BLOCKQUOTE', 'BODY', 'CANVAS', 'CENTER', 'DD', 'DIR', 'DIV', 'DL',
  'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'HEADER', 'HGROUP', 'HR', 'HTML', 'ISINDEX', 'LI', 'MAIN', 'MENU', 'NAV',  'NOFRAMES', 'NOSCRIPT', 'OL',
  'OUTPUT', 'P', 'PRE', 'SECTION', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'UL', 'BLOCKQUOTE',
  'PRE', 'CODE'
]

export const defaultIgnoreElements = [
  'AREA', 'BASE', 'COL', 'COMMAND', 'EMBED', 'INPUT', 'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'
];

// endregion


/* ****************************************************************************************************************** */
// region: Translators
/* ****************************************************************************************************************** */

export const defaultTranslators: TranslatorCollection = {
  /* Line break */
  'br': { caption: `  \n`, recurse: false },

  /* Horizontal Rule*/
  'hr': { caption: '* * *', surroundingNewlines: 2, recurse: false },

  /* Headings */
  'h1,h2,h3,h4,h5,h6': ({ node }) => ({
    caption: '#'.repeat(+node.tagName.charAt(1))
  }),

  /* Italic / Emphasis */
  'em,i': {
    caption: ({ caption, options: { emDelimiter } }) => isWhiteSpaceOnly(caption) ? '' : surround(caption, emDelimiter)
  },

  /* Bold / Strong */
  'strong,b': {
    caption: ({ caption, options: { strongDelimiter } }) => isWhiteSpaceOnly(caption) ? '' : surround(caption, strongDelimiter)
  },

  /* Block Quote */
  'blockquote': {
    caption: ({ caption }) => trimNewLines(caption).replace(/^/gm, '> '),
  },

  /* Lists (ordered & unordered) */
  'ul,ol': ({ node, parent }) => {
    const isLILastChild = (parent?.tagName === 'LI' && node === parent.lastChild);
    return {
      prefix: isLILastChild ? `\n` : `\n\n`,
      postfix: isLILastChild ? void 0 : `\n\n`,
    }
  },

  /* List Item */
  'li': {
    caption: ({ caption, node, options: { indent } }) => indent.repeat(+(node.indentLevel || 0)) + '* ' + caption
  },

  /* Code (block / inline) */
  'code': ({ node, parent, options: { codeFence, codeBlockStyle, indent } }) => {
    const isCodeBlock = parent?.tagName === 'PRE' && parent.childNodes.length < 2;

    /* Handle code (non-block) */
    if (!isCodeBlock)
      return {
        caption: ({ caption }) => {
          const delimiter = '`' + (caption.match(/`+/g)?.sort((a, b) => b.length - a.length)?.[0] || '');
          const padding = delimiter.length > 1 ? ' ' : '';

          return surround(surround(caption, padding), delimiter)
        }
      }

    /* Handle code block */
    if (codeBlockStyle === 'fenced') {
      const language = node.getAttribute('class')?.match(/language-(\S+)/)?.[1] || '';
      return {
        prefix: codeFence + language + '\n',
        postfix: '\n' + codeFence,
      }
    } else {
      return {
        surroundingNewlines: 2,
        caption: ({ caption }) => caption.replace(/^/gm, indent.repeat(2))
      }
    }
  },

  /* Link */
  'a': {
    caption: ({ caption, node }) => {
      const href = node.getAttribute('href');
      const title = node.getAttribute('title');

      if (!href) return ``;

      return `[${caption}](${href}${title ? ` "${title}"` : ''})`
    }
  },

  /* Image */
  'img': ({ node }) => {
      const src = node.getAttribute('src') || '';
      if (!src) return { ignore: true, recurse: false };

      const alt = node.getAttribute('alt') || '';
      const title = node.getAttribute('title') || '';

      return {
        caption: `![${alt}](${src}${title && ` "${title}"`})`,
        recurse: false
      }
    }
}

// endregion

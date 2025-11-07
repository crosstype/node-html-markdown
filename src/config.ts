import { isWhiteSpaceOnly, splitSpecial, surround, tagSurround, trimNewLines } from './utilities';
import { PostProcessResult, TranslatorConfigObject } from './translator';
import { NodeHtmlMarkdownOptions } from './options';


/* ****************************************************************************************************************** */
// region: Elements
/* ****************************************************************************************************************** */

export const defaultBlockElements = [
  'ADDRESS', 'ARTICLE', 'ASIDE', 'AUDIO', 'BLOCKQUOTE', 'BODY', 'CANVAS', 'CENTER', 'DD', 'DIR', 'DIV', 'DL',
  'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'HEADER', 'HGROUP', 'HR', 'HTML', 'ISINDEX', 'LI', 'MAIN', 'MENU', 'NAV', 'NOFRAMES', 'NOSCRIPT', 'OL',
  'OUTPUT', 'P', 'PRE', 'SECTION', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'UL'
]

export const defaultIgnoreElements = [
  'AREA', 'BASE', 'COL', 'COMMAND', 'EMBED', 'HEAD', 'INPUT', 'KEYGEN', 'LINK', 'META', 'PARAM', 'SCRIPT',
  'SOURCE', 'STYLE', 'TRACK', 'WBR'
];

export const contentlessElements = [ 'BR', 'HR', 'IMG' ];

// endregion


/* ****************************************************************************************************************** */
// region: Options
/* ****************************************************************************************************************** */

// noinspection RegExpUnnecessaryNonCapturingGroup
export const defaultOptions: Readonly<NodeHtmlMarkdownOptions> = Object.freeze({
  preferNativeParser: false,
  codeFence: '```',
  bulletMarker: '*',
  indent: '  ',
  codeBlockStyle: <'indented' | 'fenced'>'fenced',
  emDelimiter: '_',
  strongDelimiter: '**',
  strikeDelimiter: '~~',
  maxConsecutiveNewlines: 3,
  /**
   * Character:               Affects:                       Example:
   *
   *     \                      Escaping                        \-
   *     `                      Code                            `` code ``,  ```lang\n code block \n```
   *     *                      Bullet & Separators             * item,  ***
   *     _                      Bold, Italics, Separator        _italic_,  __bold__,  ^___
   *     ~                      Strikethrough, Code             ~~strike~~,  ~~~lang\n code block \n~~~
   *     [                      Url                             [caption](url)
   *     ]                      Url                             [caption](url)
   */
  globalEscape: [ /[\\`*_~\[\]]/gm, '\\$&' ] as const,
  /**
   * Note:  The following compiled pattern was selected after perf testing various alternatives.
   *        Please be mindful of performance if updating/changing it.
   *
   * Sequence:                Affects:                        Example:
   *
   *    +(space)                Bullets                         + item
   *    =                       Heading                         heading\n====
   *    #{1,6}(space)           Heading                         ## Heading
   *    >                       Blockquote                      > quote
   *    -                       Bullet, Header, Separator       - item, heading\n---, ---
   *    \d+\.(space)            Numbered list item              1. Item
   */
  lineStartEscape: [
    /^(\s*?)((?:\+\s)|(?:[=>-])|(?:#{1,6}\s))|(?:(\d+)(\.\s))/gm,
    '$1$3\\$2$4'
  ] as const,

  useInlineLinks: true
});

// endregion


/* ****************************************************************************************************************** */
// region: Translators
/* ****************************************************************************************************************** */

export const defaultTranslators: TranslatorConfigObject = {
  /* Pre-formatted text */
  'pre': { noEscape: true, preserveWhitespace: true },

  /* Line break */
  'br': { content: `  \n`, recurse: false },

  /* Horizontal Rule*/
  'hr': { content: '---', recurse: false },

  /* Headings */
  'h1,h2,h3,h4,h5,h6': ({ node }) => ({
    prefix: '#'.repeat(+node.tagName.charAt(1)) + ' '
  }),

  /* Bold / Strong */
  'strong,b': {
    spaceIfRepeatingChar: true,
    postprocess: ({ content, options: { strongDelimiter } }) =>
      isWhiteSpaceOnly(content)
      ? PostProcessResult.RemoveNode
      : tagSurround(content, strongDelimiter)
  },

  /* Strikethrough */
  'del,s,strike': {
    spaceIfRepeatingChar: true,
    postprocess: ({ content, options: { strikeDelimiter } }) =>
      isWhiteSpaceOnly(content)
      ? PostProcessResult.RemoveNode
      : tagSurround(content, strikeDelimiter)
  },

  /* Italic / Emphasis */
  'em,i': {
    spaceIfRepeatingChar: true,
    postprocess: ({ content, options: { emDelimiter } }) =>
      isWhiteSpaceOnly(content)
      ? PostProcessResult.RemoveNode
      : tagSurround(content, emDelimiter)
  },

  /* Lists (ordered & unordered) */
  'ol,ul': ({ listKind }) => ({
    surroundingNewlines: listKind ? 1 : 2,
  }),

  /* List Item */
  'li': ({ options: { bulletMarker, indent }, indentLevel, listKind, listItemNumber }) => {
    const indentationLevel = +(indentLevel || 0);
    return {
      prefix: indent.repeat(+(indentLevel || 0)) +
        (((listKind === 'OL') && (listItemNumber !== undefined)) ? `${listItemNumber}. ` : `${bulletMarker} `),
      surroundingNewlines: 1,
      postprocess: ({ content }) =>
        isWhiteSpaceOnly(content)
        ? PostProcessResult.RemoveNode
        : content
          .trim()
          .replace(/([^\r\n])(?:\r?\n)+/g, `$1  \n${indent.repeat(indentationLevel)}`)
          .replace(/(\S+?)[^\S\r\n]+$/gm, '$1  ')
    }
  },

  /* Block Quote */
  'blockquote': {
    postprocess: ({ content }) => trimNewLines(content).replace(/^(>*)[^\S\r\n]?/gm, `>$1 `)
  },

  /* Code (block / inline) */
  'code': ({ node, parent, options: { codeFence, codeBlockStyle }, visitor }) => {
    const isCodeBlock = [ 'PRE', 'WRAPPED-PRE' ].includes(parent?.tagName!) && parent!.childNodes.length < 2;

    /* Handle code (non-block) */
    if (!isCodeBlock)
      return {
        spaceIfRepeatingChar: true,
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
        preserveWhitespace: true,
        prefix: codeFence + language + '\n',
        postfix: '\n' + codeFence,
        childTranslators: visitor.instance.codeBlockTranslators
      }
    } else {
      return {
        noEscape: true,
        preserveWhitespace: true,
        postprocess: ({ content }) => content.replace(/^/gm, '    '),
        childTranslators: visitor.instance.codeBlockTranslators
      }
    }
  },

  /* Table */
  'table': ({ visitor }) => ({
    surroundingNewlines: 2,
    childTranslators: visitor.instance.tableTranslators,
    postprocess: ({ content, nodeMetadata, node }) => {
      // Split and trim leading + trailing pipes
      const rawRows = splitSpecial(content).map(({ text }) => text.replace(/^(?:\|)?(.+)\s*\|\s*$/, '$1'));

      /* Get Row Data */
      const rows: string[][] = [];
      let colWidth: number[] = [];
      for (const row of rawRows) {
        if (!row) continue;

        /* Track columns */
        const cols = row.split(' |').map((c, i) => {
          c = c.trim();
          if (colWidth.length < i + 1 || colWidth[i] < c.length) colWidth[i] = c.length;

          return c;
        });

        rows.push(cols);
      }

      if (rows.length < 1) return PostProcessResult.RemoveNode;

      /* Compose Table */
      const maxCols = colWidth.length;

      let res = '';
      const caption = nodeMetadata.get(node)!.tableMeta!.caption;
      if (caption) res += caption + '\n';

      rows.forEach((cols, rowNumber) => {
        res += '| ';

        /* Add Columns */
        for (let i = 0; i < maxCols; i++) {
          let c = (cols[i] ?? '');
          c += ' '.repeat(Math.max(0, (colWidth[i] - c.length))); // Pad to max length

          res += c + ' |' + (i < maxCols - 1 ? ' ' : '');
        }

        res += '\n';

        // Add separator row
        if (rowNumber === 0) res += '|' + colWidth.map(w => ' ' + '-'.repeat(w) + ' |').join('') + '\n'
      });

      return res;
    }
  }),

  /* Table Columns */
  'td,th': { preserveIfEmpty: true },

  /* Link */
  'a': ({ node, options, visitor }) => {
    const href = node.getAttribute('href');
    if (!href) return {};

    // Encodes symbols that can cause problems in markdown
    let encodedHref = '';
    for (const chr of href) {
      switch (chr) {
        case '(':
          encodedHref += '%28';
          break;
        case ')':
          encodedHref += '%29';
          break;
        case '_':
          encodedHref += '%5F';
          break;
        case '*':
          encodedHref += '%2A';
          break;
        default:
          encodedHref += chr;
      }
    }

    const title = node.getAttribute('title');

    // Inline link, when possible
    // See: https://github.com/crosstype/node-html-markdown/issues/17
    if (node.textContent === href && options.useInlineLinks) return { content: `<${encodedHref}>` };

    return {
      postprocess: ({ content }) => content.replace(/(?:\r?\n)+/g, ' '),
      childTranslators: visitor.instance.aTagTranslators,
      prefix: '[',
      postfix: ']' + (!options.useLinkReferenceDefinitions
               ? `(${encodedHref}${title ? ` "${title}"` : ''})`
               : `[${visitor.addOrGetUrlDefinition(encodedHref)}]`)
    }
  },

  /* Image */
  'img': ({ node, options }) => {
    const src = node.getAttribute('src') || '';
    if (!src || (!options.keepDataImages && /^data:/i.test(src))) return { ignore: true };

    const alt = node.getAttribute('alt') || '';
    const title = node.getAttribute('title') || '';

    return {
      content: `![${alt}](${src}${title && ` "${title}"`})`,
      recurse: false
    }
  },
}

export const tableTranslatorConfig: TranslatorConfigObject = {
  /* Table Caption */
  'caption': ({ visitor }) => ({
    surroundingNewlines: false,
    childTranslators: visitor.instance.tableCellTranslators,
    postprocess: ({ content, nodeMetadata, node }) => {
      const caption = content.replace(/(?:\r?\n)+/g, ' ').trim();
      if (caption) nodeMetadata.get(node)!.tableMeta!.caption = '__' + caption + '__'

      return PostProcessResult.RemoveNode;
    },
  }),

  /* Table row */
  'tr': ({ visitor }) => ({
    surroundingNewlines: false,
    childTranslators: visitor.instance.tableRowTranslators,
    postfix: '\n',
    prefix: '| ',
    postprocess: ({ content }) => !/ \|\s*$/.test(content) ? PostProcessResult.RemoveNode : content
  }),

  /* Table cell, (header cell) */
  'th,td': ({ visitor }) => ({
    surroundingNewlines: false,
    childTranslators: visitor.instance.tableCellTranslators,
    prefix: ' ',
    postfix: ' |',
    postprocess: ({ content }) =>
      trimNewLines(content)
        .replace('|', '\\|')
        .replace(/(?:\r?\n)+/g, ' ')
        .trim()
  }),
}

export const tableRowTranslatorConfig: TranslatorConfigObject = {
  'th,td': tableTranslatorConfig['th,td']
}

export const tableCellTranslatorConfig: TranslatorConfigObject = {
  'a': defaultTranslators['a'],
  'strong,b': defaultTranslators['strong,b'],
  'del,s,strike': defaultTranslators['del,s,strike'],
  'em,i': defaultTranslators['em,i'],
  'img': defaultTranslators['img']
}

export const defaultCodeBlockTranslators: TranslatorConfigObject = {
  'br': { content: `\n`, recurse: false },
  'hr': { content: '---', recurse: false },
  'h1,h2,h3,h4,h5,h6': { prefix: '[', postfix: ']' },
  'ol,ul': { surroundingNewlines: false },
  'li': defaultTranslators['li'],
  'tr': { surroundingNewlines: false },
  'img': { recurse: false }
}

export const aTagTranslatorConfig: TranslatorConfigObject = {
  'br': { content: '\n', recurse: false },
  'hr': { content: '\n', recurse: false },
  'pre': defaultTranslators['pre'],
  'strong,b': defaultTranslators['strong,b'],
  'del,s,strike': defaultTranslators['del,s,strike'],
  'em,i': defaultTranslators['em,i'],
  'img': defaultTranslators['img']
}

// endregion

[![npm version](https://badge.fury.io/js/node-html-markdown.svg)](https://badge.fury.io/js/ts-patch)
![Build Status](https://github.com/crosstype/node-html-markdown/workflows/Build%20(CI)/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/crosstype/node-html-markdown/badge.svg?branch=master)](https://coveralls.io/github/crosstype/node-html-markdown?branch=master)

# HTML to Markdown

This library is a _fast_ HTML to markdown cross-compiler. It is compatible with both node or the browser.

It was born out of a need to convert gigabytes of HTML daily very quickly, when all other libraries were far too slow 
with node. A low-level language was considered, but we attempted to write something that would squeeze every
ounce of performance out of JS and the result was fast enough to make the cut!

## Install

```sh
# Yarn
yarn add node-html-parser

# NPM
npm i -S node-html-parser
```

## Usage

```ts
import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from 'node-html-markdown'


/* ********************************************************* *
 * Single use
 * If using it once, you can use the static method
 * ********************************************************* */

// Single file
NodeHtmlMarkdown.translate(
  /* html */ `<b>hello</b>`, 
  /* options (optional) */ {}, 
  /* customTranslators (optional) */ undefined
);

// Multiple files
NodeHtmlMarkdown.translate(
  /* FileCollection */ { 
    'file1.html': `<b>hello</b>`, 
    'file2.html': `<b>goodbye</b>` 
  }, 
  /* options (optional) */ {}, 
  /* customTranslators (optional) */ undefined
);


/* ********************************************************* *
 * Re-use
 * If using it several times, creating an instance saves time
 * ********************************************************* */

const nhm = new NodeHtmlMarkdown(/* options */ {}, /* customTransformers */ undefined);

// Single file
nhm.translate(/* html */ `<b>hello</b>`);

// Multiple Files
nhm.translate(
  /* FileCollection */ { 
    'file1.html': `<b>hello</b>`, 
    'file2.html': `<b>goodbye</b>` 
  }, 
);
```

## Options

```ts

export interface NodeHtmlMarkdownOptions {
  /**
   * Use native window DOMParser when available
   * @default false
   */
  preferNativeParser: boolean,

  /**
   * Code block fence
   * @default ```
   */
  codeFence: string,

  /**
   * Bullet marker
   * @default *
   */
  bulletMarker: string,

  /**
   * Indent string
   * @default '  '
   */
  indent: string,

  /**
   * Style for code block
   * @default fence
   */
  codeBlockStyle: 'indented' | 'fenced',

  /**
   * Emphasis delimiter
   * @default _
   */
  emDelimiter: string,

  /**
   * Strong delimiter
   * @default **
   */
  strongDelimiter: string,

  /**
   * Supplied elements will be ignored (ignores inner text does not parse children)
   */
  ignore?: string[],

  /**
   * Supplied elements will be treated as blocks (surrounded with blank lines)
   */
  blockElements?: string[],

  /**
   * Max consecutive new lines allowed
   * @default 3
   */
  maxConsecutiveNewlines: number,

  /**
   * Line Start Escape pattern
   * (Note: Setting this will override the default escape settings, you might want to use textReplace option instead)
   */
  lineStartEscape: [ pattern: RegExp, replacement: string ]

  /**
   * Global escape pattern
   * (Note: Setting this will override the default escape settings, you might want to use replaceText option instead)
   */
  globalEscape: [ pattern: RegExp, replacement: string ]

  /**
   * User-defined text replacement pattern (Replaces matching text retrieved from nodes)
   */
  textReplace?: [ pattern: RegExp, replacement: string ][]

  /**
   * Keep images with data: URI (Note: These can be up to 1MB each)
   * @example
   * <img src="data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSK......0o/">
   * @default false
   */
  keepDataImages?: boolean
}
```

## Custom Translators

Custom translators are an advanced option to allow handling certain elements a specific way.

These can be modified via the `nhm.translators` property, or added during creation.

For detail on how to use see:

- Documentation comments for `TranslatorConfig` in [translator.ts](https://github.com/crosstype/node-html-markdown/blob/master/src/translator.ts)
- Translators `defaultTranslators` in [config.ts](https://github.com/crosstype/node-html-markdown/blob/master/src/config.ts)
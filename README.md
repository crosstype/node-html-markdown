[![npm version](https://badge.fury.io/js/node-html-markdown.svg)](https://badge.fury.io/js/ts-patch)
![Build Status](https://github.com/crosstype/node-html-markdown/workflows/Build%20(CI)/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/crosstype/node-html-markdown/badge.svg?branch=master)](https://coveralls.io/github/crosstype/node-html-markdown?branch=master)

# node-html-markdown

NHM is a _fast_ HTML to markdown cross-compiler, compatible with both node and the browser.

It was built with the following two goals in mind:

### 1. Speed

We had a need to cross-compile gigabytes of HTML daily very quickly. All libraries we found were too slow with node. 
We considered using a low-level language but decided to attempt to write something that would squeeze every bit
of performance out of the JIT that we could. The end result was fast enough to make the cut!

### 2. Human Readability

The other libraries we tested produced output that would break in numerous conditions, did not indent or number lists, 
and produced text with many trailing line-feeds.
 
In other words, outside of a markdown viewer, the result was cluttered and not easy to read.

This library produces a _very_ clean result with consistent spacing rules for various block elements.

## Install

```sh
# Yarn
yarn add node-html-parser

# NPM
npm i -S node-html-parser
```

## Benchmarks
```
--------------------------------------------------------------------------------------

node-html-makrdown (reused instance): 46.0008 ms/file ± 27.3827 (avg bytes/sec: 2.141)
node-html-markdown                  : 47.0208 ms/file ± 28.4478 (avg bytes/sec: 2.095)
turndown                            : 80.7753 ms/file ± 33.3519 (avg bytes/sec: 1.219)
turndown (reused instance)          : 65.9743 ms/file ± 32.3411 (avg bytes/sec: 1.493)

--------------------------------------------------------------------------------------

Estimated processing times (fastest to slowest):

  [node-html-makrdown (reused instance)]
    100 kB:  48ms
    1 MB:    490ms
    50 MB:   24.48sec
    1 GB:    8min, 21sec
    50 GB:   6hr, 57min, 52sec

  [turndown (reused instance)]
    100 kB:  69ms
    1 MB:    702ms
    50 MB:   35.12sec
    1 GB:    11min, 59sec
    50 GB:   9hr, 59min, 18sec

--------------------------------------------------------------------------------------

Comparison to fastest (node-html-makrdown (reused instance)):
  node-html-markdown: -2.17%
  turndown (reused instance): -30.27%
  turndown: -43.05%

--------------------------------------------------------------------------------------
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

__For detail on how to use see__:

- [translator.ts](https://github.com/crosstype/node-html-markdown/blob/master/src/translator.ts) - Documentation for `TranslatorConfig`
- [config.ts](https://github.com/crosstype/node-html-markdown/blob/master/src/config.ts) - Translators in `defaultTranslators`

## Help Wanted!

We'd love some help! There are several enhancements ranging from beginner to moderate difficulty.

Please check out our [help wanted](https://github.com/crosstype/node-html-markdown/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) list.

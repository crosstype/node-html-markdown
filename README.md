[![npm version](https://badge.fury.io/js/node-html-markdown.svg)](https://badge.fury.io/js/ts-patch)
![Build Status](https://github.com/crosstype/node-html-markdown/workflows/Build%20(CI)/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/crosstype/node-html-markdown/badge.svg?branch=master)](https://coveralls.io/github/crosstype/node-html-markdown?branch=master)

# node-html-markdown

NHM is a _fast_ HTML to markdown converter, compatible with both node and the browser.

It was built with the following two goals in mind:

### 1. Speed

We had a need to convert gigabytes of HTML daily very quickly. All libraries we found were too slow with node. 
We considered using a low-level language but decided to attempt to write something that would squeeze every bit
of performance out of the JIT that we could. The end result was fast enough to make the cut!

### 2. Human Readability

The other libraries we tested produced output that would break in numerous conditions and produced output with many
repeating linefeeds, etc. Generally speaking, outside of a markdown viewer, the result was not easy to read.

We took the approach of producing a _clean, concise_ result with consistent spacing rules.

## Install

```sh
# Yarn
yarn add node-html-markdown

# NPM
npm i -S node-html-markdown
```

## Benchmarks
```
-------------------------------------------------------------------------------

node-html-makrdown (reused instance): 22.7441 ms/file ± 12.5888 (4.13 MB/s)
node-html-markdown                  : 23.9525 ms/file ± 13.1008 (3.92 MB/s)
turndown                            : 67.3323 ms/file ± 30.3120 (1.4 MB/s)
turndown (reused instance)          : 66.7893 ms/file ± 35.6442 (1.41 MB/s)

-------------------------------------------------------------------------------

Estimated processing times (fastest to slowest):

  [node-html-makrdown (reused instance)]
    100 kB:  24ms
    1 MB:    242ms
    50 MB:   12.11sec
    1 GB:    4min, 8sec
    50 GB:   3hr, 26min, 36sec

  [turndown (reused instance)]
    100 kB:  69ms
    1 MB:    711ms
    50 MB:   35.55sec
    1 GB:    12min, 8sec
    50 GB:   10hr, 6min, 43sec

-------------------------------------------------------------------------------

Speed comparison - node-html-makrdown (reused instance) is:

  1.05 times as fast as node-html-markdown
  2.94 times as fast as turndown (reused instance)
  2.96 times as fast as turndown

-------------------------------------------------------------------------------
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

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {}, 
  /* customTransformers (optional) */ undefined
);

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

__For detail on how to use them see__:

- [translator.ts](https://github.com/crosstype/node-html-markdown/blob/master/src/translator.ts) - Documentation for `TranslatorConfig`
- [config.ts](https://github.com/crosstype/node-html-markdown/blob/master/src/config.ts) - Translators in `defaultTranslators`

## Further improvements

We could gain _tremendous_ further gains writing a custom parser and integrating an async worker-thread based
model for multi-threading in order to truly resemble a low-level approach. This may be something we do in the future, 
but for now, this is sufficient for our needs.

If you have need for something like that or ideas, feel free to discuss approaches in the issues.

## Help Wanted!

We'd love some help! There are several enhancements ranging from beginner to moderate difficulty.

Please check out our [help wanted](https://github.com/crosstype/node-html-markdown/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) list.

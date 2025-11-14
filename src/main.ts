import { NodeHtmlMarkdownOptions } from './options';
import { TranslatorCollection, TranslatorConfigObject } from './translator';
import {
  aTagTranslatorConfig, defaultBlockElements, defaultCodeBlockTranslators, defaultIgnoreElements, defaultOptions,
  defaultTranslators, tableCellTranslatorConfig, tableRowTranslatorConfig, tableTranslatorConfig
} from './config';
import { parseHTML } from './utilities';
import { getMarkdownForHtmlNodes } from './visitor';


/* ****************************************************************************************************************** */
// region: Types
/* ****************************************************************************************************************** */

export type FileCollection = { [fileName: string]: string }
type Options = Partial<NodeHtmlMarkdownOptions>

// endregion


/* ****************************************************************************************************************** */
// region: NodeHtmlMarkdown (class)
/* ****************************************************************************************************************** */

export class NodeHtmlMarkdown {
  public translators = new TranslatorCollection();
  public aTagTranslators = new TranslatorCollection();
  public codeBlockTranslators = new TranslatorCollection();
  public tableTranslators = new TranslatorCollection();
  public tableRowTranslators = new TranslatorCollection();
  public tableCellTranslators = new TranslatorCollection();
  public readonly options: NodeHtmlMarkdownOptions

  constructor(options?: Options, customTranslators?: TranslatorConfigObject, customCodeBlockTranslators?: TranslatorConfigObject) {
    /* Setup Options */
    this.options = { ...defaultOptions, ...options };
    const ignoredElements = this.options.ignore?.concat(defaultIgnoreElements) ?? defaultIgnoreElements;
    const blockElements = this.options.blockElements?.concat(defaultBlockElements) ?? defaultBlockElements;

    /* Setup Translator Bases */
    blockElements?.forEach(el => {
      this.translators.set(el, { surroundingNewlines: 2 });
      this.codeBlockTranslators.set(el, { surroundingNewlines: 2 });
    });

    ignoredElements?.forEach(el => {
      this.translators.set(el, { ignore: true, recurse: false });
      this.codeBlockTranslators.set(el, { ignore: true, recurse: false });
    })

    /* Add and merge bases with default and custom translator configs */
    for (const [ elems, cfg ] of Object.entries({ ...defaultTranslators, ...customTranslators }))
      this.translators.set(elems, cfg, true);

    for (const [ elems, cfg ] of Object.entries({ ...defaultCodeBlockTranslators, ...customCodeBlockTranslators }))
      this.codeBlockTranslators.set(elems, cfg, true);

    for (const [ elems, cfg ] of Object.entries(aTagTranslatorConfig))
      this.aTagTranslators.set(elems, cfg, true);

    for (const [ elems, cfg ] of Object.entries(tableTranslatorConfig))
      this.tableTranslators.set(elems, cfg, true);

    for (const [ elems, cfg ] of Object.entries(tableRowTranslatorConfig))
      this.tableRowTranslators.set(elems, cfg, true);

    for (const [ elems, cfg ] of Object.entries(tableCellTranslatorConfig))
      this.tableCellTranslators.set(elems, cfg, true);

    // TODO - Workaround for upstream issue (may not be fixed) - https://github.com/taoqf/node-html-parser/issues/78
    if (!this.options.textReplace) this.options.textReplace = [];
    this.options.textReplace.push([ /^<!DOCTYPE.*>/gmi, '' ]);
  }

  /* ********************************************************* */
  // region: Static Methods
  /* ********************************************************* */

  /**
   * Translate HTML source text to markdown
   */
  static translate(html: string, options?: Options, customTranslators?: TranslatorConfigObject, customCodeBlockTranslators?: TranslatorConfigObject): string
  /**
   * Translate collection of HTML source text to markdown
   */
  static translate(files: FileCollection, options?: Options, customTranslators?: TranslatorConfigObject, customCodeBlockTranslators?: TranslatorConfigObject): FileCollection
  static translate(htmlOrFiles: string | FileCollection, opt?: Options, customTranslators?: TranslatorConfigObject, customCodeBlockTranslators?: TranslatorConfigObject):
    string | FileCollection
  {
    return NodeHtmlMarkdown.prototype.translateWorker.call(new NodeHtmlMarkdown(opt, customTranslators, customCodeBlockTranslators), htmlOrFiles);
  }

  // endregion

  /* ********************************************************* */
  // region: Methods
  /* ********************************************************* */

  /**
   * Translate HTML source text to markdown
   */
  translate(html: string): string
  /**
   * Translate collection of HTML source text to markdown
   */
  translate(files: FileCollection): FileCollection
  translate(htmlOrFiles: string | FileCollection): string | FileCollection {
    return this.translateWorker(htmlOrFiles);
  }

  // endregion

  /* ********************************************************* */
  // region: Internal Methods
  /* ********************************************************* */

  private translateWorker(htmlOrFiles: string | FileCollection) {
    const inputIsCollection = typeof htmlOrFiles !== 'string';
    const inputFiles: FileCollection = !inputIsCollection ? { 'default': <string>htmlOrFiles } : <FileCollection>htmlOrFiles;
    const outputFiles: FileCollection = {};

    for (const [ fileName, html ] of Object.entries(inputFiles)) {
      const parsedHtml = parseHTML(html, this.options);
      outputFiles[fileName] = getMarkdownForHtmlNodes(this, parsedHtml, fileName !== 'default' ? fileName : void 0);
    }

    return inputIsCollection ? outputFiles : outputFiles['default'];
  }

  // endregion

}

// endregion

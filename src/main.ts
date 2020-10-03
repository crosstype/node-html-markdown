import { NodeHtmlMarkdownOptions } from './options';
import { TranslatorCollection, TranslatorConfigObject } from './translator';
import { defaultBlockElements, defaultIgnoreElements, defaultOptions, defaultTranslators } from './config';
import { parseHTML } from './utilities';
import { getMarkdownForHtmlNodes } from './visitor';
import { EscapeText } from './escape';


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
  public escaper: EscapeText
  public readonly options: NodeHtmlMarkdownOptions

  constructor(options?: Options, customTranslators?: TranslatorConfigObject) {
    /* Setup Options */
    this.options = { ...defaultOptions, ...options };
    const ignoredElements = this.options.ignore?.concat(defaultIgnoreElements) ?? defaultIgnoreElements;
    const blockElements = this.options.blockElements?.concat(defaultBlockElements) ?? defaultBlockElements;

    /* Setup Translator Bases */
    ignoredElements?.forEach(el => this.translators.set(el, { ignore: true, recurse: false }));
    blockElements?.forEach(el => this.translators.set(el, { surroundingNewlines: 2 }));

    /* Add and merge bases with default and custom translator configs */
    for (const [ elems, cfg ] of Object.entries({ ...defaultTranslators, ...customTranslators }))
      this.translators.set(elems, cfg, true);

    /* Setup Escaper */
    this.escaper = new EscapeText(this.options.escape);
  }


  /* ********************************************************* */
  // region: Static Methods
  /* ********************************************************* */

  /**
   * Translate HTML source text to markdown
   */
  static translate(html: string, options?: Options, customTranslators?: TranslatorConfigObject): string
  /**
   * Translate collection of HTML source text to markdown
   */
  static translate(files: FileCollection, options?: Options, customTranslators?: TranslatorConfigObject): FileCollection
  static translate(htmlOrFiles: string | FileCollection, opt?: Options, trans?: TranslatorConfigObject):
    string | FileCollection
  {
    return NodeHtmlMarkdown.prototype.translateWorker.call(new NodeHtmlMarkdown(opt, trans), htmlOrFiles);
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

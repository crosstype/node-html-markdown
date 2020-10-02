import { createOptions, HtmlToMarkdownOptions } from './options';
import { translateHtml, TranslatorCollection, TranslatorConfig, TranslatorConfigFactory } from './translator';
import { defaultTranslators } from './config';


/* ****************************************************************************************************************** */
// region: Types
/* ****************************************************************************************************************** */

export type FileCollection = { [fileName: string]: string }
type Options = Partial<HtmlToMarkdownOptions>

// endregion


/* ****************************************************************************************************************** */
// region: NodeHtmlMarkdown (class)
/* ****************************************************************************************************************** */

export class NodeHtmlMarkdown {
  public translators = new Map<string, TranslatorConfig | TranslatorConfigFactory>();
  /**
   * @internal
   */
  public readonly options: HtmlToMarkdownOptions

  constructor(options?: Partial<HtmlToMarkdownOptions>, customTranslators?: TranslatorCollection) {
    this.options = createOptions(options);
    this.addTranslators(customTranslators);
  }


  /* ********************************************************* */
  // region: Static Methods
  /* ********************************************************* */

  /**
   * Translate HTML source text to markdown
   */
  static translate(html: string, options?: Options, customTranslators?: TranslatorCollection): string
  /**
   * Translate collection of HTML source text to markdown
   */
  static translate(files: FileCollection, options?: Options, customTranslators?: TranslatorCollection): FileCollection
  static translate(htmlOrFiles: string | FileCollection, opt?: Options, trans?: TranslatorCollection):
    string | FileCollection
  {
    return translateHtml.call(new NodeHtmlMarkdown(opt, trans), htmlOrFiles);
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
    return translateHtml.call(this, htmlOrFiles);
  }

  // endregion

  /* ********************************************************* */
  // region: Internal
  /* ********************************************************* */

  private addTranslators(customTranslators?: TranslatorCollection) {
    const { translators, options } = this;

    // Add ignored element bases
    options.ignore?.forEach(el => translators.set(el.toUpperCase(), { ignore: true, recurse: false }));

    // Add block element bases
    options.blockElements?.forEach(el => translators.set(el.toUpperCase(), { surroundingNewlines: 2 }));

    /* Add and merge bases with default and custom translator configs */
    for (const [ elems, t ] of Object.entries({ ...defaultTranslators, ...customTranslators }))
      elems.split(',').forEach(el => {
        el = el.toUpperCase();

        const base = translators.get(el) as TranslatorConfig | undefined;
        const res = typeof t === 'function'
                    ? Object.assign((...args:any[]) => t.apply(void 0, <any>args), { base })
                    : { ...base, ...t };

        translators.set(el, res)
      });
  }

  // endregion
}

// endregion

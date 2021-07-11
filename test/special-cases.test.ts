import { NodeHtmlMarkdown } from '../src';


/* ****************************************************************************************************************** *
 * Config
 * ****************************************************************************************************************** */

const textFormatTags = [ 'strong', 'b', 'del', 's', 'strike', 'em', 'i' ] as const;
const getDelims = (instance: NodeHtmlMarkdown) => Object.fromEntries(textFormatTags.map(t => [
  t,
  (() => {
    switch (t) {
      case 'strong':
      case 'b':
        return instance.options.strongDelimiter;
      case 'del':
      case 's':
      case 'strike':
        return '~~';
      case 'em':
      case 'i':
        return instance.options.emDelimiter;
    }
  })()
]));


/* ****************************************************************************************************************** *
 * Tests
 * ****************************************************************************************************************** */

describe(`Special Cases`, () => {
  let instance: NodeHtmlMarkdown;
  let delims: ReturnType<typeof getDelims>;
  const translate = (html: string) => instance.translate(html);
  beforeAll(() => {
    instance = new NodeHtmlMarkdown();
    delims = getDelims(instance);
  });

  test(`Removes uncaught Doctype`, () => {
    const res = translate(`<!DOCTYPE html>abc`);
    expect(res).toBe(`abc`);
  });

  describe(`Whitespace handled for leading / trailing whitespace in tags`, () => {
    test.each(textFormatTags)(`%s`, tag => {
      const delim = delims[tag];

      expect(translate(`<p><${tag}> &nbsp;Label:&nbsp; </${tag}>Value</p>`)).toBe(` ${delim}Label:${delim} Value`);
      expect(translate(`<p><${tag}>&nbsp; Label: &nbsp;</${tag}>Value</p>`)).toBe(` ${delim}Label:${delim} Value`);
    });
  });

  // See: https://github.com/crosstype/node-html-markdown/issues/18
  describe(`Removes nested text formatting tags`, () => {
    test.each(textFormatTags)(`%s`, tag => {
      const delim = delims[tag];

      expect(translate(`<${tag}>My <${tag}>bold</${tag}> text</${tag}>`)).toBe(
        `${delim}My bold text${delim}`
      );
    });
  });
});

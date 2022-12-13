import { NodeHtmlMarkdown } from '../../src';


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

      expect(translate(`<p><${tag}> &nbsp;Label:&nbsp; </${tag}>Value</p>`)).toBe(` ${delim}Label:${delim} Value`);
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

  // See: https://github.com/crosstype/node-html-markdown/issues/16
  // See: https://github.com/crosstype/node-html-markdown/issues/21
  test(`Handles whitespace with single space`, () => {
    const res = translate(`<span>test</span>  <span>test2 </span>\n<span>test3</span>\r\n\r\n\t\t\t<span>test4</span>\t<span>test5\r\n\n\n\t\ttest6</span>`);
    expect(res).toBe(`test test2 test3 test4 test5 test6`);
  });

  // See: https://github.com/crosstype/node-html-markdown/issues/19
  test(`Childless nodes visited if preserveIfEmpty set`, () => {
    const html = `<span>Hello</span><iframe src="https://radio4000.com"/><span>World</span>`;

    let res = NodeHtmlMarkdown.translate(html, void 0, { iframe: { content:'[iframe]' } });
    expect(res).toBe(`HelloWorld`);

    res = NodeHtmlMarkdown.translate(html, void 0, { iframe: { content:'[iframe]', preserveIfEmpty: true } });
    expect(res).toBe(`Hello[iframe]World`);
  });

  // See: https://github.com/crosstype/node-html-markdown/issues/20
  // See: https://github.com/crosstype/node-html-markdown/issues/22
  test(`Code blocks preserve whitespace & decode entities`, () => {
    const html =
      `<pre><code><span><span class="comment">// &gt; Get URL Path</span></span>\n` +
      `<span><span class="declaration">function getURL(s: string): string {\n</span></span>` +
      `<span>    <span class="return">return</span> \`https://myurl.com/\${s}\`;</span>\n` +
      `<span>}</span>` +
      `</pre></code>`;
    const expected =
      '```\n' +
      `// > Get URL Path\n` +
      `function getURL(s: string): string {\n` +
      `    return \`https://myurl.com/\${s}\`;\n` +
      `}\n` +
      '```';

    const res = translate(html);
    expect(res).toBe(expected);
  });
});

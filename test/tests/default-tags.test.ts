// noinspection HtmlUnknownTarget
import { NodeHtmlMarkdown } from '../../src';


/* ****************************************************************************************************************** *
 * Tests
 * ****************************************************************************************************************** */

describe(`Default Tags`, () => {
  let instance: NodeHtmlMarkdown;
  const translate = (html: string) => instance.translate(html);

  beforeAll(() => {
    instance = new NodeHtmlMarkdown();
  });

  test(`Line Break (br)`, () => {
    const res = translate(`a<br>b`);
    expect(res).toBe(`a  \nb`);
  });

  test(`Horizontal Rule (hr)`, () => {
    const res = translate(`a<hr>b`);
    expect(res).toBe(`a\n\n---\n\nb`);
  });

  test(`Bold (b, strong)`, () => {
    const res = translate(`<b>a<del>b</del><br><br>c<br>d</b><strong>a<del>b</del><br><br>c<br>d</strong>`);
    const exp = `**a~~b~~** \n  \n**c** \n**d**`;
    expect(res).toBe(exp + ' ' + exp);
  });

  test(`Strikethrough (del, s, strike)`, () => {
    const res = translate(`<del>a<em>b</em><br><br>c<br>d</del><s>a<em>b</em><br><br>c<br>d</s><strike>a<em>b</em><br><br>c<br>d</strike>`);
    const exp = `~~a_b_~~ \n  \n~~c~~ \n~~d~~`;
    expect(res).toBe(exp + ' ' + exp + ' ' + exp);
  });

  test(`Italic / Emphasis (em, i)`, () => {
    const res = translate(`<em>a <s>b</s><br><br>c<br>d</em><i>a <s>b</s><br><br>c<br>d</i>`);
    const exp = `_a ~~b~~_ \n  \n_c_ \n_d_`;
    expect(res).toBe(exp + ' ' + exp);
  });

  test(`Link (a)`, () => {
    const url = 'http://www.github.com/crosstype';
    const specialUrl = 'http://www.github.com/crosstype/**/_test(123)';
    const encodedSpecialUrl = 'http://www.github.com/crosstype/%2A%2A/%5Ftest%28123%29';
    const res = translate(`
        <a href="${url}">a<br><br>b<strong>c</strong></a>
        <a>a<strong>b</strong></a> <!-- This node is treated as text due to no href -->
        <a href="${url}">${url}</a>
        <!-- see: https://github.com/crosstype/node-html-markdown/issues/25 -->
        <a href="${url}">a<a href="2">nested</a><img src="${url}">b</a>
        <b><i><a href="${specialUrl}" title="a">b</a></i></b>
    `);
    expect(res).toBe(`[a b**c**](${url}) a**b** <${url}> [a](${url})[nested](2)![](${url})b **_[b](${encodedSpecialUrl} "a")_** `);
  });

  test(`Image (img)`, () => {
    const url = `http://www.github.com/crosstype/`
    const res = translate(`
        <img src="${url}1">
        <img title="t2" alt="a2"> <!-- This node is elided due to no href -->
        <img src="${url}3" title="t3">
        <img src="${url}4" title="t4" alt="a4">
        <img src="data:image/gif;base64,R/"><!-- This node is elided due to default option keepDataImages = false -->
    `);
    expect(res).toBe(`![](${url}1)` + ` ![](${url}3 "t3")` + ` ![a4](${url}4 "t4") `);
  });

  test(`Pre-formatted Text (pre)`, () => {
    const str = `*   test \t\n1. test\n\\Test`;
    const res = translate(`<pre>${str}<br><b># hello</b></pre>`);
    expect(res).toBe(str + '  \n**# hello**');
  });

  test(`Block Quote (blockquote)`, () => {
    const res = translate(`<blockquote>a<br>b<br>c<blockquote>def</blockquote>`);
    expect(res).toBe(`> a  \n> b  \n> c\n> \n>> def`);
  });

  test(`Headings (h1, h2, h3, h4, h5, h6)`, () => {
    const res = translate(
      `<h1>a<b>b</b></h1><h2>a<b>b</b></h2><h3>a<b>b</b></h3><h4>a<b>b</b></h4><h5>a<b>b</b></h5><h6>a<b>b</b></h6>`
    );
    expect(res).toBe(Array.from(Array(6), (v, i) => `#`.repeat(i + 1) + ` a**b**\n\n`).join('').trim());
  });

  test(`Code (code)`, () => {
    const res = translate('<code>```` a    \n\nb\n* c</code><code>d</code>');
    expect(res).toBe('````` ```` a b * c ````` `d`');
  });

  describe(`Code-block (pre + code)`, () => {
    const str = `* test  \n\n1. test\n\\Test`;

    test(`Fenced`, () => {
      const res = translate(`<pre><code class="language-fortran">${str}</code></pre><pre><code>${str}</code></pre>`);
      expect(res).toBe('```fortran\n' + str + '\n```\n\n```\n' + str + '\n```');
    });

    test(`Indented`, () => {
      const originalCodeFence = instance.options.codeBlockStyle;
      instance.options.codeBlockStyle = 'indented';

      const res = translate(`<pre><code class="language-fortran">${str}</code></pre><pre><code>${str}</code></pre>`);
      const exp = str.replace(/^/gm, '    ');
      expect(res).toBe(exp + '\n\n' + exp);

      instance.options.codeFence = originalCodeFence;
    });
  });

  describe(`Lists (ol + li, ul + li)`, () => {
    test(`Multi-level Ordered List`, () => {
      const res = translate(`
        <ol>
          <li>a<br><br><s>b</s></li>
          <li> </li> <!-- Elided due to whitespace -->
          <li>b
            <ol><li>c<br>d</li></ol>
            <ul><li>e<br>f</li></ul>
          </li>
        </ol>
      `);
      expect(res).toBe(`1. a  \n    \n~~b~~\n2. b  \n   1. c  \n   d  \n   * e  \n   f`);
    });

    test(`Multi-level Unordered List`, () => {
      const res = translate(`
        <ul>
          <li>a<br><br><s>b</s></li>
          <li> </li> <!-- Elided due to whitespace -->
          <li>b
            <ul><li>c<br>d</li></ul>
            <ol><li>e<br>f</li></ol>
          </li>
        </ul>
      `);
      expect(res).toBe(`* a  \n    \n~~b~~\n* b  \n   * c  \n   d  \n   1. e  \n   f`);
    });

    test(`List item with block content`, () => {
      const res = translate(`<li><div><img src="hello.jpg"></div>a`);
      expect(res).toBe(`* ![](hello.jpg)  \na`);
    });
  });
});

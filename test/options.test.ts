// noinspection RegExpUnnecessaryNonCapturingGroup,HtmlUnknownTarget

import { NodeHtmlMarkdown } from '../src';


/* ****************************************************************************************************************** *
 * Options Tests
 * ****************************************************************************************************************** */

describe(`Options`, () => {
  let instance: NodeHtmlMarkdown;
  const translate = (html: string) => instance.translate(html);
  beforeAll(() => {
    instance = new NodeHtmlMarkdown();
  });

  test(`codeFence`, () => {
    const originalCodeFence = instance.options.codeFence;
    const str = `* test  \n\n1. test\n\\Test`;
    const html = `<pre><code class="language-fortran">${str}</code></pre>`;

   const resDefaultFence = translate(html);
    expect(resDefaultFence).toBe('```fortran\n' + str + '\n```');

    instance.options.codeFence = `+++++`;
    const resFencePlus = translate(html);
    expect(resFencePlus).toBe('+++++fortran\n' + str + '\n+++++');

    instance.options.codeFence = `?`;
    const resFence1Char = translate(html);
    expect(resFence1Char).toBe('?fortran\n' + str + '\n?');

    instance.options.codeFence = originalCodeFence;
  });

  test(`bulletMarker`, () => {
    const originalBulletMarker = instance.options.bulletMarker;
    const html = `<ul><li>item1</li><li>item2</li></ul>`;

    const resDefaultMarker = translate(html);
    expect(resDefaultMarker).toBe(`* item1
* item2`);

    instance.options.bulletMarker = '-';
    const resDashMarker = translate(html);
    expect(resDashMarker).toBe(`- item1
- item2`);

    instance.options.bulletMarker = '<->';
    const resWideMarker = translate(html);
    expect(resWideMarker).toBe(`<-> item1
<-> item2`);
    instance.options.bulletMarker = originalBulletMarker;
  });

  test(`codeBlockStyle`, () => {
    const originalCodeFence = instance.options.codeBlockStyle;
    const html = `<pre><code>line1\nline2</code></pre>`;

    instance.options.codeBlockStyle = 'fenced';
    const resFenced = translate(html);
    expect(resFenced).toBe('```\nline1\nline2\n```');

    instance.options.codeBlockStyle = 'indented';
    const resIndented = translate(html);
    expect(resIndented).toBe('line1\nline2'.replace(/^/gm, '    '));

    instance.options.codeFence = originalCodeFence;
  });

  test(`emDelimiter`, () => {
    const originalEmDelimiter = instance.options.emDelimiter;
    const html = `<em>some text</em><em>more text</em>`;

    const resDefaultEmDelimiter = translate(html);
    expect(resDefaultEmDelimiter).toBe(`_some text_ _more text_`);

    instance.options.emDelimiter = '|';
    const resShortEmDelimiter = translate(`<em>some text</em><em>more text</em>`);
    expect(resShortEmDelimiter).toBe(`|some text| |more text|`);

    instance.options.emDelimiter = '+++';
    const resWideEmDelimiter = translate(`<em>some text</em><em>more text</em>`);
    expect(resWideEmDelimiter).toBe(`+++some text+++ +++more text+++`);
    instance.options.emDelimiter = originalEmDelimiter;
  });

  test(`strongDelimiter`, () => {
    const originalStrongDelimiter = instance.options.strongDelimiter;
    const html = `<strong>some text</strong><strong>more text</strong>`;

    const resDefaultStrongDelimiter = translate(html);
    expect(resDefaultStrongDelimiter).toBe(`**some text** **more text**`);

    instance.options.strongDelimiter = '|';
    const resShortStrongDelimiter = translate(html);
    expect(resShortStrongDelimiter).toBe(`|some text| |more text|`);

    instance.options.strongDelimiter =  '+++';
    const resWideStrongDelimiter = translate(html);
    expect(resWideStrongDelimiter).toBe(`+++some text+++ +++more text+++`);
    instance.options.strongDelimiter = originalStrongDelimiter;
  });


  test(`strikeDelimiter`, () => {
    const originalStrikeDelimiter = instance.options.strikeDelimiter;
    const html = `<strike>some text</strike><s>more text</s><del>one more text</del>`;

    const resDefaultStrikeDelimiter = translate(html);
    expect(resDefaultStrikeDelimiter).toBe(`~~some text~~ ~~more text~~ ~~one more text~~`);

    instance.options.strikeDelimiter = '~';
    const resShortStrikeDelimiter = translate(html);
    expect(resShortStrikeDelimiter).toBe(`~some text~ ~more text~ ~one more text~`);

    instance.options.strikeDelimiter =  '+++';
    const resWideStrikeDelimiter = translate(html);
    expect(resWideStrikeDelimiter).toBe(`+++some text+++ +++more text+++ +++one more text+++`);
    instance.options.strikeDelimiter = originalStrikeDelimiter;
  });

  test(`ignore`, () => {
    const strongEmHTML = `<strong>some text</strong><em>more text</em>`;

    const instanceIgnore = new NodeHtmlMarkdown({
      ignore: ['STRONG']
    });
    const resNoStrong = instanceIgnore.translate(strongEmHTML);
    expect(resNoStrong).toBe(`_more text_`);

    const instanceIgnoreEm = new NodeHtmlMarkdown({
      ignore: ['EM']
    });
    const resNoEm = instanceIgnoreEm.translate(strongEmHTML);
    expect(resNoEm).toBe(`**some text**`);

    const instanceIgnoreBoth = new NodeHtmlMarkdown({
      ignore: ['EM', 'STRONG']
    });
    const resNoEmStrong = instanceIgnoreBoth.translate(strongEmHTML);
    expect(resNoEmStrong).toBe(``);

    const instanceIgnoreMiss = new NodeHtmlMarkdown({
      ignore: ['UL', 'H1']
    });
    const resWithAll = instanceIgnoreMiss.translate(strongEmHTML);
    expect(resWithAll).toBe(`**some text**_more text_`);
  });

  test(`blockElements`, () => {
    const html = `<em>x</em><strong>yyy</strong><em>x</em><span>text</span>`;
    const instanceStrongBlock = new NodeHtmlMarkdown({
      blockElements: ['STRONG']
    });
    const resStrongBlock = instanceStrongBlock.translate(html);
    expect(resStrongBlock).toBe(`_x_

**yyy**

_x_text`);

    const instanceEmBlock = new NodeHtmlMarkdown({
      blockElements: ['EM']
    });
    const resEmBlock = instanceEmBlock.translate(html);
    expect(resEmBlock).toBe(`_x_

**yyy**

_x_

text`);
  });

  test(`maxConsecutiveNewlines`, () => {
    const originalMaxConsecutiveNewlines = instance.options.maxConsecutiveNewlines;
    const html = `<b>text</b>${'<br/>'.repeat(10)}<em>something</em>`;

    const resDefaultMaxNewLines = translate(html);
    expect(resDefaultMaxNewLines).toBe(`**text**${'  \n'.repeat(3)}_something_`);

    instance.options.maxConsecutiveNewlines = 5;
    const res5MaxNewLines = translate(html);
    expect(res5MaxNewLines).toBe(`**text**${'  \n'.repeat(5)}_something_`);

    instance.options.maxConsecutiveNewlines = 10;
    const res10MaxNewLines = translate(html);
    expect(res10MaxNewLines).toBe(`**text**${'  \n'.repeat(10)}_something_`);

    instance.options.maxConsecutiveNewlines = originalMaxConsecutiveNewlines;
  });

  test(`lineStartEscape`, () => {
    const originalLineStartEscape = instance.options.lineStartEscape;

    const resEscapedPlus = translate(`<p>text<br>+ text<br>+ more text</p>`);
    expect(resEscapedPlus).toBe("text  \n\\+ text  \n\\+ more text");

    const resEscapedQuote = translate(`<p>text<br>> text<br>> more text</p>`);
    expect(resEscapedQuote).toBe("text  \n\\> text  \n\\> more text");

    // No escape for +
    instance.options.lineStartEscape = [/^(\s*?)((?:[=>-])|(?:#{1,6}\s))|(?:(\d+)(\.\s))/gm, '$1$3\\$2$4'];

    const resNotEscapedPlus = translate(`<p>text<br>+ text<br>+ more text</p>`);
    expect(resNotEscapedPlus).toBe("text  \n+ text  \n+ more text");

    // No escape also for >
    instance.options.lineStartEscape = [/^(\s*?)((?:#{1,6}\s))|(?:(\d+)(\.\s))/gm, '$1$3\\$2$4'];

    const resNotEscapedQuote = translate(`<p>text<br>> text<br>> more text</p>`);
    expect(resNotEscapedQuote).toBe("text  \n> text  \n> more text");

    instance.options.lineStartEscape = originalLineStartEscape;
  });

  test(`globalEscape`, () => {
    const originalGlobalEscape = instance.options.globalEscape;

    const resEscapedStar = translate(`<strong>text**text</strong>`);
    expect(resEscapedStar).toBe("**text\\*\\*text**");

    // No escape for star
    instance.options.globalEscape = [ /[_~\[\]]/gm, '\\$&' ];

    const resNotEscapedStar = translate(`<i>text**text</i>`);
    expect(resNotEscapedStar).toBe("_text**text_");

    const resEscapedBrackets = translate(`<h1>title [more words]</h1>`);
    expect(resEscapedBrackets).toBe("# title \\[more words\\]");

    // No escape also for brackets
    instance.options.globalEscape = [ /[_~]/gm, '\\$&' ];
    const resNotEscapedBrackets = translate(`<h1>title [more words]</h1>`);
    expect(resNotEscapedBrackets).toBe("# title [more words]");

    instance.options.globalEscape = originalGlobalEscape;
  });

  test(`textReplace`, () => {
    const originalReplace = instance.options.textReplace;

    instance.options.textReplace = [[/abc/g, "xyz"]];
    const replaced = translate('<h1>hello abc</h1>');
    expect(replaced).toBe(`# hello xyz`);

    instance.options.textReplace = [[/hello/g, "X"]];
    const replaced2 = translate('<h1>hello abc</h1>');
    expect(replaced2).toBe(`# X abc`);

    instance.options.textReplace = originalReplace;
  });

  test(`keepDataImages`, () => {
    const originalKeepDataImages = instance.options.keepDataImages;

    instance.options.keepDataImages = true;
    const resKeep = translate(`<img alt="normal" src="normal_img.jpg">
      <img src="data:image/gif;base64,R0lGODlhEA"/>`);
    expect(resKeep).toBe(`![normal](normal_img.jpg) ![](data:image/gif;base64,R0lGODlhEA)`);

    instance.options.keepDataImages = false;
    const resNoKeep = translate(`<img alt="normal" src="normal_img.jpg">
      <img src="data:image/gif;base64,R0lGODlhEA"/>`);
    expect(resNoKeep).toBe(`![normal](normal_img.jpg) `);

    instance.options.keepDataImages = originalKeepDataImages;
  });

  test(`useLinkReferenceDefinitions`, () => {
    const originalUseLinkReferenceDefinitions = instance.options.useLinkReferenceDefinitions;

    const url = 'http://www.github.com/crosstype';
    const html = `Hello:&nbsp;
        <a href="${url}">a<br><br>b<strong>c</strong></a>
        <a>a<strong>b</strong></a> <!-- This node is treated as text due to no href -->
        <a href="${url}/other">link2</a>
        <a href="${url}">repeat link</a>
        <a href="${url}">${url}</a><!-- inline link -->&nbsp;Goodbye!
    `;

    instance.options.useLinkReferenceDefinitions = false;
    let res = translate(html);
    expect(res).toBe(
      `Hello: [a b**c**](${url}) a**b** [link2](${url}/other) [repeat link](${url}) <${url}> Goodbye!`
    );

    instance.options.useLinkReferenceDefinitions = true;
    res = translate(html);
    expect(res).toBe(
      `Hello: [a b**c**][1] a**b** [link2][2] [repeat link][1] <${url}> Goodbye!\n\n[1]: ${url}\n[2]: ${url}/other`
    );

    instance.options.useLinkReferenceDefinitions = originalUseLinkReferenceDefinitions;
  });

  test(`useInlineLinks`, () => {
    const originalUseInlineLinksDefinitions = instance.options.useInlineLinks;

    const url = 'http://www.github.com/crosstype';
    const html = `Hello:&nbsp;
        <a href="${url}">${url}</a> <!-- inline link -->&nbsp;
        <a>a<strong>b</strong></a> <!-- This node is treated as text due to no href -->
        <a href="${url}/other">link2</a>
        <a href="${url}">repeat link</a> Goodbye!
    `;

    instance.options.useInlineLinks = false;
    let res = translate(html);
    expect(res).toBe(`Hello: [${url}](${url}) a**b** [link2](${url}/other) [repeat link](${url}) Goodbye!`);

    instance.options.useInlineLinks = true;
    res = translate(html);
    expect(res).toBe(
      `Hello: <${url}> a**b** [link2](${url}/other) [repeat link](${url}) Goodbye!`
    );

    instance.options.useLinkReferenceDefinitions = originalUseInlineLinksDefinitions;
  });
});

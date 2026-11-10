import { NodeHtmlMarkdown } from '../src';


/* ****************************************************************************************************************** *
 * Tests
 * ****************************************************************************************************************** */

describe(`Output building`, () => {
  let instance: NodeHtmlMarkdown;
  beforeAll(() => {
    instance = new NodeHtmlMarkdown();
  });

  test.each([
    [ `whitespace before any output`, '  \n <p>a</p>', 'a' ],
    [ `whitespace run longer than the lookback (pre)`, '<pre>a\n\n\n\n\n\n\n\n\n\n\n\n\n\nb</pre><p>c</p>', 'a\n\n\nb\n\nc' ],
    [ `whitespace run longer than the lookback (br)`, 'a<br><br><br><br><br><br><br><br><br><br><br><br><h1>b</h1>', 'a  \n  \n  \n# b' ],
    [ `repeating char after a removed node`, '<em>a</em><em> </em><em>b</em>', '_a_ _b_' ],
    [ `removed node at the start`, '<strong></strong>a<em></em>b', 'ab' ],
    [ `removed node with nothing after it`, '<em> </em>a', 'a' ],
    [ `removed list item between items`, '<ul><li>a</li><li>b</li><li> </li><li>c</li></ul>', '* a\n* b\n* c' ],
    [ `removed nested and outer list items`, '<p>x</p><ul><li>a<ul><li> </li></ul></li><li> </li><li>b</li></ul>', 'x\n\n* a\n* b' ],
    [ `removed node inside a removed node`, '<strong><em> </em></strong>c', 'c' ],
    [ `removed node inside a kept node`, '<blockquote>q<em> </em>r</blockquote>', '> qr' ],
    [ `postprocess content spanning several parts`, '<em>a <s>b</s><br>c</em>', '_a ~~b~~_ \n_c_' ],
  ])(`%s`, (_, html, expected) => {
    expect(instance.translate(html)).toBe(expected);
  });
});

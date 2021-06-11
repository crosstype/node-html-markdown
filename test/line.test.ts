import { NodeHtmlMarkdown } from '../src';


/* ****************************************************************************************************************** *
 * Tests: For a single line HTML string
 * ****************************************************************************************************************** */

describe(`Single Line HTML`, () => {
  let instance: NodeHtmlMarkdown;
  const translate = (html: string) => instance.translate(html);
  beforeAll(() => {
    instance = new NodeHtmlMarkdown();
  });

  test(`Emphasis (em)`, () => {
    const res = translate(`This is an <em>emphasised</em> tag.`);
    expect(res).toBe(`This is an _emphasised_ tag.`);
  });
})

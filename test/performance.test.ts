import { NodeHtmlMarkdown } from '../src';


/* ****************************************************************************************************************** *
 * Config
 * ****************************************************************************************************************** */

const sentence = 'Paragraph text about rivers, mountains and the quiet craft of reading slowly. ';
const paragraph = `<p>${sentence.repeat(2)}<em>${sentence}</em><a href="https://example.com/x">${sentence}</a></p>`;

const createLargeDocument = (chapters: number, paragraphsPerChapter: number) =>
  Array.from({ length: chapters }, (_, i) => `<h2>Chapter ${i + 1}</h2>${paragraph.repeat(paragraphsPerChapter)}`).join('');


/* ****************************************************************************************************************** *
 * Tests
 * ****************************************************************************************************************** */

describe(`Performance`, () => {
  let instance: NodeHtmlMarkdown;
  beforeAll(() => {
    instance = new NodeHtmlMarkdown();
  });

  test(`Translation time scales linearly with document size`, () => {
    const chapters = 10;
    const paragraphsPerChapter = 1200;
    const html = createLargeDocument(chapters, paragraphsPerChapter);
    expect(html.length).toBeGreaterThan(4_000_000);

    const start = Date.now();
    const res = instance.translate(html);
    const elapsedMs = Date.now() - start;

    expect(res.startsWith('## Chapter 1')).toBe(true);
    expect(res.match(/\]\(https:\/\/example\.com\/x\)/g)?.length).toBe(chapters * paragraphsPerChapter);
    expect(elapsedMs).toBeLessThan(5_000);
  }, 60_000);
});

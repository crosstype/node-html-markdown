import { NodeHtmlMarkdown } from '../src'
import * as fs from 'fs';
import * as path from 'path';

/* ****************************************************************************************************************** *
 * Tests
 * ****************************************************************************************************************** */

describe(`Render`, () => {
  let nhm:NodeHtmlMarkdown;
  beforeAll(() => {
    nhm = new NodeHtmlMarkdown();
  });

  test(`Outputs proper Markdown`, () => {
    const html = fs.readFileSync(path.join(__dirname, 'assets/guide.html'), 'utf8');
    const res = nhm.translate(html);
    const expected = fs.readFileSync(path.join(__dirname, 'assets/guide.md'), 'utf8').trim();

    expect(res).toEqual(expected);
  });
});

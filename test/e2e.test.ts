import { NodeHtmlMarkdown } from '../src';
import { DOMParser } from 'linkedom';


const html = `<html><body><p><b>F</b><span>oo</span></p><ul><li>Bar</li></ul></body></html>`;

describe('E2E', () => {
  test('Browser', () => {
    __IS_BROWSER__ = true;
    globalThis.DOMParser = <typeof globalThis.DOMParser>DOMParser;
    const res = new NodeHtmlMarkdown({
      preferNativeParser: true
    }).translate(html);
    expect(res).toBe(`**F**oo\n\n* Bar`);
  });
});

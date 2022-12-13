import { parseHTML } from '../../src/utilities';
import { defaultOptions } from '../../src/config';
import { DOMParser } from 'linkedom';


describe('parseHTML', () => {
  test('should parse HTML with native parser in browser', () => {
    __IS_BROWSER__ = true;
    globalThis.DOMParser = <typeof globalThis.DOMParser>DOMParser;

    try {
      const html = '<div>test</div>';
      const parsedHtml = parseHTML(html, { ...defaultOptions, preferNativeParser: true });

      expect(parsedHtml).toBeDefined();
    } finally {
      __IS_BROWSER__ = false;
      globalThis.DOMParser = <typeof globalThis.DOMParser><unknown>undefined;
    }
  });

  test('should parse HTML in node when preferNativeParser is true', () => { // This test fails
    const html = '<div>test</div>';
    const parsedHtml = parseHTML(html, { ...defaultOptions, preferNativeParser: true });

    expect(parsedHtml).toBeDefined();
  });

  test('should parse HTML in node when preferNativeParser is false', () => {
    const html = '<div>test</div>';
    const parsedHtml = parseHTML(html, defaultOptions);

    expect(parsedHtml).toBeDefined();
  });
});

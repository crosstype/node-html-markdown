import { NodeHtmlMarkdown } from '../src';


/* ****************************************************************************************************************** *
 * Tests
 * ****************************************************************************************************************** */

describe(`Special Cases`, () => {
  let instance: NodeHtmlMarkdown;
  const translate = (html: string) => instance.translate(html);
  beforeAll(() => {
    instance = new NodeHtmlMarkdown();
  });

  test(`Removes uncaught Doctype`, () => {
    const res = translate(`<!DOCTYPE html>abc`);
    expect(res).toBe(`abc`);
  });
});

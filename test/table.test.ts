import { NodeHtmlMarkdown } from '../src';


/* ****************************************************************************************************************** *
 * Tests
 * ****************************************************************************************************************** */

describe(`Table`, () => {
  let instance: NodeHtmlMarkdown;
  const translate = (html: string) => instance.translate(html);
  beforeAll(() => {
    instance = new NodeHtmlMarkdown();
  });

  test(`Single row, Single column table`, () => {
    const expected = `| col1 |\n| ---- |`;

    expect(translate(`<table><tr><th>  col1 </th></tr></table>`)).toBe(expected);
    expect(translate(`<table><tr><td>  col1 </td></tr></table>`)).toBe(expected);
    expect(translate(`<table><td>  col1 </td></table>`)).toBe(expected);
  });

  test(`Single row table`, () => {
    const expected = `| col1 | col2 |\n| ---- | ---- |`;

    expect(translate(`<table><tr><th>  col1 </th><td>col2  </td></tr></table>`)).toBe(expected);
    expect(translate(`<table><tr><td>  col1 </td><td>col2  </td></table>`)).toBe(expected);
    expect(translate(`<table><td>  col1 </td><td>col2  </td></table>`)).toBe(expected);
  });

  test(`Table with caption`, () => {
    const expected =
      `__Hello__\n` +
      `| col1 | col2 |\n` +
      `| ---- | ---- |`;

    expect(translate(`<table><caption>Hello</caption><tr><th>  col1 </th><td>col2  </td></tr></table>`)).toBe(expected);
    expect(translate(`<table><th>  col1 </th><td>col2  </td><caption>Hello</caption></table>`)).toBe(expected);
  });

  describe(`Special Cases`, () => {
    test(`"|" is escaped`, () => {
      expect(translate(`<table><tr><td>A|B</td></tr></table>`)).toBe(`| A\\|B |\n| ---- |`);
    });

    test(`Pads cells`, () => {
      const html = `<table>
        <tr><td>abc</td><td>def</td><td>ghi</td></tr>
        <tr><td>abc1</td><td>def123</td><td>ghi1234567</td></tr>
        <tr><td>a</td><td>def1234</td><td>c</td></tr>
      </table>`;
      const expected =
        `| abc  | def     | ghi        |\n` +
        `| ---- | ------- | ---------- |\n` +
        `| abc1 | def123  | ghi1234567 |\n` +
        `| a    | def1234 | c          |`;

      expect(translate(html)).toBe(expected);
    });

    test(`Nested tables are not supported`, () => {
      const html = `<table><tr><td><table><tr><td>nested</td></tr></table></td><td>abc</td></tr></table>`;
      expect(translate(html)).toBe(`| nested | abc |\n| ------ | --- |`);
    });

    test(`Supports inline tags + mismatched rows`, () => {
      const html = `
      <table>
        <thead>
          <tr>
            <th>COL1</th>
            <th>C
            O
            L2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th><b>b</b></th>
            <td><i>i</i></td>
            <td><a href="link">a</a></td>
            <td><img src="file"></td>
          </tr>
          <tr>
            <th><ul><li>list</li><li></li></ul></th>
            <td><hr></td>
            <td><h1>h1</h1></td>
          </tr>
        </tbody>
      </table>
    `;

      const expected =
        `| COL1  | C O L2 |           |           |\n` +
        `| ----- | ------ | --------- | --------- |\n` +
        `| **b** | _i_    | [a](link) | ![](file) |\n` +
        `| list  |        | h1        |           |`;

      expect(translate(html)).toBe(expected);
    });

    test(`Empty Cells`, () => {
      const html = `<table>
        <tr><td>abc</td><td>def</td><td>ghi</td></tr>
        <tr><td></td><td></td><td>ghi1234567</td></tr>
        <tr><td>abc1</td><td>def1234</td><td>c</td></tr>
      </table>`;
      const expected =
        `| abc  | def     | ghi        |\n` +
        `| ---- | ------- | ---------- |\n` +
        `|      |         | ghi1234567 |\n` +
        `| abc1 | def1234 | c          |`;
      const result = translate(html);
      expect(result).toBe(expected);
    });
  });
});

import * as child_process from 'child_process';
import path from 'path';
import * as fs from 'fs';


/* ****************************************************************************************************************** */
// region: Config
/* ****************************************************************************************************************** */

const expectedMarkdownPath = path.resolve(__dirname, `../assets/demo-expected.md`);
const projectsPath = path.resolve(__dirname, '../projects');

// endregion


/* ****************************************************************************************************************** *
 * Built Targets Tests
 * ****************************************************************************************************************** */

describe('Built Targets', () => {
  const expectedMarkdown = fs.readFileSync(expectedMarkdownPath, 'utf8');

  test(`ESM works properly`, () => {
    const res = child_process.execSync(`node ${path.join(projectsPath, 'esm/index.js')}`);
    expect(res.toString('utf8')).toBe(expectedMarkdown);
  });

  test(`CJS works properly`, () => {
    const res = child_process.execSync(`node ${path.join(projectsPath, 'cjs/index.js')}`);
    expect(res.toString('utf8')).toBe(expectedMarkdown);
  });

  // TODO - use jest-puppeteer
  test.todo(`Browser works properly`);
});

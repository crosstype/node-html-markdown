import { NodeHtmlMarkdown } from 'node-html-markdown';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


/* ****************************************************************************************************************** */
// region: Locals
/* ****************************************************************************************************************** */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// endregion


/* ****************************************************************************************************************** */
// region: Config
/* ****************************************************************************************************************** */

const htmlFilePath = path.resolve(__dirname, '../../assets/demo.html');

// endregion


/* ****************************************************************************************************************** *
 * Entry
 * ****************************************************************************************************************** */

const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
process.stdout.write(NodeHtmlMarkdown.translate(htmlContent) + '\n');

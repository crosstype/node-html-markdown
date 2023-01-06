const { NodeHtmlMarkdown } = require('node-html-markdown');
const fs = require('fs');
const path = require('path');


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

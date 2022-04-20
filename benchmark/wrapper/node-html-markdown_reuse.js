const { NodeHtmlMarkdown } = require('node-html-markdown');
const nhm = new NodeHtmlMarkdown();

module.exports = function (html, callback) {
  nhm.translate(html);
	callback(null);
};

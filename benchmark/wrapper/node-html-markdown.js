const { NodeHtmlMarkdown } = require('node-html-markdown');

module.exports = function (html, callback) {
  NodeHtmlMarkdown.translate(html);
	callback(null);
};

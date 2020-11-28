const TurndownService = require('turndown');
const td = new TurndownService();

module.exports = function (html, callback) {
  td.turndown(html);
	callback(null);
};

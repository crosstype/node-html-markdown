const TurndownService = require('turndown');

module.exports = function (html, callback) {
  (new TurndownService()).turndown(html);
	callback(null);
};

const { NodeHtmlMarkdown } = require('./dist/index.js');
const nhm = new NodeHtmlMarkdown();
const tests = [
  ['#61: newline before <b>', '1\n<b>2</b>', '1 **2**'],
  ['#34: newline before <em>', 'text\n<em>emphasized</em>', 'text _emphasized_'],
  ['#34: complex', 'The contents of the newly created <code>Buffer</code> are unknown and\n<em>may contain sensitive data</em>.', 'The contents of the newly created `Buffer` are unknown and _may contain sensitive data_.'],
];
let passed = 0;
tests.forEach(([name, html, exp]) => {
  const res = nhm.translate(html);
  const ok = res === exp;
  console.log((ok ? '✓' : '✗') + ' ' + name);
  if (ok) passed++;
});
console.log('\n' + passed + '/' + tests.length + ' passed');

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');

test('CSP and referrer restrict resources without inline exceptions', () => {
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  for (const rule of ["script-src 'self'", "style-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) {
    assert.ok(html.includes(rule));
  }
  assert.doesNotMatch(html, /unsafe-inline|frame-ancestors|\sstyle\s*=|\son\w+\s*=/i);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /<noscript>/);
});

test('tabs, modal, labels, button types, external links, and length bounds', () => {
  assert.match(html, /role="tablist"/);
  for (const tag of html.match(/<button\b[^>]*>/g)) assert.match(tag, /type="button"/);
  for (const tag of html.match(/<[^>]*role="tab"[^>]*>/g)) {
    assert.match(tag, /aria-selected="(?:true|false)"/);
    assert.match(tag, /aria-controls="[^"]+"/);
  }
  assert.equal((html.match(/role="tab"/g) || []).length, 4);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 4);
  assert.match(html, /role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="helpTitle"/);
  for (const match of html.matchAll(/<label[^>]*for="([^"]+)"/g)) assert.ok(html.includes(`id="${match[1]}"`));
  for (const tag of html.match(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(tag, /rel="noopener noreferrer"/);
  for (const tag of html.match(/<textarea\b[^>]*>/g)) assert.match(tag, /maxlength="500"/);
  for (const file of fs.readdirSync(path.join(root, 'js'))) {
    assert.doesNotMatch(read(`js/${file}`), /\.style\.|onclick/);
  }
});

test('all cipher UIs call the shared core without independent rail arithmetic', () => {
  for (const file of ['encrypt', 'decrypt', 'lab']) {
    const source = read(`js/${file}.js`);
    assert.match(source, /RailfenceCore\.(encrypt|decrypt)/);
    assert.doesNotMatch(source, /index = \(index \+ 1\) % railCount|direction = -1/);
  }
});

test('rendering never parses HTML and the unreachable renderer is removed', () => {
  for (const file of fs.readdirSync(path.join(root, 'js'))) {
    assert.doesNotMatch(read(`js/${file}`), /innerHTML|insertAdjacentHTML|html2canvas|document\.write/);
  }
});

test('A-3 sample ciphertext literals are exact', () => {
  const source = read('js/decrypt.js').match(/const decryptSampleTexts = (\{[\s\S]*?\});/)[1];
  const samples = vm.runInNewContext(`(${source})`);
  assert.equal(samples[1], 'Hl r!eowll,od');
  assert.equal(samples[2], 'アゴク\u3000ハキグ\u3000ウスゴジヨマニチシゴ\u3000ロニコエシニュウ');
});

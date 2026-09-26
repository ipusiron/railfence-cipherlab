const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

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

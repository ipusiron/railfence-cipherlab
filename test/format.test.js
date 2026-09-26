const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

const sources = ['style.css', 'index.html', ...fs.readdirSync(path.join(root, 'js')).map(f => `js/${f}`)];
for (const file of [...sources, ...fs.readdirSync(__dirname).map(f => `test/${f}`)]) {
  test(`readable lines: ${file}`, () => {
    fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).forEach((line, i) => {
      assert.ok(Array.from(line).length <= (file === 'index.html' ? 250 : 160), `${file}:${i + 1}`);
    });
  });
}

const minimums = {
  'style.css': 1000,
  'index.html': 400,
  'js/railfence-core.js': 40,
  'js/encrypt.js': 250,
  'js/decrypt.js': 250,
  'js/lab.js': 200,
  'js/i18n.js': 250
};
for (const [file, minimum] of Object.entries(minimums)) {
  test(`source retained: ${file}`, () => {
    assert.ok(fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).length >= minimum);
  });
}

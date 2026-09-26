const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

// Existing sources acquire the maximum-line gate when their migration is complete.
for (const file of ['js/railfence-core.js', 'js/i18n.js', ...fs.readdirSync(__dirname).map(f => `test/${f}`)]) {
  test(`readable lines: ${file}`, () => {
    fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).forEach((line, i) => {
      assert.ok(Array.from(line).length <= 160, `${file}:${i + 1}`);
    });
  });
}

const minimums = {
  'style.css': 1000,
  'index.html': 400,
  'js/railfence-core.js': 40,
  'js/encrypt.js': 250,
  'js/decrypt.js': 250,
  'js/lab.js': 200
};
for (const [file, minimum] of Object.entries(minimums)) {
  test(`source retained: ${file}`, () => {
    assert.ok(fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).length >= minimum);
  });
}

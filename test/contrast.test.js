const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
const colors = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)].map(m => [m[1], m[2]]));
function luminance(hex) {
  return hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
const pairs = [
  ['white', 'primary'], ['primary', 'surface'], ['white', 'hover'],
  ['muted', 'white'], ['muted', 'surface'], ['heading', 'white'],
  ['white', 'success'], ['white', 'error'], ['white', 'purple']
];
for (const [fg, bg] of pairs) {
  test(`E-1 contrast ${fg}/${bg}`, () => {
    const a = luminance(colors[fg]), b = luminance(colors[bg]);
    assert.ok((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5);
  });
}

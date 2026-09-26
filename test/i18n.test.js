const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18n = require('../js/i18n.js');
const root = path.join(__dirname, '..');
const jp = new RegExp('[\\u' + (0x3040).toString(16) + '-\\u' + (0x30ff).toString(16)
  + '\\u' + (0x4e00).toString(16) + '-\\u' + (0x9fff).toString(16)
  + '\\u' + (0xff01).toString(16) + '-\\u' + (0xff60).toString(16) + ']');

test('paired dictionaries have identical keys, nonempty values and matching placeholders', () => {
  assert.deepEqual(Object.keys(i18n.ja), Object.keys(i18n.en));
  for (const key of Object.keys(i18n.ja)) {
    assert.ok(i18n.ja[key].trim() && i18n.en[key].trim(), key);
    assert.equal(jp.test(i18n.en[key]), false, key);
    assert.deepEqual(i18n.ja[key].match(/\{\d+\}/g), i18n.en[key].match(/\{\d+\}/g), key);
  }
});

test('every literal translation reference exists', () => {
  for (const file of fs.readdirSync(path.join(root, 'js'))) {
    const source = fs.readFileSync(path.join(root, 'js', file), 'utf8');
    for (const m of source.matchAll(/i18n\.t\(['"]([^'"]+)['"]/g)) assert.ok(m[1] in i18n.ja, m[1]);
  }
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const m of html.matchAll(/data-i18n(?:-[\w-]+)?="([^"]+)"/g)) assert.ok(m[1] in i18n.ja, m[1]);
});

test('logic has no Japanese literals outside comments and the two Japanese samples', () => {
  for (const file of fs.readdirSync(path.join(root, 'js')).filter(f => f !== 'i18n.js')) {
    const source = fs.readFileSync(path.join(root, 'js', file), 'utf8')
      .replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '')
      .replace(/2: "[^"]+"/g, '');
    assert.equal(jp.test(source), false, file);
  }
});

test('language priority and Japanese browser prefix', () => {
  assert.equal(i18n.resolveLanguage('?lang=en', 'ja', 'ja-JP'), 'en');
  assert.equal(i18n.resolveLanguage('?lang=xx', 'ja', 'en-US'), 'ja');
  assert.equal(i18n.resolveLanguage('', null, 'ja-JP'), 'ja');
  assert.equal(i18n.resolveLanguage('', null, 'fr-FR'), 'en');
  i18n.setLanguage('en');
  assert.equal(i18n.t('message.3', [5, 500]), 'Characters: 5/500');
  i18n.setLanguage('ja');
});

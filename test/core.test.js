const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../js/railfence-core.js');

const japanese = 'アス\u3000ゴゴロクジニ\u3000ヨコハマエキニシグチニ\u3000シュウゴウ';
const rows = [
  ['HELLO', 3, 'sequential', 'HLEOL', '01201'],
  ['HELLO', 3, 'zigzag', 'HOELL', '01210'],
  ['Hello, world!', 3, 'sequential', 'Hl r!eowll,od', '0120120120120'],
  ['Hello, world!', 3, 'zigzag', 'Hoo!el,wrdl l', '0121012101210'],
  [japanese, 3, 'sequential', 'アゴク\u3000ハキグ\u3000ウスゴジヨマニチシゴ\u3000ロニコエシニュウ', '012012012012012012012012012'],
  [japanese, 3, 'zigzag', 'アゴニハニニウスゴロジ\u3000コマキシチ\u3000ュゴ\u3000クヨエグシウ', '012101210121012101210121012'],
  ['WEAREDISCOVEREDRUNATONCE', 3, 'sequential', 'WRIORRANEESVEUTCADCEDNOE', '012012012012012012012012'],
  ['WEAREDISCOVEREDRUNATONCE', 3, 'zigzag', 'WECRUOERDSOEERNTNEAIVDAC', '012101210121012101210121'],
  ['AB😀CD', 3, 'sequential', 'ACBD😀', '01201'],
  ['AB😀CD', 3, 'zigzag', 'ADBC😀', '01210'],
  ['ABCDEFGHIJ', 2, 'sequential', 'ACEGIBDFHJ', '0101010101'],
  ['ABCDEFGHIJ', 2, 'zigzag', 'ACEGIBDFHJ', '0101010101'],
  ['ABCDEFGHIJ', 6, 'sequential', 'AGBHCIDJEF', '0123450123'],
  ['ABCDEFGHIJ', 6, 'zigzag', 'ABJCIDHEGF', '0123454321']
];

for (const [plain, rails, method, cipher, pattern] of rows) {
  test(`A-2 ${plain} / ${rails} / ${method}`, () => {
    assert.equal(core.encrypt(plain, rails, method), cipher);
    assert.equal(core.decrypt(cipher, rails, method), plain);
    assert.equal(core.pattern(Array.from(plain).length, rails, method).join(''), pattern);
  });
}

test('A-3 samples preserve every code point and space', () => {
  assert.equal(core.decrypt('Hl r!eowll,od', 3, 'sequential'), 'Hello, world!');
  assert.equal(core.decrypt('アゴク\u3000ハキグ\u3000ウスゴジヨマニチシゴ\u3000ロニコエシニュウ', 3, 'sequential'), japanese);
});

const cleaning = [
  ['a b,c', false, true, 'a bc'],
  ['a b,c', true, false, 'ab,c'],
  ['a b,c', true, true, 'abc'],
  ['a\nb\r\nc', false, false, 'abc'],
  ['AB😀CD', false, true, 'ABCD'],
  ['cafe\u0301!', false, true, 'cafe\u0301'],
  [japanese, true, false, 'アスゴゴロクジニヨコハマエキニシグチニシュウゴウ'],
  [japanese, false, true, japanese]
];
cleaning.forEach(([text, spaces, symbols, expected], index) => {
  test(`A-4 preprocessing ${index + 1}`, () => assert.equal(core.cleanText(text, spaces, symbols), expected));
});

test('410 round trips, legal rail indices, and two-rail equivalence', () => {
  let count = 0;
  for (let rails = 2; rails <= 6; rails++) {
    for (const method of ['sequential', 'zigzag']) {
      for (let length = 0; length <= 40; length++) {
        const plain = Array.from('A😀あ bc!'.repeat(10)).slice(0, length).join('');
        const cipher = core.encrypt(plain, rails, method);
        assert.equal(core.decrypt(cipher, rails, method), plain);
        assert.ok(core.pattern(length, rails, method).every(r => r >= 0 && r < rails));
        if (rails === 2) assert.equal(cipher, core.encrypt(plain, rails, 'sequential'));
        count++;
      }
    }
  }
  assert.equal(count, 410);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const core = require('../js/railfence-core.js');
const bigrams = require('../js/railfence-bigrams.js');

const japanese = 'アス\u3000ゴゴロクジニ\u3000ヨコハマエキニシグチニ\u3000シュウゴウ';
const key = (rails, method, offset = 0, direction = 'down') => ({ rails, method, offset, direction });

test('A-2 periods, normalization, and patterns', () => {
  assert.deepEqual([core.periodOf(2, 'sequential'), core.periodOf(6, 'sequential'),
    core.periodOf(2, 'zigzag'), core.periodOf(6, 'zigzag')], [2, 6, 2, 10]);
  assert.deepEqual(core.normalizeKey({ rails: 9, method: 'x', offset: -1, direction: 'sideways' }),
    key(6, 'sequential', 5));
  assert.deepEqual(core.normalizeKey(key(1, 'zigzag', 5, 'up')), key(2, 'zigzag', 1, 'up'));
  assert.deepEqual(core.normalizeKey(key(3, 'zigzag', 7)), key(3, 'zigzag', 3));
  const patterns = [
    [key(3, 'zigzag'), '0121012101'], [key(3, 'zigzag', 1), '1210121012'],
    [key(3, 'zigzag', 2), '2101210121'], [key(3, 'zigzag', 0, 'up'), '2101210121'],
    [key(3, 'sequential', 1), '1201201201'], [key(3, 'sequential', 0, 'up'), '2102102102'],
    [key(4, 'zigzag', 3, 'up'), '0123210123']
  ];
  for (const [k, expected] of patterns) assert.equal(core.keyPattern(10, k).join(''), expected);
});

const encryptionRows = [
  ['HELLOWORLD', key(3, 'zigzag'), 'HOLELWRDLO', true],
  ['HELLOWORLD', key(3, 'zigzag', 1), 'LRHLOOLEWD'],
  ['HELLOWORLD', key(3, 'zigzag', 0, 'up'), 'LOELWRDHOL'],
  ['HELLOWORLD', key(3, 'sequential', 2), 'EORLWLHLOD'],
  ['HELLOWORLD', key(4, 'sequential', 0, 'up'), 'LRLOEWDHOL'],
  ['WEAREDISCOVEREDRUNATONCE', key(3, 'zigzag'), 'WECRUOERDSOEERNTNEAIVDAC', true],
  ['Hello, world!', key(5, 'zigzag', 4, 'up'), 'Hoewrl ll,do!'],
  [japanese, key(4, 'zigzag', 2), 'ゴヨニシゴロ\u3000コキシ\u3000ュア\u3000クニハエグニウウスジマチゴ']
];

test('A-3 keyed encryption, decryption, and legacy compatibility', () => {
  for (const [plain, k, cipher, compatible] of encryptionRows) {
    assert.equal(core.encryptKey(plain, k), cipher);
    assert.equal(core.decryptKey(cipher, k), plain);
    if (compatible) assert.equal(core.encryptKey(plain, k), core.encrypt(plain, k.rails, k.method));
  }
});

test('A-4 unique key counts', () => {
  assert.equal(core.allKeys(5, 2, 6, ['sequential', 'zigzag'], false).length, 6);
  assert.equal(core.allKeys(5, 2, 6, ['sequential', 'zigzag'], true).length, 51);
  assert.equal(core.allKeys(13, 2, 6, ['sequential', 'zigzag'], false).length, 9);
  assert.equal(core.allKeys(13, 2, 6, ['sequential', 'zigzag'], true).length, 66);
  assert.equal(core.allKeys(24, 2, 6, ['sequential', 'zigzag'], false).length, 9);
  assert.equal(core.allKeys(24, 2, 6, ['sequential', 'zigzag'], true).length, 66);
  assert.equal(core.allKeys(13, 2, 6, ['sequential'], false).length, 5);
});

test('A-5 permutations and movement', () => {
  const rows = [
    [key(3, 'zigzag'), [0, 2, 4, 3, 1], 1.2, 3, [0, 1, 2, 0, 3]],
    [key(3, 'sequential'), [0, 2, 4, 1, 3], 1.2, 2, [0, 1, 2, 2, 1]],
    [key(3, 'zigzag', 1, 'up'), [1, 0, 2, 4, 3], 0.8, 1, [1, 1, 0, 1, 1]]
  ];
  for (const [k, to, average, max, distances] of rows) {
    assert.deepEqual(core.permutation(5, k), to);
    assert.deepEqual(core.movement(5, k), { distances, average, max });
  }
});

test('A-6 English bigram scores', () => {
  const rows = [
    ['Hello, world!', -2.26], ['Hlo ol!el,wrd', -2.5], ['d!Hello, worl', -2.24],
    ['WEAREDISCOVEREDRUNATONCE', -2.37], ['WECRUOERDSOEERNTNEAIVDAC', -3],
    ['abc', null], [japanese, null], ['the', null], ['THE END', -1.8], ['', null]
  ];
  for (const [text, score] of rows) assert.equal(core.bigramScore(text), score);
});

test('A-7 brute force ranking preserves key order for Japanese', () => {
  const rows = [
    ['Hl r!eowll,od', 9, 'Hello, world!'], ['WECRUOERDSOEERNTNEAIVDAC', 9, 'WEAREDISCOVEREDRUNATONCE'],
    ['Actwtaka ant d', 9, 'Attack at dawn'],
    ['e eb dMeeah  reainttmttodigtmih  ld g', 66, 'Meet me at the old bridge at midnight']
  ];
  for (const [cipher, count, plain] of rows) {
    const results = core.bruteForce(cipher, 2, 6, ['sequential', 'zigzag'], count === 66);
    assert.equal(results.length, count);
    assert.equal(results[0].text, plain);
  }
  const results = core.bruteForce('アゴク　ハキグ　ウスゴジヨマニチシゴ　ロニコエシニュウ',
    2, 6, ['sequential', 'zigzag'], false);
  assert.equal(results.length, 9);
  assert.equal(results[1].text, japanese);
  assert.ok(results.every(result => result.score === null));
});

test('A-8 transposition check and immutable bigram source', () => {
  const dickens = 'It was the best of times, it was the worst of times, it was the age of wisdom, ' +
    'it was the age of foolishness, it was the epoch of belief';
  const cipher = core.encryptKey(dickens, key(4, 'zigzag'));
  const caesar = dickens.replace(/[A-Za-z]/g, char => String.fromCharCode(
    (char <= 'Z' ? 65 : 97) + (char.charCodeAt(0) - (char <= 'Z' ? 65 : 97) + 3) % 26));
  assert.deepEqual(core.transpositionCheck(cipher), { verdict: 'transposition', letters: 103, chi: 51.5 });
  assert.deepEqual(core.transpositionCheck(caesar), { verdict: 'substitution', letters: 103, chi: 981.9 });
  assert.deepEqual(core.transpositionCheck('Hello, world!'), { verdict: 'short', letters: 10, chi: null });
  assert.deepEqual(core.transpositionCheck(japanese), { verdict: 'short', letters: 0, chi: null });
  assert.equal(bigrams.log10x100.length, 729);
  assert.equal(bigrams.total, 1415835);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(bigrams.log10x100)).digest('hex'),
    'fd95bc88a627e1814a4738cf155da0411c374104a879f716939d6aa75113fff4');
});

test('keyed round trips, legacy behavior, and unique permutations', () => {
  let count = 0;
  for (let rails = 2; rails <= 6; rails++) for (const method of ['sequential', 'zigzag']) {
    for (let offset = 0; offset < core.periodOf(rails, method); offset++) for (const direction of ['down', 'up']) {
      for (let length = 0; length <= 30; length++) {
        const plain = Array.from('A😀あ bc!'.repeat(8)).slice(0, length).join('');
        const k = key(rails, method, offset, direction);
        assert.equal(core.decryptKey(core.encryptKey(plain, k), k), plain);
        const perm = core.permutation(length, k).slice().sort((a, b) => a - b);
        assert.deepEqual(perm, Array.from({ length }, (_, index) => index));
        count++;
      }
    }
  }
  assert.ok(count > 0);
  for (let rails = 2; rails <= 6; rails++) for (const method of ['sequential', 'zigzag']) {
    const plain = 'A😀あ bc!';
    assert.equal(core.encryptKey(plain, key(rails, method)), core.encrypt(plain, rails, method));
  }
  const keys = core.allKeys(13, 2, 6, ['sequential', 'zigzag'], true);
  assert.equal(new Set(keys.map(k => core.keyPattern(13, k).join(','))).size, keys.length);
});

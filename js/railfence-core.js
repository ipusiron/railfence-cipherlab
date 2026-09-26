// Pure code-point rail-fence operations shared by every tab.
const RailfenceCore = (() => {
  const BIGRAMS = typeof module !== 'undefined' && module.exports
    ? require('./railfence-bigrams.js') : RailfenceBigrams;
  // Return the zero-based rail for character i.
  function railOf(i, rails, method) {
    if (method === 'zigzag') {
      const cycle = 2 * (rails - 1);
      const k = i % cycle;
      return k < rails ? k : cycle - k;
    }
    return i % rails;
  }

  function pattern(length, rails, method) {
    return Array.from({ length }, (_, i) => railOf(i, rails, method));
  }

  function encrypt(text, rails, method) {
    const chars = Array.from(text);
    const p = pattern(chars.length, rails, method);
    let out = '';
    for (let r = 0; r < rails; r++) for (let i = 0; i < chars.length; i++) if (p[i] === r) out += chars[i];
    return out;
  }

  function decrypt(cipher, rails, method) {
    const chars = Array.from(cipher);
    const p = pattern(chars.length, rails, method);
    const out = new Array(chars.length);
    let k = 0;
    for (let r = 0; r < rails; r++) for (let i = 0; i < chars.length; i++) if (p[i] === r) out[i] = chars[k++];
    return out.join('');
  }

  // Symbol removal preserves spaces and combining marks.
  function cleanText(text, removeSpace, removeSymbol) {
    let s = String(text).replace(/\r?\n/g, '');
    if (removeSpace) s = s.replace(/\s/gu, '');
    if (removeSymbol) s = s.replace(/[^\p{L}\p{N}\p{M}\s]/gu, '');
    return s;
  }

  function periodOf(rails, method) {
    return method === 'zigzag' ? 2 * (rails - 1) : rails;
  }

  function normalizeKey(key) {
    const rails = Math.min(6, Math.max(2, Number(key.rails) || 2));
    const method = key.method === 'zigzag' ? 'zigzag' : 'sequential';
    const period = periodOf(rails, method);
    const offset = ((Number(key.offset) || 0) % period + period) % period;
    return { rails, method, offset, direction: key.direction === 'up' ? 'up' : 'down' };
  }

  function keyPattern(length, key) {
    const k = normalizeKey(key);
    const base = pattern(length + k.offset, k.rails, k.method).slice(k.offset);
    return k.direction === 'up' ? base.map(r => k.rails - 1 - r) : base;
  }

  function encryptKey(text, key) {
    const chars = Array.from(text), p = keyPattern(chars.length, key), k = normalizeKey(key);
    let out = '';
    for (let r = 0; r < k.rails; r++) {
      for (let i = 0; i < chars.length; i++) if (p[i] === r) out += chars[i];
    }
    return out;
  }

  function decryptKey(cipher, key) {
    const chars = Array.from(cipher), p = keyPattern(chars.length, key), k = normalizeKey(key);
    const out = new Array(chars.length);
    let n = 0;
    for (let r = 0; r < k.rails; r++) {
      for (let i = 0; i < chars.length; i++) if (p[i] === r) out[i] = chars[n++];
    }
    return out.join('');
  }

  function permutation(length, key) {
    const p = keyPattern(length, key), k = normalizeKey(key), to = new Array(length);
    let n = 0;
    for (let r = 0; r < k.rails; r++) {
      for (let i = 0; i < length; i++) if (p[i] === r) to[i] = n++;
    }
    return to;
  }

  function movement(length, key) {
    const to = permutation(length, key), d = to.map((j, i) => Math.abs(j - i));
    const sum = d.reduce((a, b) => a + b, 0);
    return {
      distances: d,
      average: length ? Math.round(sum / length * 100) / 100 : 0,
      max: length ? Math.max(...d) : 0
    };
  }

  function allKeys(length, minRails, maxRails, methods, withOffsets) {
    const keys = [], seen = new Set();
    for (let rails = minRails; rails <= maxRails; rails++) for (const method of methods) {
      const period = periodOf(rails, method);
      for (const direction of withOffsets ? ['down', 'up'] : ['down']) {
        for (let offset = 0; offset < (withOffsets ? period : 1); offset++) {
          const key = { rails, method, offset, direction };
          const sig = keyPattern(length, key).join(',');
          if (seen.has(sig)) continue;
          seen.add(sig);
          keys.push(key);
        }
      }
    }
    return keys;
  }

  function bigramScore(text) {
    const s = String(text);
    const letters = (s.match(/[A-Za-z]/g) || []).length;
    const cjk = (s.match(/[\u3040-\u30ff\u4e00-\u9fff]/g) || []).length;
    if (letters < 4 || cjk > letters) return null;
    const t = (' ' + s.toLowerCase() + ' ').replace(/[^a-z]+/g, ' ');
    let sum = 0, n = 0;
    for (let i = 0; i + 1 < t.length; i++) {
      sum += BIGRAMS.log10x100[BIGRAMS.symbols.indexOf(t[i]) * 27 + BIGRAMS.symbols.indexOf(t[i + 1])];
      n++;
    }
    return Math.round(sum / n) / 100;
  }

  function bruteForce(cipher, minRails, maxRails, methods, withOffsets) {
    const len = Array.from(cipher).length;
    return allKeys(len, minRails, maxRails, methods, withOffsets).map((key, order) => {
      const text = decryptKey(cipher, key);
      return { key, text, score: bigramScore(text), order };
    }).sort((a, b) => (b.score ?? -99) - (a.score ?? -99) || a.order - b.order)
      .map(({ order, ...result }) => result);
  }

  const ENGLISH_FREQ = [
    8.167, 1.492, 2.782, 4.253, 12.702, 2.228, 2.015, 6.094, 6.966, 0.153, 0.772,
    4.025, 2.406, 6.749, 7.507, 1.929, 0.095, 5.987, 6.327, 9.056, 2.758, 0.978,
    2.360, 0.150, 1.974, 0.074
  ];
  const MIN_LETTERS = 40, CHI_TRANSPOSITION = 80;

  function transpositionCheck(text) {
    const counts = new Array(26).fill(0);
    for (const ch of String(text).toUpperCase()) {
      const i = ch.charCodeAt(0) - 65;
      if (i >= 0 && i < 26) counts[i]++;
    }
    const n = counts.reduce((a, b) => a + b, 0);
    if (n < MIN_LETTERS) return { verdict: 'short', letters: n, chi: null };
    let chi = 0;
    for (let i = 0; i < 26; i++) {
      const e = ENGLISH_FREQ[i] / 100 * n;
      chi += (counts[i] - e) ** 2 / e;
    }
    chi = Math.round(chi * 10) / 10;
    return { verdict: chi <= CHI_TRANSPOSITION ? 'transposition' : 'substitution', letters: n, chi };
  }

  return {
    railOf, pattern, encrypt, decrypt, cleanText, periodOf, normalizeKey, keyPattern,
    encryptKey, decryptKey, permutation, movement, allKeys, bigramScore, bruteForce,
    ENGLISH_FREQ, MIN_LETTERS, CHI_TRANSPOSITION, transpositionCheck
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = RailfenceCore;

// Pure code-point rail-fence operations shared by every tab.
const RailfenceCore = (() => {
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

  return { railOf, pattern, encrypt, decrypt, cleanText };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = RailfenceCore;

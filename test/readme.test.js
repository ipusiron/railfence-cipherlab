const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const core = require('../js/railfence-core.js');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const docs = ['README.md', 'README.en.md'];
const headings = [
  ["# RailFence CipherLab - レールフェンス暗号学習ツール","# RailFence CipherLab - Rail Fence Cipher Learning Tool"],
  ["## 🌐 デモページ","## 🌐 Live demo"],
  ["## 📸 スクリーンショット","## 📸 Screenshots"],
  ["## 🎯 対象ユーザー（ターゲット）","## 🎯 Intended audience"],
  ["### 🧠 本ツールの特徴がターゲットに訴求する理由","### 🧠 Why these features suit the audience"],
  ["## 📖 レールフェンス暗号について","## 📖 About the Rail Fence cipher"],
  ["### 🎯 概要","### 🎯 Overview"],
  ["### 📜 歴史的背景","### 📜 Historical background"],
  ["### ⚙️ 基本的な仕組み","### ⚙️ How it works"],
  ["### 🔍 使用例と用途","### 🔍 Examples and applications"],
  ["### 🔄 暗号の亜種・バリエーション","### 🔄 Variants"],
  ["### 🔗 他の暗号との関係","### 🔗 Relationship to other ciphers"],
  ["### 🛡️ セキュリティ強度","### 🛡️ Security strength"],
  ["#### 強度の要因","#### Factors affecting strength"],
  ["#### 脆弱性","#### Weaknesses"],
  ["### 🎯 典型的な解読手法","### 🎯 Common cryptanalysis techniques"],
  ["### 💡 教育的価値","### 💡 Educational value"],
  ["### 🎬 フィクションに登場するレールフェンス暗号","### 🎬 The Rail Fence cipher in fiction"],
  ["#### 名探偵コナン「ホテル連続爆破事件」","#### Detective Conan: Hotel Serial Bombing Case"],
  ["## 🔧 主な機能と構成","## 🔧 Main features and organization"],
  ["### 🔐 暗号化タブ","### 🔐 Encrypt tab"],
  ["### 🔓 復号タブ","### 🔓 Decrypt tab"],
  ["### 📚 座学タブ","### 📚 Study tab"],
  ["### 🧪 実験室タブ","### 🧪 Lab tab"],
  ["## 🎮 使い方","## 🎮 How to use"],
  ["### 基本的な操作手順","### Basic workflow"],
  ["### 💡 効果的な学習のコツ","### 💡 Tips for effective learning"],
  ["## ⚠️ 注意事項・制限","## ⚠️ Notes and limitations"],
  ["## 🔧 技術仕様","## 🔧 Technical specifications"],
  ["### フロントエンド技術","### Frontend technologies"],
  ["### 暗号化アルゴリズム","### Encryption algorithms"],
  ["### パフォーマンス","### Performance"],
  ["## 🔬 仕様と既知解答","## 🔬 Specification and known answers"],
  ["## 🎯 ユースケース","## 🎯 Use cases"],
  ["## 🔒 このツールのセキュリティ","## 🔒 Tool security"],
  ["## 🧪 テスト","## 🧪 Tests"],
  ["## 📁 ディレクトリー構造","## 📁 Directory structure"],
  ["## 💻 動作環境","## 💻 Runtime environment"],
  ["## 📄 ライセンス","## 📄 License"],
  ["## 🛠️ このツールについて","## 🛠️ About this tool"],
];

for (const [language, file] of docs.entries()) {
  const text = read(file);
  test(file + ': five known answers and both diagrams match the core', () => {
    const rows = [...text.matchAll(/^\| `([^`]+)` \| (\d+) \| (sequential|zigzag) \| `([^`]+)` \|$/gm)];
    assert.equal(rows.length, 5);
    for (const [, plain, rails, method, cipher] of rows) {
      assert.equal(core.encrypt(plain, Number(rails), method), cipher);
      assert.equal(core.decrypt(cipher, Number(rails), method), plain);
    }
    const section = text.slice(text.indexOf(headings[8][language]), text.indexOf(headings[9][language]));
    assert.match(section, /H \. \. L \./);
    assert.match(section, /H \. \. \. O/);
    assert.match(section, /(?:結果：|Result: )HLEOL/);
    assert.match(section, /(?:結果：|Result: )HOELL/);
    assert.doesNotMatch(text, /多項式\s*vs/);
  });

  test(file + ': all 39 headings match the planned order and hierarchy', () => {
    const actual = text.replace(/\x60{3}[\s\S]*?\x60{3}/g, '').match(/^#{1,4} .+$/gm);
    assert.deepEqual(actual, headings.map(pair => pair[language]));
  });

  test(file + ': documented tree contains every nonignored project file with aligned comments', () => {
    const block = /\x60{3}text\r?\n(railfence-cipherlab\/[\s\S]*?)\x60{3}/.exec(text);
    assert.ok(block);
    const lines = block[1].trimEnd().split(/\r?\n/);
    const parents = [], files = [], columns = new Set();
    for (const line of lines) {
      assert.match(line, /# \S.+/);
      columns.add(line.indexOf('#'));
      const m = /^([│ ]*)(?:├──|└──) (\S+)\s+#/.exec(line);
      if (!m) {
        assert.ok(line.startsWith('railfence-cipherlab/'));
        continue;
      }
      const depth = m[1].length / 4;
      assert.ok(Number.isInteger(depth));
      if (m[2].endsWith('/')) {
        parents[depth] = m[2].slice(0, -1);
        parents.length = depth + 1;
      } else {
        files.push([...parents.slice(0, depth), m[2]].join('/'));
      }
    }
    assert.equal(columns.size, 1);
    const actual = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
      { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
    assert.deepEqual(files.sort(), [...new Set(actual)].sort());
  });

  test(file + ': all five PNG files exist and are referenced', () => {
    const refs = [...text.matchAll(/!\[[^\]]*\]\((assets\/[^)]+\.png)\)/g)].map(m => m[1]).sort();
    const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
      .flatMap(e => e.isDirectory() ? walk(dir + '/' + e.name) : [dir + '/' + e.name]);
    const pngs = walk('assets').filter(f => f.endsWith('.png')).sort();
    assert.equal(refs.length, 5);
    assert.deepEqual(refs, pngs);
    for (const image of refs) assert.ok(fs.statSync(path.join(root, image)).size <= 300 * 1024);
  });
}

test('Japanese YAML keeps baseline identity values and block-list structure', () => {
  const text = read('README.md');
  const block = /<!--\s*---([\s\S]*?)---\s*-->/.exec(text);
  assert.ok(block);
  const previous = execFileSync('git', ['show', 'HEAD:README.md'], { cwd: root, encoding: 'utf8' });
  const expected = {
    id: 'day034', slug: 'railfence-cipherlab', hub: 'true',
    repo_url: '"https://github.com/ipusiron/railfence-cipherlab"',
    demo_url: '"https://ipusiron.github.io/railfence-cipherlab/"'
  };
  for (const [key, value] of Object.entries(expected)) {
    const pattern = new RegExp('^' + key + ': (.+)$', 'm');
    assert.equal(pattern.exec(block[1])[1], value);
    assert.equal(pattern.exec(block[1])[1], pattern.exec(previous)[1]);
  }
  for (const key of ['category_ja', 'category_en', 'tags']) {
    assert.match(block[1], new RegExp('^' + key + ':\\r?\\n  - ', 'm'));
  }
  assert.doesNotMatch(read('README.en.md'), /<!--\s*---/);
  assert.ok(text.startsWith('[English](README.en.md) · 日本語'));
  assert.ok(read('README.en.md').startsWith('English · [日本語](README.md)'));
});

test('ユースケースの「このツールならではの使い方」を railfence-core.js で再計算（日英）', () => {
  const C = require('../js/railfence-core.js');
  const [ja, en] = docs.map(read);
  assert.equal(C.encrypt('WEAREDISCOVERED', 3), 'WRIOREESVEADCED');
  assert.equal(C.decrypt('WRIOREESVEADCED', 3), 'WEAREDISCOVERED');
  assert.equal(C.encrypt('HELLO', 1), 'HELLO');
  const bf = C.bruteForce(C.encrypt('WEAREDISCOVEREDFLEEATONCE', 3), 2, 6, ['standard'], false);
  assert.equal(bf[0].key.rails, 3);
  assert.equal(bf[0].text, 'WEAREDISCOVEREDFLEEATONCE');
  for (const md of [ja, en]) {
    assert.ok(md.includes('WRIOREESVEADCED') && md.includes('WEAREDISCOVEREDFLEEATONCE'));
  }
});

// lab.js - 実験室タブの機能

// DOM読み込み後に初期化
document.addEventListener('DOMContentLoaded', function() {
  initializeLabTab();
});

function initializeLabTab() {
  // 総当たり解読実験のイベントリスナー
  document.getElementById("labCiphertext").addEventListener("input", (e) => {
    const bruteForceBtn = document.getElementById("bruteForceBtn");
    bruteForceBtn.disabled = e.target.value.trim().length === 0;
  });
  
  // 統計実験のイベントリスナー
  document.getElementById("labPlaintext").addEventListener("input", (e) => {
    const statisticsBtn = document.getElementById("statisticsBtn");
    if (statisticsBtn) {
      statisticsBtn.disabled = e.target.value.trim().length === 0;
    }
  });
}

// 総当たり解読実験
function performBruteForce() {
  const ciphertext = document.getElementById("labCiphertext").value;
  const railRange = document.getElementById("labRailRange").value;
  const bothMethods = document.getElementById("labBothMethods").checked;
  const resultsDiv = document.getElementById("bruteForceResults");
  
  if (ciphertext.trim().length === 0) {
    resultsDiv.replaceChildren(uiNode("p", "", i18n.t('message.42')));
    return;
  }
  
  // レール数の範囲を解析
  const [minRails, maxRails] = railRange.split('-').map(n => parseInt(n));
  const methods = bothMethods ? ['sequential', 'zigzag'] : ['sequential'];
  
  resultsDiv.replaceChildren(uiNode("p", "", i18n.t('message.43')));
  
  // 少し遅延を入れてUI更新を反映
  setTimeout(() => {
    const results = [];
    
    for (let railCount = minRails; railCount <= maxRails; railCount++) {
      for (const method of methods) {
        try {
          const decrypted = performSingleDecryption(ciphertext, railCount, method);
          const methodName = method === 'zigzag' ? i18n.t('message.25') : i18n.t('message.26');
          
          results.push({
            railCount,
            method: methodName,
            result: decrypted,
            score: calculateReadabilityScore(decrypted)
          });
        } catch (error) {
          console.error(`Error decrypting with ${railCount} rails, ${method}:`, error);
        }
      }
    }
    
    // 結果を可読性スコアで並び替え
    results.sort((a, b) => b.score - a.score);
    
    displayBruteForceResults(results);
  }, 100);
}

// 単一の復号処理
function performSingleDecryption(text, railCount, method) {
  return RailfenceCore.decrypt(text, railCount, method);
}

// 可読性スコア計算（簡易版）
function calculateReadabilityScore(text) {
  let score = 0;
  
  // 母音の比率をチェック
  const vowels = text.match(/[aeiouAEIOU\u3042\u3044\u3046\u3048\u304a\u30a2\u30a4\u30a6\u30a8\u30aa]/g) || [];
  const vowelRatio = vowels.length / text.length;
  if (vowelRatio >= 0.2 && vowelRatio <= 0.6) score += 30;
  
  // 連続する同じ文字の少なさ
  let consecutiveCount = 0;
  for (let i = 1; i < text.length; i++) {
    if (text[i] === text[i-1]) consecutiveCount++;
  }
  score += Math.max(0, 20 - consecutiveCount * 2);
  
  // 英単語っぽいパターン
  const commonWords = ['the', 'and', 'you', 'that', 'was', 'for', 'are', 'with', 'his', 'they'];
  const lowerText = text.toLowerCase();
  for (const word of commonWords) {
    if (lowerText.includes(word)) score += 10;
  }
  
  // 日本語っぽいパターン
  const hiragana = text.match(/[\u3042-\u3093]/g) || [];
  const katakana = text.match(/[\u30a2-\u30f3]/g) || [];
  const kanji = text.match(/[\u4e00-\u9faf]/g) || [];
  if (hiragana.length > 0 || katakana.length > 0 || kanji.length > 0) {
    score += 15;
  }
  
  // 空白や記号の適度な配置
  const spaces = text.match(/\s/g) || [];
  if (spaces.length > 0 && spaces.length < text.length * 0.3) score += 10;
  
  return score;
}

// 総当たり結果の表示
function displayBruteForceResults(results) {
  const target = document.getElementById("bruteForceResults");
  target.replaceChildren();
  if (!results.length) {
    target.append(uiNode("p", "", i18n.t('message.44')));
    return;
  }
  target.append(uiNode("h4", "", i18n.t('message.45')),
    uiNode("p", "", i18n.t('message.46')));
  const table = uiNode("div", "lab-results-table");
  results.forEach((result, index) => {
    const scoreClass = result.score >= 50 ? "high-score" : result.score >= 30 ? "medium-score" : "low-score";
    const row = uiNode("div", "lab-result-row " + scoreClass);
    row.dataset.resultIndex = index;
    const info = uiNode("div", "lab-result-info");
    info.append(uiNode("strong", "", i18n.t('message.47', [index + 1, result.railCount, result.method])),
      uiNode("span", "lab-score", i18n.t('message.48', [result.score])));
    row.append(info, uiNode("div", "lab-result-text", result.result), createCopyButton(result.result));
    table.append(row);
  });
  target.append(table);
}

// 統計実験
function performStatistics() {
  const plaintext = document.getElementById("labPlaintext").value;
  const resultsDiv = document.getElementById("statisticsResults");
  
  if (plaintext.trim().length === 0) {
    resultsDiv.replaceChildren(uiNode("p", "", i18n.t('message.49')));
    return;
  }
  
  resultsDiv.replaceChildren(uiNode("p", "", i18n.t('message.50')));
  
  setTimeout(() => {
    const statistics = [];
    
    // 各設定で暗号化を実行
    for (let railCount = 2; railCount <= 6; railCount++) {
      for (const method of ['sequential', 'zigzag']) {
        const encrypted = performSingleEncryption(plaintext, railCount, method);
        const methodName = method === 'zigzag' ? i18n.t('message.25') : i18n.t('message.26');
        
        statistics.push({
          railCount,
          method: methodName,
          original: plaintext,
          encrypted: encrypted,
          analysis: analyzeEncryption(plaintext, encrypted)
        });
      }
    }
    
    displayStatisticsResults(statistics);
  }, 100);
}

// 単一の暗号化処理
function performSingleEncryption(text, railCount, method) {
  return RailfenceCore.encrypt(text, railCount, method);
}

// 暗号化の分析
function analyzeEncryption(original, encrypted) {
  const analysis = {};
  
  // 文字分布の変化
  const originalFreq = getCharacterFrequency(original);
  const encryptedFreq = getCharacterFrequency(encrypted);
  
  // エントロピー計算
  analysis.originalEntropy = calculateEntropy(originalFreq);
  analysis.encryptedEntropy = calculateEntropy(encryptedFreq);
  
  // 文字の移動距離
  const movements = [];
  for (let i = 0; i < original.length; i++) {
    const char = original[i];
    const newPos = encrypted.indexOf(char);
    if (newPos !== -1) {
      movements.push(Math.abs(i - newPos));
    }
  }
  
  analysis.avgMovement = movements.length > 0 ? 
    movements.reduce((a, b) => a + b, 0) / movements.length : 0;
  analysis.maxMovement = movements.length > 0 ? Math.max(...movements) : 0;
  
  return analysis;
}

// 文字頻度の計算
function getCharacterFrequency(text) {
  const freq = {};
  for (const char of text) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return freq;
}

// エントロピー計算
function calculateEntropy(frequency) {
  const total = Object.values(frequency).reduce((a, b) => a + b, 0);
  let entropy = 0;
  
  for (const count of Object.values(frequency)) {
    const p = count / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}

// 統計結果の表示
function displayStatisticsResults(statistics) {
  const target = document.getElementById("statisticsResults");
  target.replaceChildren(uiNode("h4", "", i18n.t('message.51')));
  const grid = uiNode("div", "lab-stats-grid");
  statistics.forEach((stat, index) => {
    const card = uiNode("div", "lab-stat-card");
    card.dataset.statIndex = index;
    const header = uiNode("div", "lab-stat-header");
    header.append(uiNode("h5", "", i18n.t('message.52', [stat.railCount, stat.method])));
    const content = uiNode("div", "lab-stat-content");
    content.append(uiNode("p", "", i18n.t('message.53', [stat.encrypted])));
    const metrics = uiNode("div", "lab-stat-metrics");
    const values = [
      [i18n.t('message.54'), stat.analysis.avgMovement.toFixed(1)],
      [i18n.t('message.55'), stat.analysis.maxMovement],
      [i18n.t('message.56'), (stat.analysis.encryptedEntropy - stat.analysis.originalEntropy).toFixed(2)]
    ];
    values.forEach(([label, value]) => {
      const line = uiNode("div", "", label + ": ");
      line.append(uiNode("span", "metric-value", value));
      metrics.append(line);
    });
    content.append(metrics, createCopyButton(stat.encrypted));
    card.append(header, content);
    grid.append(card);
  });
  target.append(grid);

  // Keep the existing first-maximum tie break and movement calculation.
  const avgMovements = statistics.map(s => s.analysis.avgMovement);
  const maxAvgMovement = Math.max(...avgMovements);
  const bestMethod = statistics[avgMovements.indexOf(maxAvgMovement)];
  const summary = uiNode("div", "lab-summary");
  summary.append(
    uiNode("h5", "", i18n.t('message.57')),
    uiNode("p", "", i18n.t('message.58', [bestMethod.railCount, bestMethod.method])),
    uiNode("p", "", i18n.t('message.59', [maxAvgMovement.toFixed(1)])),
    uiNode("p", "", i18n.t('message.60'))
  );
  target.append(summary);
}

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
    const statisticsBtn = document.querySelector("button[onclick='performStatistics()']");
    if (statisticsBtn) {
      statisticsBtn.disabled = e.target.value.trim().length === 0;
    }
  });
}

// 総当たり解読実験
function performBruteForce() {
  const ciphertext = document.getElementById("labCiphertext").value.trim();
  const railRange = document.getElementById("labRailRange").value;
  const bothMethods = document.getElementById("labBothMethods").checked;
  const resultsDiv = document.getElementById("bruteForceResults");
  
  if (ciphertext.length === 0) {
    resultsDiv.innerHTML = '<p style="color: #ff6b6b;">暗号文を入力してください。</p>';
    return;
  }
  
  // レール数の範囲を解析
  const [minRails, maxRails] = railRange.split('-').map(n => parseInt(n));
  const methods = bothMethods ? ['sequential', 'zigzag'] : ['sequential'];
  
  resultsDiv.innerHTML = '<p>🔍 総当たり解読を実行中...</p>';
  
  // 少し遅延を入れてUI更新を反映
  setTimeout(() => {
    const results = [];
    
    for (let railCount = minRails; railCount <= maxRails; railCount++) {
      for (const method of methods) {
        try {
          const decrypted = performSingleDecryption(ciphertext, railCount, method);
          const methodName = method === 'zigzag' ? '方式2（交互）' : '方式1（順次）';
          
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
  const len = text.length;
  let pattern = Array(len).fill(0);
  let index = 0;
  let direction = 1;

  // パターン生成
  for (let i = 0; i < len; i++) {
    pattern[i] = index;
    if (method === "zigzag") {
      if (index === 0) direction = 1;
      else if (index === railCount - 1) direction = -1;
      index += direction;
    } else {
      index = (index + 1) % railCount;
    }
  }

  // レール長計算
  let railLengths = Array(railCount).fill(0);
  for (let i = 0; i < len; i++) {
    railLengths[pattern[i]]++;
  }

  // レールに文字を配置
  let rails = [];
  let pos = 0;
  for (let r = 0; r < railCount; r++) {
    rails[r] = text.slice(pos, pos + railLengths[r]).split("");
    pos += railLengths[r];
  }

  // 復号結果を生成
  let result = "";
  for (let i = 0; i < len; i++) {
    const r = pattern[i];
    if (rails[r] && rails[r].length > 0) {
      result += rails[r].shift();
    }
  }

  return result;
}

// 可読性スコア計算（簡易版）
function calculateReadabilityScore(text) {
  let score = 0;
  
  // 母音の比率をチェック
  const vowels = text.match(/[aeiouAEIOUあいうえおアイウエオ]/g) || [];
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
  const hiragana = text.match(/[あ-ん]/g) || [];
  const katakana = text.match(/[ア-ン]/g) || [];
  const kanji = text.match(/[一-龯]/g) || [];
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
  const resultsDiv = document.getElementById("bruteForceResults");
  
  if (results.length === 0) {
    resultsDiv.innerHTML = '<p style="color: #ff6b6b;">復号結果が得られませんでした。</p>';
    return;
  }
  
  let html = '<h4>📊 総当たり解読結果</h4>';
  html += '<p>可読性スコアが高い順に表示されています：</p>';
  html += '<div class="lab-results-table">';
  
  results.forEach((result, index) => {
    const scoreClass = result.score >= 50 ? 'high-score' : result.score >= 30 ? 'medium-score' : 'low-score';
    html += `
      <div class="lab-result-row ${scoreClass}">
        <div class="lab-result-info">
          <strong>${index + 1}. ${result.railCount}レール・${result.method}</strong>
          <span class="lab-score">スコア: ${result.score}</span>
        </div>
        <div class="lab-result-text">${result.result}</div>
        <button class="copy-btn" onclick="copyToClipboard('${result.result}', event)">📋 コピー</button>
      </div>
    `;
  });
  
  html += '</div>';
  resultsDiv.innerHTML = html;
}

// 統計実験
function performStatistics() {
  const plaintext = document.getElementById("labPlaintext").value.trim();
  const resultsDiv = document.getElementById("statisticsResults");
  
  if (plaintext.length === 0) {
    resultsDiv.innerHTML = '<p style="color: #ff6b6b;">分析したい平文を入力してください。</p>';
    return;
  }
  
  resultsDiv.innerHTML = '<p>📈 統計分析を実行中...</p>';
  
  setTimeout(() => {
    const statistics = [];
    
    // 各設定で暗号化を実行
    for (let railCount = 2; railCount <= 6; railCount++) {
      for (const method of ['sequential', 'zigzag']) {
        const encrypted = performSingleEncryption(plaintext, railCount, method);
        const methodName = method === 'zigzag' ? '方式2（交互）' : '方式1（順次）';
        
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
  // 改行と空白を除去（統計用なのでシンプルに）
  const cleaned = text.replace(/\n/g, "").replace(/\s/g, "");
  
  let railMatrix = Array.from({ length: railCount }, () => 
    Array(cleaned.length).fill(null)
  );
  let index = 0;
  let direction = 1;

  for (let i = 0; i < cleaned.length; i++) {
    railMatrix[index][i] = cleaned[i];
    if (method === "zigzag") {
      if (index === 0) direction = 1;
      else if (index === railCount - 1) direction = -1;
      index += direction;
    } else {
      index = (index + 1) % railCount;
    }
  }

  return railMatrix.flat().filter(c => c !== null).join("");
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
  const resultsDiv = document.getElementById("statisticsResults");
  
  let html = '<h4>📊 統計分析結果</h4>';
  html += '<div class="lab-stats-grid">';
  
  statistics.forEach((stat, index) => {
    html += `
      <div class="lab-stat-card">
        <div class="lab-stat-header">
          <h5>${stat.railCount}レール・${stat.method}</h5>
        </div>
        <div class="lab-stat-content">
          <p><strong>暗号文:</strong> ${stat.encrypted}</p>
          <div class="lab-stat-metrics">
            <div>平均移動距離: <span class="metric-value">${stat.analysis.avgMovement.toFixed(1)}</span></div>
            <div>最大移動距離: <span class="metric-value">${stat.analysis.maxMovement}</span></div>
            <div>エントロピー変化: <span class="metric-value">${(stat.analysis.encryptedEntropy - stat.analysis.originalEntropy).toFixed(2)}</span></div>
          </div>
          <button class="copy-btn" onclick="copyToClipboard('${stat.encrypted}', event)">📋 コピー</button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  // 総合分析
  const avgMovements = statistics.map(s => s.analysis.avgMovement);
  const maxAvgMovement = Math.max(...avgMovements);
  const bestMethodIndex = avgMovements.indexOf(maxAvgMovement);
  const bestMethod = statistics[bestMethodIndex];
  
  html += `
    <div class="lab-summary">
      <h5>📋 分析サマリー</h5>
      <p><strong>最も文字を分散させる設定:</strong> ${bestMethod.railCount}レール・${bestMethod.method}</p>
      <p><strong>平均移動距離:</strong> ${maxAvgMovement.toFixed(1)} 文字</p>
      <p>移動距離が大きいほど、元の文字順序が隠蔽されています。</p>
    </div>
  `;
  
  resultsDiv.innerHTML = html;
}
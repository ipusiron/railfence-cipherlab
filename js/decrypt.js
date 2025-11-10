// decrypt.js - 復号タブの機能

// アニメーション状態管理
let decryptAnimationState = {
  isPlaying: false,
  currentStep: 0,
  intervalId: null,
  railMatrix: null,
  sequence: [],
  ciphertext: ""
};

// DOM読み込み後に初期化
document.addEventListener('DOMContentLoaded', function() {
  initializeDecryptTab();
});

function initializeDecryptTab() {
  // 自動同期機能（オプション）
  // タブ切り替え時に自動で設定同期を実行
  document.querySelector('[data-tab="decrypt"]').addEventListener('click', () => {
    setTimeout(() => {
      checkAndSuggestSync();
    }, 100);
  });

  // 暗号文入力のイベントリスナー
  document.getElementById("ciphertext").addEventListener("input", (e) => {
    const canContinue = updateDecryptWarning(e.target.value);
    updateDecryptButton(e.target.value);
    
    // 文字数制限チェック
    if (!canContinue) {
      // 制限を超えた場合、最後の文字を削除
      e.target.value = e.target.value.slice(0, CHARACTER_LIMITS.HARD_LIMIT);
      updateDecryptWarning(e.target.value);
      updateDecryptButton(e.target.value);
      showToast(e.target, "文字数制限に達しました", "error");
    }
    
    // リアルタイム復号
    if (document.getElementById("decryptRealtimeMode").checked && e.target.value.trim().length > 0) {
      performRealtimeDecryption();
    } else if (e.target.value.trim().length === 0) {
      clearDecryptionDisplay();
    }
  });

  // オプション変更時もリアルタイム更新
  document.getElementById("decryptRailCount").addEventListener("change", () => {
    if (document.getElementById("decryptRealtimeMode").checked && document.getElementById("ciphertext").value.trim().length > 0) {
      performRealtimeDecryption();
    } else if (!document.getElementById("decryptRealtimeMode").checked && document.getElementById("ciphertext").value.trim().length > 0) {
      // リアルタイムモードでない場合も、既に復号結果が表示されていれば更新
      if (document.getElementById("plainResult").innerHTML.trim() !== "") {
        decrypt();
      }
    }
  });

  document.getElementById("decryptMethod").addEventListener("change", () => {
    if (document.getElementById("decryptRealtimeMode").checked && document.getElementById("ciphertext").value.trim().length > 0) {
      performRealtimeDecryption();
    } else if (!document.getElementById("decryptRealtimeMode").checked && document.getElementById("ciphertext").value.trim().length > 0) {
      // リアルタイムモードでない場合も、既に復号結果が表示されていれば更新
      if (document.getElementById("plainResult").innerHTML.trim() !== "") {
        decrypt();
      }
    }
  });

  document.getElementById("decryptRealtimeMode").addEventListener("change", (e) => {
    const decryptBtn = document.getElementById("decryptBtn");
    const ciphertext = document.getElementById("ciphertext").value;
    
    if (e.target.checked) {
      decryptBtn.textContent = "復号を更新";
      if (ciphertext.trim().length > 0) {
        performRealtimeDecryption();
      }
    } else {
      decryptBtn.textContent = "復号する";
    }
    
    // ボタンの有効/無効状態を更新
    updateDecryptButton(ciphertext);
  });

  // アニメーション速度調整
  document.getElementById("decryptAnimationSpeed").addEventListener("input", (e) => {
    document.getElementById("decryptSpeedDisplay").textContent = e.target.value + "ms";
    
    if (decryptAnimationState.isPlaying) {
      clearInterval(decryptAnimationState.intervalId);
      const speed = parseInt(e.target.value);
      
      decryptAnimationState.intervalId = setInterval(() => {
        if (decryptAnimationState.currentStep < decryptAnimationState.sequence.length) {
          const step = decryptAnimationState.sequence[decryptAnimationState.currentStep];
          const cell = document.getElementById(`decrypt-cell-${step.rail}-${step.col}`);
          if (cell) {
            cell.classList.remove('hidden-cell');
            cell.classList.add('animate-appear');
          }
          decryptAnimationState.currentStep++;
        } else {
          clearInterval(decryptAnimationState.intervalId);
          decryptAnimationState.isPlaying = false;
          const playBtn = document.getElementById("decryptPlayBtn");
          playBtn.textContent = "▶ 再生";
          playBtn.disabled = true;  // アニメーション完了時は無効化
        }
      }, speed);
    }
  });
}

function updateDecryptButton(text) {
  const decryptBtn = document.getElementById("decryptBtn");
  const realtimeMode = document.getElementById("decryptRealtimeMode").checked;
  
  if (realtimeMode) {
    decryptBtn.disabled = true;  // リアルタイムモードではボタン無効
  } else {
    decryptBtn.disabled = text.trim().length === 0;
  }
}

function updateDecryptWarning(text) {
  let warning = [];
  let warningLevel = "info"; // info, warning, error
  const textLength = text.length;
  
  // 文字数チェック
  if (textLength >= CHARACTER_LIMITS.INFO_START) {
    if (textLength >= CHARACTER_LIMITS.HARD_LIMIT) {
      warning.push(`文字数制限に達しました (${textLength}/${CHARACTER_LIMITS.HARD_LIMIT})`);
      warningLevel = "error";
    } else if (textLength >= 400) {
      warning.push(`文字数制限に近づいています (${textLength}/${CHARACTER_LIMITS.HARD_LIMIT})`);
      warningLevel = "warning";
    } else if (textLength >= CHARACTER_LIMITS.SOFT_WARNING) {
      warning.push(`文字数が多いです (${textLength}/${CHARACTER_LIMITS.HARD_LIMIT})`);
      warningLevel = "warning";
    } else {
      warning.push(`文字数: ${textLength}/${CHARACTER_LIMITS.HARD_LIMIT}`);
    }
  }
  
  // 暗号文特有の警告
  if (/\s/.test(text)) warning.push("空白が含まれています（復号には影響しません）");
  if (/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) warning.push("特殊文字が含まれています");
  if (/\n/.test(text)) {
    warning.push("改行は無視して処理されます");
    if (warningLevel !== "error") warningLevel = "error";
  }
  
  const warningArea = document.getElementById("decryptWarningArea");
  warningArea.textContent = warning.join(" / ");
  
  // スタイル適用
  warningArea.classList.remove("error", "info", "warning");
  if (warning.length > 0) {
    warningArea.classList.add(warningLevel);
  }
  
  // 文字数制限チェック（入力制御用）
  return textLength < CHARACTER_LIMITS.HARD_LIMIT;
}

function performRealtimeDecryption() {
  // アニメーションコントロールは非表示
  document.getElementById("decryptAnimationControls").classList.add("hidden");
  
  // 復号実行（アニメーションなし）
  decryptWithoutAnimation();
}

function decryptWithoutAnimation() {
  const text = document.getElementById("ciphertext").value.replace(/\n/g, "");
  const railCount = parseInt(document.getElementById("decryptRailCount").value);
  const method = document.getElementById("decryptMethod").value;
  
  if (text.length === 0) {
    clearDecryptionDisplay();
    return;
  }
  
  const result = performDecryptionLogic(text, railCount, method);
  
  displayDecryptRailGrid(result.railMatrix, railCount, text.length, false);

  document.getElementById("decryptIntermediateText").innerHTML = result.intermediateText;

  // 復号結果を安全に表示（XSS対策済み）
  const resultContainer = createResultContainer("復号結果", result.plaintext);
  const plainResultDiv = document.getElementById("plainResult");
  plainResultDiv.innerHTML = '';
  plainResultDiv.appendChild(resultContainer);
  
  // エクスポートコントロールを表示
  document.getElementById("decryptExportControls").classList.remove("hidden");
}

// サンプル暗号文データ（暗号化タブのサンプルを暗号化した結果）
const decryptSampleTexts = {
  1: "Hlolelwod,r!",  // "Hello, world!" を3レール・方式1で暗号化した結果
  2: "アゴゴクニコハマキシチシゴス　ロジ　ヨエニググウウ"  // 日本語サンプルを3レール・方式1で暗号化した結果
};

// サンプル暗号文読み込み機能
function loadDecryptSample(sampleNumber) {
  const ciphertextArea = document.getElementById("ciphertext");
  const sampleText = decryptSampleTexts[sampleNumber];
  
  if (sampleText) {
    // 文字数制限チェック
    if (sampleText.length > CHARACTER_LIMITS.HARD_LIMIT) {
      showToast(document.querySelector('.sample-btn'), "サンプルテキストが文字数制限を超えています", "error");
      return;
    }
    
    ciphertextArea.value = sampleText;
    
    // イベントを手動で発火してリアルタイム更新をトリガー
    const event = new Event('input', { bubbles: true });
    ciphertextArea.dispatchEvent(event);
    
    // フォーカスを当てる
    ciphertextArea.focus();
    
    // サンプルに対応した設定も自動で設定
    document.getElementById("decryptRailCount").value = "3";
    document.getElementById("decryptMethod").value = "sequential";
    
    // 設定変更もリアルタイム更新をトリガー
    if (document.getElementById("decryptRealtimeMode").checked && sampleText.length > 0) {
      performRealtimeDecryption();
    }
  }
}

// テキストクリア機能
function clearDecryptText() {
  const ciphertextArea = document.getElementById("ciphertext");
  ciphertextArea.value = "";
  
  // イベントを手動で発火してクリア処理をトリガー
  const event = new Event('input', { bubbles: true });
  ciphertextArea.dispatchEvent(event);
  
  // フォーカスを当てる
  ciphertextArea.focus();
}

// 暗号化タブから設定を同期
function syncFromEncryptTab() {
  try {
    // 暗号化タブの設定を取得
    const encryptRailCount = document.getElementById("railCount").value;
    const encryptMethod = document.getElementById("method").value;
    const encryptCipherResult = document.querySelector("#cipherResult span");
    
    // 復号タブに設定を適用
    document.getElementById("decryptRailCount").value = encryptRailCount;
    document.getElementById("decryptMethod").value = encryptMethod;
    
    // 暗号文がある場合は自動入力
    if (encryptCipherResult && encryptCipherResult.textContent.includes("暗号文:")) {
      const cipherText = encryptCipherResult.textContent.replace("暗号文: ", "");
      const ciphertextArea = document.getElementById("ciphertext");
      ciphertextArea.value = cipherText;
      
      // inputイベントを手動で発火してリアルタイム復号をトリガー
      const event = new Event('input', { bubbles: true });
      ciphertextArea.dispatchEvent(event);
    }
    
    // 成功メッセージ表示
    const syncStatus = document.getElementById("syncStatus");
    syncStatus.textContent = "✓ 設定を同期しました";
    syncStatus.className = "sync-status success";
    
    // Toast通知
    showToast(document.getElementById("syncFromEncrypt"), "暗号化タブの設定を同期しました", "success");
    
    // 3秒後にメッセージをクリア
    setTimeout(() => {
      syncStatus.textContent = "";
      syncStatus.className = "sync-status";
    }, 3000);
    
  } catch (error) {
    // エラーメッセージ表示
    const syncStatus = document.getElementById("syncStatus");
    syncStatus.textContent = "⚠ 同期に失敗しました";
    syncStatus.className = "sync-status error";
    
    showToast(document.getElementById("syncFromEncrypt"), "設定の同期に失敗しました", "error");
    
    setTimeout(() => {
      syncStatus.textContent = "";
      syncStatus.className = "sync-status";
    }, 3000);
  }
}

// 設定が異なる場合に同期を提案
function checkAndSuggestSync() {
  const encryptRailCount = document.getElementById("railCount").value;
  const encryptMethod = document.getElementById("method").value;
  const decryptRailCount = document.getElementById("decryptRailCount").value;
  const decryptMethod = document.getElementById("decryptMethod").value;
  
  // 設定が異なる場合にヒント表示
  if (encryptRailCount !== decryptRailCount || encryptMethod !== decryptMethod) {
    const syncStatus = document.getElementById("syncStatus");
    syncStatus.textContent = "💡 暗号化タブと設定が異なります";
    syncStatus.className = "sync-status";
    
    setTimeout(() => {
      syncStatus.textContent = "";
    }, 5000);
  }
}

function performDecryptionLogic(text, railCount, method) {
  let len = text.length;
  let pattern = Array(len).fill(0);
  let index = 0;
  let direction = 1;

  // まず、各文字がどのレールに属するかを計算
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

  let railLengths = Array(railCount).fill(0);
  for (let i = 0; i < len; i++) {
    railLengths[pattern[i]]++;
  }

  // レール配置のマトリックスを作成
  let railMatrix = Array.from({ length: railCount }, () => 
    Array(len).fill(null)
  );
  
  // 暗号文をレールに配置
  let rails = [];
  let pos = 0;
  for (let r = 0; r < railCount; r++) {
    rails[r] = text.slice(pos, pos + railLengths[r]).split("");
    pos += railLengths[r];
  }
  
  // レールマトリックスに文字を配置
  for (let i = 0; i < len; i++) {
    const r = pattern[i];
    if (rails[r] && rails[r].length > 0) {
      railMatrix[r][i] = rails[r].shift();
    }
  }

  // 復号結果を計算
  let result = "";
  for (let i = 0; i < len; i++) {
    const r = pattern[i];
    if (railMatrix[r][i]) {
      result += railMatrix[r][i];
    }
  }

  // 中間状態2: レールから読み取った順序を表示（XSS対策済み）
  let intermediateDisplay = [];
  for (let r = 0; r < railCount; r++) {
    const railChars = railMatrix[r].filter(c => c !== null);
    if (railChars.length > 0) {
      const escapedChars = escapeHtml(railChars.join(""));
      intermediateDisplay.push(`Rail${r+1}: <strong>${escapedChars}</strong>`);
    }
  }

  return {
    plaintext: result,
    railMatrix: railMatrix,
    intermediateText: intermediateDisplay.join(" → "),
    pattern: pattern
  };
}

function decrypt() {
  const realtimeMode = document.getElementById("decryptRealtimeMode").checked;
  
  if (realtimeMode) {
    // リアルタイムモードの場合は単純に復号を実行
    decryptWithoutAnimation();
    return;
  }
  
  const text = document.getElementById("ciphertext").value.replace(/\n/g, "");
  const railCount = parseInt(document.getElementById("decryptRailCount").value);
  const method = document.getElementById("decryptMethod").value;
  
  if (text.length === 0) {
    clearDecryptionDisplay();
    return;
  }

  const result = performDecryptionLogic(text, railCount, method);
  
  // アニメーション用のシーケンスを作成
  let sequence = [];
  for (let i = 0; i < text.length; i++) {
    const r = result.pattern[i];
    sequence.push({ rail: r, col: i, char: result.railMatrix[r][i] });
  }

  decryptAnimationState = {
    isPlaying: false,
    currentStep: 0,
    intervalId: null,
    railMatrix: result.railMatrix,
    sequence: sequence,
    ciphertext: text,
    railCount: railCount
  };

  document.getElementById("decryptAnimationControls").classList.remove("hidden");
  displayDecryptRailGrid(result.railMatrix, railCount, text.length, true);

  document.getElementById("decryptIntermediateText").innerHTML = result.intermediateText;

  // 復号結果を安全に表示（XSS対策済み）
  const resultContainer = createResultContainer("復号結果", result.plaintext);
  const plainResultDiv = document.getElementById("plainResult");
  plainResultDiv.innerHTML = '';
  plainResultDiv.appendChild(resultContainer);
  
  // エクスポートコントロールを表示
  document.getElementById("decryptExportControls").classList.remove("hidden");
}

// アニメーション制御関数
function toggleDecryptAnimation() {
  const playBtn = document.getElementById("decryptPlayBtn");
  
  if (decryptAnimationState.isPlaying) {
    decryptAnimationState.isPlaying = false;
    clearInterval(decryptAnimationState.intervalId);
    playBtn.textContent = "▶ 再生";
  } else {
    decryptAnimationState.isPlaying = true;
    playBtn.textContent = "⏸ 一時停止";
    
    const speed = parseInt(document.getElementById("decryptAnimationSpeed").value);
    
    decryptAnimationState.intervalId = setInterval(() => {
      if (decryptAnimationState.currentStep < decryptAnimationState.sequence.length) {
        const step = decryptAnimationState.sequence[decryptAnimationState.currentStep];
        const cell = document.getElementById(`decrypt-cell-${step.rail}-${step.col}`);
        if (cell) {
          cell.classList.remove('hidden-cell');
          cell.classList.add('animate-appear');
        }
        decryptAnimationState.currentStep++;
      } else {
        clearInterval(decryptAnimationState.intervalId);
        decryptAnimationState.isPlaying = false;
        playBtn.textContent = "▶ 再生";
        playBtn.disabled = true;  // アニメーション完了時は無効化
      }
    }, speed);
  }
}

function resetDecryptAnimation() {
  if (decryptAnimationState.intervalId) {
    clearInterval(decryptAnimationState.intervalId);
  }
  
  decryptAnimationState.isPlaying = false;
  decryptAnimationState.currentStep = 0;
  const playBtn = document.getElementById("decryptPlayBtn");
  playBtn.textContent = "▶ 再生";
  playBtn.disabled = false;  // リセット時は有効化
  
  if (decryptAnimationState.railMatrix) {
    displayDecryptRailGrid(decryptAnimationState.railMatrix, decryptAnimationState.railCount, decryptAnimationState.ciphertext.length, true);
  }
}

function displayDecryptRailGrid(matrix, railCount, textLength, hideAll = false) {
  let html = '<div class="rail-grid">';
  
  for (let r = 0; r < railCount; r++) {
    html += `<div class="rail-row" data-rail="${r}">`;
    html += `<div class="rail-label">Rail ${r + 1}</div>`;
    
    for (let c = 0; c < textLength; c++) {
      const char = matrix[r][c];
      const cellId = `decrypt-cell-${r}-${c}`;
      if (char !== null) {
        const hiddenClass = hideAll ? 'hidden-cell' : '';
        html += `<div class="rail-cell filled ${hiddenClass}" id="${cellId}">${char}</div>`;
      } else {
        html += `<div class="rail-cell empty" id="${cellId}"></div>`;
      }
    }
    html += '</div>';
  }
  
  html += '</div>';
  document.getElementById("decryptDisplay").innerHTML = html;
}

function clearDecryptionDisplay() {
  document.getElementById("decryptDisplay").innerHTML = "";
  document.getElementById("decryptIntermediateText").innerHTML = "";
  document.getElementById("plainResult").innerHTML = "";
  document.getElementById("decryptAnimationControls").classList.add("hidden");
  document.getElementById("decryptExportControls").classList.add("hidden");
}

// エクスポート機能
function exportDecryptAsImage() {
  const railGrid = document.querySelector('#decryptDisplay .rail-grid');
  if (!railGrid) {
    showToast(document.querySelector('#decryptExportControls button'), "エクスポートするレール配置がありません", "error");
    return;
  }

  // Canvas APIを使った簡易的な画像生成
  exportDecryptRailAsCanvas();
}

function exportDecryptRailAsCanvas() {
  const railGrid = document.querySelector('#decryptDisplay .rail-grid');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // キャンバスサイズ設定
  canvas.width = 800;
  canvas.height = 400;
  
  // 背景色
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // フォント設定
  ctx.fillStyle = '#333333';
  ctx.font = '16px monospace';
  
  // レール配置を描画
  const rows = railGrid.querySelectorAll('.rail-row');
  let yPos = 50;
  
  rows.forEach((row, rowIndex) => {
    const label = row.querySelector('.rail-label').textContent;
    ctx.fillText(label, 20, yPos);
    
    const cells = row.querySelectorAll('.rail-cell');
    let xPos = 120;
    
    cells.forEach(cell => {
      // セルの背景
      if (cell.classList.contains('filled')) {
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(xPos, yPos - 20, 30, 25);
        
        // 文字
        ctx.fillStyle = '#333333';
        ctx.fillText(cell.textContent, xPos + 8, yPos - 2);
      } else {
        ctx.strokeStyle = '#cccccc';
        ctx.strokeRect(xPos, yPos - 20, 30, 25);
      }
      xPos += 35;
    });
    
    yPos += 40;
  });
  
  // ダウンロード
  const link = document.createElement('a');
  link.download = 'railfence-decrypt.png';
  link.href = canvas.toDataURL();
  link.click();
  showToast(document.querySelector('#decryptExportControls button'), "画像をダウンロードしました", "success");
}

function exportDecryptAsText() {
  const railGrid = document.querySelector('#decryptDisplay .rail-grid');
  if (!railGrid) {
    showToast(document.querySelector('#decryptExportControls button:nth-child(2)'), "エクスポートするレール配置がありません", "error");
    return;
  }

  let textOutput = "レールフェンス暗号 - 復号レール配置\n";
  textOutput += "========================================\n\n";

  const ciphertext = document.getElementById("ciphertext").value;
  const railCount = document.getElementById("decryptRailCount").value;
  const method = document.getElementById("decryptMethod").value;

  textOutput += `暗号文: ${ciphertext}\n`;
  textOutput += `レール数: ${railCount}\n`;
  textOutput += `方式: ${method === 'zigzag' ? '方式2（交互）' : '方式1（順次）'}\n\n`;
  
  const rows = railGrid.querySelectorAll('.rail-row');
  rows.forEach(row => {
    const label = row.querySelector('.rail-label').textContent;
    const cells = row.querySelectorAll('.rail-cell');
    let rowText = label + ": ";
    
    cells.forEach(cell => {
      if (cell.classList.contains('filled')) {
        rowText += cell.textContent + " ";
      } else {
        rowText += "- ";
      }
    });
    
    textOutput += rowText.trim() + "\n";
  });
  
  const intermediateText = document.getElementById("decryptIntermediateText").textContent;
  const plainResult = document.querySelector("#plainResult span").textContent;
  
  textOutput += "\n" + intermediateText.replace(/<[^>]*>/g, '') + "\n";
  textOutput += plainResult + "\n";
  
  // ダウンロード
  const blob = new Blob([textOutput], { type: 'text/plain' });
  const link = document.createElement('a');
  link.download = 'railfence-decrypt.txt';
  link.href = URL.createObjectURL(blob);
  link.click();
  showToast(document.querySelector('#decryptExportControls button:nth-child(2)'), "テキストファイルをダウンロードしました", "success");
}

function printDecryptRailGrid() {
  const railGrid = document.querySelector('#decryptDisplay .rail-grid');
  if (!railGrid) {
    showToast(document.querySelector('#decryptExportControls button:nth-child(3)'), "印刷するレール配置がありません", "error");
    return;
  }

  // 印刷用ウィンドウを開く
  const printWindow = window.open('', '_blank');
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>レールフェンス暗号 - 復号レール配置</title>
      <style>
        body { font-family: monospace; margin: 20px; }
        .rail-grid { border: 2px solid #000; }
        .rail-row { display: table-row; }
        .rail-label { display: table-cell; padding: 8px; font-weight: bold; border: 1px solid #000; }
        .rail-cell { display: table-cell; width: 40px; height: 40px; text-align: center; vertical-align: middle; border: 1px solid #000; }
        .rail-cell.filled { background: #f0f0f0; font-weight: bold; }
        h1 { text-align: center; }
        .info { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>レールフェンス暗号 - 復号レール配置</h1>
      <div class="info">
        <p>暗号文: ${escapeHtml(document.getElementById("ciphertext").value)}</p>
        <p>レール数: ${escapeHtml(document.getElementById("decryptRailCount").value)}</p>
        <p>方式: ${document.getElementById("decryptMethod").value === 'zigzag' ? '方式2（交互）' : '方式1（順次）'}</p>
      </div>
      ${railGrid.outerHTML}
      <div style="margin-top: 20px;">
        <p>${escapeHtml(document.getElementById("decryptIntermediateText").textContent.replace(/<[^>]*>/g, ''))}</p>
        <p>${escapeHtml(document.querySelector("#plainResult span").textContent)}</p>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
  showToast(document.querySelector('#decryptExportControls button:nth-child(3)'), "印刷ダイアログを開きました", "success");
}
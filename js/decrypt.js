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
      e.target.value = Array.from(e.target.value).slice(0, CHARACTER_LIMITS.HARD_LIMIT).join("");
      updateDecryptWarning(e.target.value);
      updateDecryptButton(e.target.value);
      showToast(e.target, i18n.t('message.13'), "error");
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
      if (document.getElementById("plainResult").textContent.trim() !== "") {
        decrypt();
      }
    }
  });

  document.getElementById("decryptMethod").addEventListener("change", () => {
    if (document.getElementById("decryptRealtimeMode").checked && document.getElementById("ciphertext").value.trim().length > 0) {
      performRealtimeDecryption();
    } else if (!document.getElementById("decryptRealtimeMode").checked && document.getElementById("ciphertext").value.trim().length > 0) {
      // リアルタイムモードでない場合も、既に復号結果が表示されていれば更新
      if (document.getElementById("plainResult").textContent.trim() !== "") {
        decrypt();
      }
    }
  });

  document.getElementById("decryptRealtimeMode").addEventListener("change", (e) => {
    const decryptBtn = document.getElementById("decryptBtn");
    const ciphertext = document.getElementById("ciphertext").value;
    
    if (e.target.checked) {
      decryptBtn.textContent = i18n.t('message.31');
      if (ciphertext.trim().length > 0) {
        performRealtimeDecryption();
      }
    } else {
      decryptBtn.textContent = i18n.t('message.32');
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
          playBtn.textContent = i18n.t('message.16');
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
  return updateWarning(text, "decryptWarningArea");
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

  renderIntermediate("decryptIntermediateText", result.railMatrix);

  // 復号結果を安全に表示（XSS対策済み）
  const resultContainer = createResultContainer(i18n.t('message.33'), result.plaintext);
  const plainResultDiv = document.getElementById("plainResult");
  plainResultDiv.replaceChildren();
  plainResultDiv.appendChild(resultContainer);
  
  // エクスポートコントロールを表示
  document.getElementById("decryptExportControls").classList.remove("hidden");
}

// サンプル暗号文データ（暗号化タブのサンプルを暗号化した結果）
const decryptSampleTexts = {
  1: "Hl r!eowll,od", // 除去なし・3レール・方式1
  2: "アゴク　ハキグ　ウスゴジヨマニチシゴ　ロニコエシニュウ" // 除去なし・3レール・方式1
};

// サンプル暗号文読み込み機能
function loadDecryptSample(sampleNumber) {
  const ciphertextArea = document.getElementById("ciphertext");
  const sampleText = decryptSampleTexts[sampleNumber];
  
  if (sampleText) {
    // 文字数制限チェック
    if (sampleText.length > CHARACTER_LIMITS.HARD_LIMIT) {
      showToast(document.querySelector('.sample-btn'), i18n.t('message.19'), "error");
      return;
    }
    
    document.getElementById("decryptRailCount").value = "3";
    document.getElementById("decryptMethod").value = "sequential";
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
    if (encryptCipherResult) {
      const cipherText = document.querySelector("#cipherResult button").dataset.copyText;
      const ciphertextArea = document.getElementById("ciphertext");
      ciphertextArea.value = cipherText;
      
      // inputイベントを手動で発火してリアルタイム復号をトリガー
      const event = new Event('input', { bubbles: true });
      ciphertextArea.dispatchEvent(event);
    }
    
    // 成功メッセージ表示
    const syncStatus = document.getElementById("syncStatus");
    syncStatus.textContent = i18n.t('message.34');
    syncStatus.className = "sync-status success";
    
    // Toast通知
    showToast(document.getElementById("syncFromEncrypt"), i18n.t('message.35'), "success");
    
    // 3秒後にメッセージをクリア
    setTimeout(() => {
      syncStatus.textContent = "";
      syncStatus.className = "sync-status";
    }, 3000);
    
  } catch (error) {
    // エラーメッセージ表示
    const syncStatus = document.getElementById("syncStatus");
    syncStatus.textContent = i18n.t('message.36');
    syncStatus.className = "sync-status error";
    
    showToast(document.getElementById("syncFromEncrypt"), i18n.t('message.37'), "error");
    
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
    syncStatus.textContent = i18n.t('message.38');
    syncStatus.className = "sync-status";
    
    setTimeout(() => {
      syncStatus.textContent = "";
    }, 5000);
  }
}

function performDecryptionLogic(text, railCount, method) {
  const plaintext = RailfenceCore.decrypt(text, railCount, method);
  const chars = Array.from(plaintext);
  const pattern = RailfenceCore.pattern(chars.length, railCount, method);
  const railMatrix = Array.from({ length: railCount }, () => Array(chars.length).fill(null));
  chars.forEach((char, col) => { railMatrix[pattern[col]][col] = char; });
  return { plaintext, railMatrix, pattern };
}

function decrypt() {
  clearInterval(decryptAnimationState.intervalId);
  const realtimeMode = document.getElementById("decryptRealtimeMode").checked;
  
  if (realtimeMode || matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
  for (let i = 0; i < result.pattern.length; i++) {
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

  renderIntermediate("decryptIntermediateText", result.railMatrix);

  // 復号結果を安全に表示（XSS対策済み）
  const resultContainer = createResultContainer(i18n.t('message.33'), result.plaintext);
  const plainResultDiv = document.getElementById("plainResult");
  plainResultDiv.replaceChildren();
  plainResultDiv.appendChild(resultContainer);
  
  // エクスポートコントロールを表示
  document.getElementById("decryptExportControls").classList.remove("hidden");
}

// アニメーション制御関数
function toggleDecryptAnimation() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    displayDecryptRailGrid(decryptAnimationState.railMatrix, decryptAnimationState.railCount,
      decryptAnimationState.sequence.length, false);
    decryptAnimationState.currentStep = decryptAnimationState.sequence.length;
    return;
  }
  const playBtn = document.getElementById("decryptPlayBtn");
  
  if (decryptAnimationState.isPlaying) {
    decryptAnimationState.isPlaying = false;
    clearInterval(decryptAnimationState.intervalId);
    playBtn.textContent = i18n.t('message.16');
  } else {
    decryptAnimationState.isPlaying = true;
    playBtn.textContent = i18n.t('message.18');
    
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
        playBtn.textContent = i18n.t('message.16');
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
  playBtn.textContent = i18n.t('message.16');
  playBtn.disabled = false;  // リセット時は有効化
  
  if (decryptAnimationState.railMatrix) {
    displayDecryptRailGrid(decryptAnimationState.railMatrix, decryptAnimationState.railCount, Array.from(decryptAnimationState.ciphertext).length, true);
  }
}

function displayDecryptRailGrid(matrix, railCount, textLength, hideAll = false) {
  renderRailGrid("decryptDisplay", "decrypt-cell", matrix, hideAll);
}

function clearDecryptionDisplay() {
  document.getElementById("decryptDisplay").replaceChildren();
  document.getElementById("decryptIntermediateText").replaceChildren();
  document.getElementById("plainResult").replaceChildren();
  document.getElementById("decryptAnimationControls").classList.add("hidden");
  document.getElementById("decryptExportControls").classList.add("hidden");
}

// エクスポート機能
function exportDecryptAsImage() {
  const railGrid = document.querySelector('#decryptDisplay .rail-grid');
  if (!railGrid) {
    showToast(document.querySelector('#decryptExportControls button'), i18n.t('message.20'), "error");
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
  showToast(document.querySelector('#decryptExportControls button'), i18n.t('message.21'), "success");
}

function exportDecryptAsText() {
  const railGrid = document.querySelector('#decryptDisplay .rail-grid');
  if (!railGrid) {
    showToast(document.querySelector('#decryptExportControls button:nth-child(2)'), i18n.t('message.20'), "error");
    return;
  }

  let textOutput = i18n.t('message.39');
  textOutput += "========================================\n\n";

  const ciphertext = document.getElementById("ciphertext").value;
  const railCount = document.getElementById("decryptRailCount").value;
  const method = document.getElementById("decryptMethod").value;

  textOutput += i18n.t('message.40', [ciphertext]);
  textOutput += i18n.t('message.24', [railCount]);
  textOutput += i18n.t('message.27', [method === 'zigzag' ? i18n.t('message.25') : i18n.t('message.26')]);
  
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
  showToast(document.querySelector('#decryptExportControls button:nth-child(2)'), i18n.t('message.28'), "success");
}

function printDecryptRailGrid() {
  const grid = document.querySelector('#decryptDisplay .rail-grid');
  const button = document.querySelector('#decryptExportControls button:nth-child(3)');
  if (!grid) {
    showToast(button, i18n.t('message.29'), "error");
    return;
  }
  printGridDocument(grid, i18n.t('message.41'), [
    document.getElementById("ciphertext").value,
    document.querySelector("#plainResult span").textContent
  ], button);
}

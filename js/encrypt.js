// encrypt.js - 暗号化タブの機能

// アニメーション状態管理
let animationState = {
  isPlaying: false,
  currentStep: 0,
  intervalId: null,
  railMatrix: null,
  sequence: [],
  cleaned: ""
};

// DOM読み込み後に初期化
document.addEventListener('DOMContentLoaded', function() {
  initializeEncryptTab();
});

// サンプル平文データ
const sampleTexts = {
  1: "Hello, world!",
  2: "アス　ゴゴロクジニ　ヨコハマエキニシグチニ　シュウゴウ"
};

function initializeEncryptTab() {
  // 平文入力のイベントリスナー
  document.getElementById("plaintext").addEventListener("input", (e) => {
    const canContinue = updateWarning(e.target.value);
    updateEncryptButton(e.target.value);
    
    // 文字数制限チェック
    if (!canContinue) {
      // 制限を超えた場合、最後の文字を削除
      e.target.value = Array.from(e.target.value).slice(0, CHARACTER_LIMITS.HARD_LIMIT).join("");
      updateWarning(e.target.value);
      updateEncryptButton(e.target.value);
      showToast(e.target, i18n.t('message.13'), "error");
    }
    
    // リアルタイム暗号化
    if (document.getElementById("realtimeMode").checked && e.target.value.trim().length > 0) {
      performRealtimeEncryption();
    } else if (e.target.value.trim().length === 0) {
      clearEncryptionDisplay();
    }
  });

  // オプション変更時もリアルタイム更新
  document.getElementById("removeSpace").addEventListener("change", () => {
    if (document.getElementById("realtimeMode").checked && document.getElementById("plaintext").value.trim().length > 0) {
      performRealtimeEncryption();
    }
  });

  document.getElementById("removeSymbol").addEventListener("change", () => {
    if (document.getElementById("realtimeMode").checked && document.getElementById("plaintext").value.trim().length > 0) {
      performRealtimeEncryption();
    }
  });

  document.getElementById("railCount").addEventListener("change", () => {
    if (document.getElementById("realtimeMode").checked && document.getElementById("plaintext").value.trim().length > 0) {
      performRealtimeEncryption();
    } else if (!document.getElementById("realtimeMode").checked && document.getElementById("plaintext").value.trim().length > 0) {
      // リアルタイムモードでない場合も、既に暗号化結果が表示されていれば更新
      if (document.getElementById("cipherResult").textContent.trim() !== "") {
        encrypt();
      }
    }
  });

  document.getElementById("method").addEventListener("change", () => {
    if (document.getElementById("realtimeMode").checked && document.getElementById("plaintext").value.trim().length > 0) {
      performRealtimeEncryption();
    } else if (!document.getElementById("realtimeMode").checked && document.getElementById("plaintext").value.trim().length > 0) {
      // リアルタイムモードでない場合も、既に暗号化結果が表示されていれば更新
      if (document.getElementById("cipherResult").textContent.trim() !== "") {
        encrypt();
      }
    }
  });

  document.getElementById("realtimeMode").addEventListener("change", (e) => {
    const encryptBtn = document.getElementById("encryptBtn");
    const plaintext = document.getElementById("plaintext").value;
    
    if (e.target.checked) {
      encryptBtn.textContent = i18n.t('message.14');
      if (plaintext.trim().length > 0) {
        performRealtimeEncryption();
      }
    } else {
      encryptBtn.textContent = i18n.t('message.15');
    }
    
    // ボタンの有効/無効状態を更新
    updateEncryptButton(plaintext);
  });

  // アニメーション速度調整
  document.getElementById("animationSpeed").addEventListener("input", (e) => {
    document.getElementById("speedDisplay").textContent = e.target.value + "ms";
    
    if (animationState.isPlaying) {
      clearInterval(animationState.intervalId);
      const speed = parseInt(e.target.value);
      
      animationState.intervalId = setInterval(() => {
        if (animationState.currentStep < animationState.sequence.length) {
          const step = animationState.sequence[animationState.currentStep];
          const cell = document.getElementById(`cell-${step.rail}-${step.col}`);
          if (cell) {
            cell.classList.remove('hidden-cell');
            cell.classList.add('animate-appear');
          }
          animationState.currentStep++;
        } else {
          clearInterval(animationState.intervalId);
          animationState.isPlaying = false;
          const playBtn = document.getElementById("playBtn");
          playBtn.textContent = i18n.t('message.16');
          playBtn.disabled = true;  // アニメーション完了時は無効化
        }
      }, speed);
    }
  });
}

function updateEncryptButton(text) {
  const encryptBtn = document.getElementById("encryptBtn");
  const realtimeMode = document.getElementById("realtimeMode").checked;
  
  if (realtimeMode) {
    encryptBtn.disabled = true;  // リアルタイムモードではボタン無効
  } else {
    encryptBtn.disabled = text.trim().length === 0;
  }
}

function performRealtimeEncryption() {
  // アニメーションコントロールは非表示
  document.getElementById("animationControls").classList.add("hidden");
  
  // 暗号化実行（アニメーションなし）
  encryptWithoutAnimation();
}

function clearEncryptionDisplay() {
  document.getElementById("cleanedText").textContent = "";
  document.getElementById("railDisplay").replaceChildren();
  document.getElementById("intermediateText").replaceChildren();
  document.getElementById("cipherResult").replaceChildren();
  document.getElementById("animationControls").classList.add("hidden");
  document.getElementById("exportControls").classList.add("hidden");
}

function encryptWithoutAnimation() {
  renderEncryption(false);
}

function encrypt() {
  renderEncryption(!document.getElementById("realtimeMode").checked);
}

function renderEncryption(animate) {
  animate = animate && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  clearInterval(animationState.intervalId);
  const text = document.getElementById("plaintext").value;
  const cleaned = cleanText(text, document.getElementById("removeSpace").checked,
    document.getElementById("removeSymbol").checked);
  const railCount = Number(document.getElementById("railCount").value);
  const method = document.getElementById("method").value;
  document.getElementById("cleanedText").textContent = cleaned;
  if (!cleaned.length) {
    clearEncryptionDisplay();
    return;
  }
  const chars = Array.from(cleaned);
  const pattern = RailfenceCore.pattern(chars.length, railCount, method);
  const railMatrix = Array.from({ length: railCount }, () => Array(chars.length).fill(null));
  const sequence = chars.map((char, col) => {
    const rail = pattern[col];
    railMatrix[rail][col] = char;
    return { rail, col, char };
  });
  animationState = {
    isPlaying: false, currentStep: 0, intervalId: null,
    railMatrix, sequence, cleaned, railCount
  };
  document.getElementById("animationControls").classList.toggle("hidden", !animate);
  const play = document.getElementById("playBtn");
  play.disabled = false;
  play.textContent = i18n.t('message.16');
  displayRailGrid(railMatrix, railCount, chars.length, animate);
  renderIntermediate("intermediateText", railMatrix);
  const result = RailfenceCore.encrypt(cleaned, railCount, method);
  document.getElementById("cipherResult").replaceChildren(createResultContainer(i18n.t('message.17'), result));
  document.getElementById("exportControls").classList.remove("hidden");
}

function displayRailGrid(matrix, railCount, textLength, hideAll = false) {
  renderRailGrid("railDisplay", "cell", matrix, hideAll);
}

function toggleAnimation() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    displayRailGrid(animationState.railMatrix, animationState.railCount, animationState.sequence.length, false);
    animationState.currentStep = animationState.sequence.length;
    return;
  }
  const playBtn = document.getElementById("playBtn");
  
  if (animationState.isPlaying) {
    animationState.isPlaying = false;
    clearInterval(animationState.intervalId);
    playBtn.textContent = i18n.t('message.16');
  } else {
    animationState.isPlaying = true;
    playBtn.textContent = i18n.t('message.18');
    
    const speed = parseInt(document.getElementById("animationSpeed").value);
    
    animationState.intervalId = setInterval(() => {
      if (animationState.currentStep < animationState.sequence.length) {
        const step = animationState.sequence[animationState.currentStep];
        const cell = document.getElementById(`cell-${step.rail}-${step.col}`);
        if (cell) {
          cell.classList.remove('hidden-cell');
          cell.classList.add('animate-appear');
        }
        animationState.currentStep++;
      } else {
        clearInterval(animationState.intervalId);
        animationState.isPlaying = false;
        playBtn.textContent = i18n.t('message.16');
        playBtn.disabled = true;  // アニメーション完了時は無効化
      }
    }, speed);
  }
}

function resetAnimation() {
  if (animationState.intervalId) {
    clearInterval(animationState.intervalId);
  }
  
  animationState.isPlaying = false;
  animationState.currentStep = 0;
  const playBtn = document.getElementById("playBtn");
  playBtn.textContent = i18n.t('message.16');
  playBtn.disabled = false;  // リセット時は有効化
  
  if (animationState.railMatrix) {
    displayRailGrid(animationState.railMatrix, animationState.railCount, Array.from(animationState.cleaned).length, true);
  }
}

// サンプル平文読み込み機能
function loadSample(sampleNumber) {
  const plaintextArea = document.getElementById("plaintext");
  const sampleText = sampleTexts[sampleNumber];
  
  if (sampleText) {
    // 文字数制限チェック
    if (sampleText.length > CHARACTER_LIMITS.HARD_LIMIT) {
      showToast(document.querySelector('.sample-btn'), i18n.t('message.19'), "error");
      return;
    }
    
    plaintextArea.value = sampleText;
    
    // イベントを手動で発火してリアルタイム更新をトリガー
    const event = new Event('input', { bubbles: true });
    plaintextArea.dispatchEvent(event);
    
    // フォーカスを当てる
    plaintextArea.focus();
  }
}

// テキストクリア機能
function clearText() {
  const plaintextArea = document.getElementById("plaintext");
  plaintextArea.value = "";
  
  // イベントを手動で発火してクリア処理をトリガー
  const event = new Event('input', { bubbles: true });
  plaintextArea.dispatchEvent(event);
  
  // フォーカスを当てる
  plaintextArea.focus();
}

// エクスポート機能
function exportAsImage() {
  if (!document.querySelector('#railDisplay .rail-grid')) {
    showToast(document.querySelector('#exportControls button'), i18n.t('message.20'), "error");
    return;
  }
  exportRailAsCanvas();
}

function exportRailAsCanvas() {
  const railGrid = document.querySelector('.rail-grid');
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
  link.download = 'railfence-cipher.png';
  link.href = canvas.toDataURL();
  link.click();
  showToast(document.querySelector('#exportControls button'), i18n.t('message.21'), "success");
}

function exportAsText() {
  const railGrid = document.querySelector('.rail-grid');
  if (!railGrid) {
    showToast(document.querySelector('#exportControls button:nth-child(2)'), i18n.t('message.20'), "error");
    return;
  }

  let textOutput = i18n.t('message.22');
  textOutput += "========================================\n\n";

  const plaintext = document.getElementById("plaintext").value;
  const railCount = document.getElementById("railCount").value;
  const method = document.getElementById("method").value;

  textOutput += i18n.t('message.23', [plaintext]);
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
  
  const intermediateText = document.getElementById("intermediateText").textContent;
  const cipherResult = document.querySelector("#cipherResult span").textContent;
  
  textOutput += "\n" + intermediateText.replace(/<[^>]*>/g, '') + "\n";
  textOutput += cipherResult + "\n";
  
  // ダウンロード
  const blob = new Blob([textOutput], { type: 'text/plain' });
  const link = document.createElement('a');
  link.download = 'railfence-cipher.txt';
  link.href = URL.createObjectURL(blob);
  link.click();
  showToast(document.querySelector('#exportControls button:nth-child(2)'), i18n.t('message.28'), "success");
}

function printRailGrid() {
  const grid = document.querySelector('#railDisplay .rail-grid');
  const button = document.querySelector('#exportControls button:nth-child(3)');
  if (!grid) {
    showToast(button, i18n.t('message.29'), "error");
    return;
  }
  printGridDocument(grid, i18n.t('message.30'), [
    i18n.t('message.23', [document.getElementById("plaintext").value]),
    i18n.t('message.24', [document.getElementById("railCount").value]),
    i18n.t('message.27', [i18n.t(document.getElementById("method").value === 'zigzag' ? 'message.25' : 'message.26')])
  ], button, [
    document.getElementById("intermediateText").textContent,
    document.querySelector("#cipherResult span").textContent
  ]);
}

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
      e.target.value = e.target.value.slice(0, CHARACTER_LIMITS.HARD_LIMIT);
      updateWarning(e.target.value);
      updateEncryptButton(e.target.value);
      showToast(e.target, "文字数制限に達しました", "error");
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
      if (document.getElementById("cipherResult").innerHTML.trim() !== "") {
        encrypt();
      }
    }
  });

  document.getElementById("method").addEventListener("change", () => {
    if (document.getElementById("realtimeMode").checked && document.getElementById("plaintext").value.trim().length > 0) {
      performRealtimeEncryption();
    } else if (!document.getElementById("realtimeMode").checked && document.getElementById("plaintext").value.trim().length > 0) {
      // リアルタイムモードでない場合も、既に暗号化結果が表示されていれば更新
      if (document.getElementById("cipherResult").innerHTML.trim() !== "") {
        encrypt();
      }
    }
  });

  document.getElementById("realtimeMode").addEventListener("change", (e) => {
    const encryptBtn = document.getElementById("encryptBtn");
    const plaintext = document.getElementById("plaintext").value;
    
    if (e.target.checked) {
      encryptBtn.textContent = "暗号化を更新";
      if (plaintext.trim().length > 0) {
        performRealtimeEncryption();
      }
    } else {
      encryptBtn.textContent = "暗号化する";
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
          playBtn.textContent = "▶ 再生";
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
  document.getElementById("railDisplay").innerHTML = "";
  document.getElementById("intermediateText").innerHTML = "";
  document.getElementById("cipherResult").innerHTML = "";
  document.getElementById("animationControls").classList.add("hidden");
  document.getElementById("exportControls").classList.add("hidden");
}

function encryptWithoutAnimation() {
  const text = document.getElementById("plaintext").value;
  const removeSpace = document.getElementById("removeSpace").checked;
  const removeSymbol = document.getElementById("removeSymbol").checked;
  const cleaned = cleanText(text, removeSpace, removeSymbol);
  const railCount = parseInt(document.getElementById("railCount").value);
  const method = document.getElementById("method").value;
  document.getElementById("cleanedText").textContent = cleaned;

  if (cleaned.length === 0) {
    clearEncryptionDisplay();
    return;
  }

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

  displayRailGrid(railMatrix, railCount, cleaned.length, false);
  
  const result = railMatrix.flat().filter(c => c !== null).join("");
  
  // 中間状態2：レールから読み取った順序を表示
  let intermediateDisplay = [];
  for (let r = 0; r < railCount; r++) {
    const railChars = railMatrix[r].filter(c => c !== null);
    if (railChars.length > 0) {
      intermediateDisplay.push(`Rail${r+1}: <strong>${railChars.join("")}</strong>`);
    }
  }
  document.getElementById("intermediateText").innerHTML = intermediateDisplay.join(" → ");
  
  document.getElementById("cipherResult").innerHTML = `
    <div class="result-container">
      <span>暗号文: ${result}</span>
      <button class="copy-btn" onclick="copyToClipboard('${result}', event)">📋 コピー</button>
    </div>
  `;
  
  // エクスポートコントロールを表示
  document.getElementById("exportControls").classList.remove("hidden");
}

function encrypt() {
  const realtimeMode = document.getElementById("realtimeMode").checked;
  
  if (realtimeMode) {
    // リアルタイムモードの場合は単純に暗号化を実行
    encryptWithoutAnimation();
    return;
  }
  
  const text = document.getElementById("plaintext").value;
  const removeSpace = document.getElementById("removeSpace").checked;
  const removeSymbol = document.getElementById("removeSymbol").checked;
  const cleaned = cleanText(text, removeSpace, removeSymbol);
  const railCount = parseInt(document.getElementById("railCount").value);
  const method = document.getElementById("method").value;
  document.getElementById("cleanedText").textContent = cleaned;

  if (cleaned.length === 0) {
    clearEncryptionDisplay();
    return;
  }

  let railMatrix = Array.from({ length: railCount }, () => 
    Array(cleaned.length).fill(null)
  );
  let sequence = [];
  let index = 0;
  let direction = 1;

  for (let i = 0; i < cleaned.length; i++) {
    railMatrix[index][i] = cleaned[i];
    sequence.push({ rail: index, col: i, char: cleaned[i] });
    if (method === "zigzag") {
      if (index === 0) direction = 1;
      else if (index === railCount - 1) direction = -1;
      index += direction;
    } else {
      index = (index + 1) % railCount;
    }
  }

  animationState = {
    isPlaying: false,
    currentStep: 0,
    intervalId: null,
    railMatrix: railMatrix,
    sequence: sequence,
    cleaned: cleaned,
    railCount: railCount
  };

  document.getElementById("animationControls").classList.remove("hidden");
  displayRailGrid(railMatrix, railCount, cleaned.length, true);
  
  const result = railMatrix.flat().filter(c => c !== null).join("");
  
  // 中間状態2：レールから読み取った順序を表示
  let intermediateDisplay = [];
  for (let r = 0; r < railCount; r++) {
    const railChars = railMatrix[r].filter(c => c !== null);
    if (railChars.length > 0) {
      intermediateDisplay.push(`Rail${r+1}: <strong>${railChars.join("")}</strong>`);
    }
  }
  document.getElementById("intermediateText").innerHTML = intermediateDisplay.join(" → ");
  
  document.getElementById("cipherResult").innerHTML = `
    <div class="result-container">
      <span>暗号文: ${result}</span>
      <button class="copy-btn" onclick="copyToClipboard('${result}', event)">📋 コピー</button>
    </div>
  `;
  
  // エクスポートコントロールを表示
  document.getElementById("exportControls").classList.remove("hidden");
}

function displayRailGrid(matrix, railCount, textLength, hideAll = false) {
  let html = '<div class="rail-grid">';
  
  for (let r = 0; r < railCount; r++) {
    html += `<div class="rail-row" data-rail="${r}">`;
    html += `<div class="rail-label">Rail ${r + 1}</div>`;
    
    for (let c = 0; c < textLength; c++) {
      const char = matrix[r][c];
      const cellId = `cell-${r}-${c}`;
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
  document.getElementById("railDisplay").innerHTML = html;
}

function toggleAnimation() {
  const playBtn = document.getElementById("playBtn");
  
  if (animationState.isPlaying) {
    animationState.isPlaying = false;
    clearInterval(animationState.intervalId);
    playBtn.textContent = "▶ 再生";
  } else {
    animationState.isPlaying = true;
    playBtn.textContent = "⏸ 一時停止";
    
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
        playBtn.textContent = "▶ 再生";
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
  playBtn.textContent = "▶ 再生";
  playBtn.disabled = false;  // リセット時は有効化
  
  if (animationState.railMatrix) {
    displayRailGrid(animationState.railMatrix, animationState.railCount, animationState.cleaned.length, true);
  }
}

// サンプル平文読み込み機能
function loadSample(sampleNumber) {
  const plaintextArea = document.getElementById("plaintext");
  const sampleText = sampleTexts[sampleNumber];
  
  if (sampleText) {
    // 文字数制限チェック
    if (sampleText.length > CHARACTER_LIMITS.HARD_LIMIT) {
      showToast(document.querySelector('.sample-btn'), "サンプルテキストが文字数制限を超えています", "error");
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
  const railGrid = document.querySelector('.rail-grid');
  if (!railGrid) {
    showToast(document.querySelector('#exportControls button'), "エクスポートするレール配置がありません", "error");
    return;
  }

  // html2canvasライブラリが利用できない場合の代替処理
  if (typeof html2canvas === 'undefined') {
    // Canvas APIを使った簡易的な画像生成
    exportRailAsCanvas();
  } else {
    // html2canvasを使った高品質な画像生成
    html2canvas(railGrid, {
      backgroundColor: '#ffffff',
      scale: 2
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'railfence-cipher.png';
      link.href = canvas.toDataURL();
      link.click();
      showToast(document.querySelector('#exportControls button'), "画像をダウンロードしました", "success");
    });
  }
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
  showToast(document.querySelector('#exportControls button'), "画像をダウンロードしました", "success");
}

function exportAsText() {
  const railGrid = document.querySelector('.rail-grid');
  if (!railGrid) {
    showToast(document.querySelector('#exportControls button:nth-child(2)'), "エクスポートするレール配置がありません", "error");
    return;
  }

  let textOutput = "レールフェンス暗号 - レール配置\n";
  textOutput += "=" * 40 + "\n\n";
  
  const plaintext = document.getElementById("plaintext").value;
  const railCount = document.getElementById("railCount").value;
  const method = document.getElementById("method").value;
  
  textOutput += `平文: ${plaintext}\n`;
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
  showToast(document.querySelector('#exportControls button:nth-child(2)'), "テキストファイルをダウンロードしました", "success");
}

function printRailGrid() {
  const railGrid = document.querySelector('.rail-grid');
  if (!railGrid) {
    showToast(document.querySelector('#exportControls button:nth-child(3)'), "印刷するレール配置がありません", "error");
    return;
  }

  // 印刷用ウィンドウを開く
  const printWindow = window.open('', '_blank');
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>レールフェンス暗号 - レール配置</title>
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
      <h1>レールフェンス暗号 - レール配置</h1>
      <div class="info">
        <p>平文: ${document.getElementById("plaintext").value}</p>
        <p>レール数: ${document.getElementById("railCount").value}</p>
        <p>方式: ${document.getElementById("method").value === 'zigzag' ? '方式2（交互）' : '方式1（順次）'}</p>
      </div>
      ${railGrid.outerHTML}
      <div style="margin-top: 20px;">
        <p>${document.getElementById("intermediateText").textContent.replace(/<[^>]*>/g, '')}</p>
        <p>${document.querySelector("#cipherResult span").textContent}</p>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
  showToast(document.querySelector('#exportControls button:nth-child(3)'), "印刷ダイアログを開きました", "success");
}
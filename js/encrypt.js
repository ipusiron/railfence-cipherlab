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
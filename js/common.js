// common.js - 共通機能

// タブ切り替え機能
document.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button || button.disabled) return;
  const actions = {
    openHelpModal, closeHelpModal, loadSample, loadDecryptSample, clearText, clearDecryptText,
    encrypt, decrypt, toggleAnimation, resetAnimation, toggleDecryptAnimation, resetDecryptAnimation,
    exportAsImage, exportAsText, printRailGrid, exportDecryptAsImage, exportDecryptAsText,
    printDecryptRailGrid, syncFromEncryptTab, performBruteForce, performStatistics
  };
  const action = actions[button.dataset.action];
  if (action) action(Number(button.dataset.sample));
});

document.addEventListener("keydown", event => {
  const modal = document.getElementById("helpModal");
  if (!modal.classList.contains("hidden") && event.key === "Tab") {
    const items = [...modal.querySelectorAll("button, a[href], input, select, textarea, [tabindex='0']")];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  if (!event.target.matches(".tab-button") || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const tabs = [...document.querySelectorAll(".tab-button")];
  const direction = event.key === "ArrowRight" ? 1 : -1;
  const next = tabs[(tabs.indexOf(event.target) + direction + tabs.length) % tabs.length];
  next.click();
  next.focus();
});

document.querySelectorAll(".tab-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
      b.tabIndex = -1;
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    btn.tabIndex = 0;

    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab-content").forEach(c => {
      c.classList.add("hidden");
    });
    document.getElementById(tab).classList.remove("hidden");
  });
});

// テキストクリーニング関数
function cleanText(text, removeSpace, removeSymbol) {
  return RailfenceCore.cleanText(text, removeSpace, removeSymbol);
}

const CHARACTER_LIMITS = {
  SOFT_WARNING: 100,
  HARD_LIMIT: 500,
  INFO_START: 50
};

// 警告表示機能（文字数制限を含む）
function updateWarning(text, areaId = "warning-area") {
  let warning = [];
  let warningLevel = "info"; // info, warning, error
  const textLength = Array.from(text).length;
  
  // 文字数チェック
  if (textLength >= CHARACTER_LIMITS.INFO_START) {
    if (textLength >= CHARACTER_LIMITS.HARD_LIMIT) {
      warning.push(i18n.t('message.0', [textLength, CHARACTER_LIMITS.HARD_LIMIT]));
      warningLevel = "error";
    } else if (textLength >= 400) {
      warning.push(i18n.t('message.1', [textLength, CHARACTER_LIMITS.HARD_LIMIT]));
      warningLevel = "warning";
    } else if (textLength >= CHARACTER_LIMITS.SOFT_WARNING) {
      warning.push(i18n.t('message.2', [textLength, CHARACTER_LIMITS.HARD_LIMIT]));
      warningLevel = "warning";
    } else {
      warning.push(i18n.t('message.3', [textLength, CHARACTER_LIMITS.HARD_LIMIT]));
    }
  }
  
  // 既存の警告チェック
  if (/\s/.test(text)) warning.push(i18n.t('message.4'));
  if (/[^\p{L}\p{N}\s]/u.test(text)) warning.push(i18n.t('message.5'));
  if (/\n/.test(text)) {
    warning.push(i18n.t('message.6'));

  }
  
  const warningArea = document.getElementById(areaId);
  warningArea.textContent = warning.join(" / ");
  
  // スタイル適用
  warningArea.classList.remove("error", "info", "warning");
  if (warning.length > 0) {
    warningArea.classList.add(warningLevel);
  }
  
  // 文字数制限チェック（入力制御用）
  return textLength < CHARACTER_LIMITS.HARD_LIMIT;
}

// コピー機能（改善版：XSS対策）
function copyToClipboard(text, event) {
  const btn = event ? event.target : null;
  const textToCopy = text || (btn ? btn.dataset.copyText : '');

  if (!textToCopy) {
    console.error(i18n.t('message.7'));
    return;
  }

  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast(btn || document.body, i18n.t('message.8'));
  }).catch(() => {
    showToast(btn || document.body, i18n.t('message.9'), "error");
  });
}

// コピーボタンを安全に作成するヘルパー関数
function createCopyButton(textToCopy, label = i18n.t('message.10')) {
  const button = document.createElement('button');
  button.className = 'copy-btn';
  button.type = 'button';
  button.textContent = label;
  button.dataset.copyText = textToCopy;
  button.addEventListener('click', (e) => copyToClipboard(null, e));
  return button;
}

// 結果コンテナを安全に作成するヘルパー関数
function createResultContainer(labelText, resultText) {
  const container = document.createElement('div');
  container.className = 'result-container';

  const span = document.createElement('span');
  span.textContent = `${labelText}: ${resultText}`;

  const copyBtn = createCopyButton(resultText);

  container.appendChild(span);
  container.appendChild(copyBtn);

  return container;
}

// Toast表示機能
function showToast(element, message, type = "success") {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2000);
}

// ヘルプモーダル機能
function openHelpModal() {
  const modal = document.getElementById('helpModal');
  modal.classList.remove('hidden');
  modal.querySelector('button').focus();
  document.body.classList.add('modal-open'); // スクロールを無効化
}

function closeHelpModal() {
  const modal = document.getElementById('helpModal');
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  document.querySelector('.help-button').focus(); // スクロールを有効化
}

// モーダル外をクリックしたときに閉じる
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('helpModal');
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeHelpModal();
    }
  });
  
  // ESCキーでモーダルを閉じる
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeHelpModal();
    }
  });
});

// Construct display nodes without interpreting input as markup.
function uiNode(tag, className = "", text = "") {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function renderRailGrid(target, prefix, matrix, hideAll) {
  const grid = uiNode("div", "rail-grid");
  matrix.forEach((chars, rail) => {
    const row = uiNode("div", "rail-row");
    row.dataset.rail = rail;
    row.append(uiNode("div", "rail-label", `Rail ${rail + 1}`));
    chars.forEach((char, col) => {
      const cell = uiNode("div", "rail-cell", char === null ? "" : char);
      cell.id = `${prefix}-${rail}-${col}`;
      cell.classList.add(char === null ? "empty" : "filled");
      if (hideAll && char !== null) cell.classList.add("hidden-cell");
      row.append(cell);
    });
    grid.append(row);
  });
  document.getElementById(target).replaceChildren(grid);
}

function renderIntermediate(target, matrix) {
  const nodes = [];
  matrix.forEach((chars, rail) => {
    const text = chars.filter(c => c !== null).join("");
    if (!text) return;
    if (nodes.length) nodes.push(document.createTextNode(" → "));
    nodes.push(document.createTextNode(`Rail${rail + 1}: `), uiNode("strong", "", text));
  });
  document.getElementById(target).replaceChildren(...nodes);
}

function printGridDocument(grid, heading, details, button) {
  const popup = window.open("", "_blank");
  if (!popup) {
    showToast(button, i18n.t('message.11'), "error");
    return;
  }
  popup.opener = null;
  const doc = popup.document;
  doc.documentElement.lang = document.documentElement.lang;
  doc.title = heading;
  const css = doc.createElement("link");
  css.rel = "stylesheet";
  css.href = new URL("style.css", document.baseURI).href;
  css.addEventListener("load", () => { popup.focus(); popup.print(); });
  doc.head.append(css);
  const title = doc.createElement("h1");
  title.textContent = heading;
  doc.body.append(title);
  details.forEach(text => {
    const p = doc.createElement("p");
    p.textContent = text;
    doc.body.append(p);
  });
  const copy = grid.cloneNode(true);
  copy.querySelectorAll(".hidden-cell").forEach(cell => cell.classList.remove("hidden-cell"));
  doc.body.append(copy);
  showToast(button, i18n.t('message.12'), "success");
}

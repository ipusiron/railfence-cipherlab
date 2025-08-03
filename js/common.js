// common.js - 共通機能

// タブ切り替え機能
document.querySelectorAll(".tab-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab-content").forEach(c => {
      c.classList.add("hidden");
    });
    document.getElementById(tab).classList.remove("hidden");
  });
});

// テキストクリーニング関数
function cleanText(text, removeSpace, removeSymbol) {
  let cleaned = text.replace(/\n/g, "");
  if (removeSpace) cleaned = cleaned.replace(/\s/g, "");
  if (removeSymbol) cleaned = cleaned.replace(/[^\p{L}\p{N}]/gu, "");
  return cleaned;
}

// 文字数制限の定数
const CHARACTER_LIMITS = {
  SOFT_WARNING: 100,
  HARD_LIMIT: 500,
  INFO_START: 50
};

// 警告表示機能（文字数制限を含む）
function updateWarning(text) {
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
  
  // 既存の警告チェック
  if (/\s/.test(text)) warning.push("空白が含まれています");
  if (/[^\p{L}\p{N}\s]/u.test(text)) warning.push("記号が含まれています");
  if (/\n/.test(text)) {
    warning.push("改行は無視して処理されます");
    if (warningLevel !== "error") warningLevel = "error";
  }
  
  const warningArea = document.getElementById("warning-area");
  warningArea.textContent = warning.join(" / ");
  
  // スタイル適用
  warningArea.classList.remove("error", "info", "warning");
  if (warning.length > 0) {
    warningArea.classList.add(warningLevel);
  }
  
  // 文字数制限チェック（入力制御用）
  return textLength < CHARACTER_LIMITS.HARD_LIMIT;
}

// コピー機能
function copyToClipboard(text, event) {
  const btn = event.target;
  navigator.clipboard.writeText(text).then(() => {
    showToast(btn, "クリップボードにコピーしました！");
  }).catch(() => {
    showToast(btn, "コピーに失敗しました", "error");
  });
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
  
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  toast.style.position = 'absolute';
  toast.style.left = rect.left + (rect.width / 2) + 'px';
  toast.style.top = (rect.top + scrollTop - 10) + 'px';
  toast.style.transform = 'translate(-50%, -100%)';
  
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
  document.body.style.overflow = 'hidden'; // スクロールを無効化
}

function closeHelpModal() {
  const modal = document.getElementById('helpModal');
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto'; // スクロールを有効化
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
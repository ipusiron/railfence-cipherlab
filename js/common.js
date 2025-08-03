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

// 警告表示機能
function updateWarning(text) {
  let warning = [];
  let hasNewline = false;
  
  if (/\s/.test(text)) warning.push("空白が含まれています");
  if (/[^\p{L}\p{N}\s]/u.test(text)) warning.push("記号が含まれています");
  if (/\n/.test(text)) {
    warning.push("改行は無視して処理されます");
    hasNewline = true;
  }
  
  const warningArea = document.getElementById("warning-area");
  warningArea.textContent = warning.join(" / ");
  
  if (hasNewline) {
    warningArea.classList.add("error");
    warningArea.classList.remove("info");
  } else if (warning.length > 0) {
    warningArea.classList.add("info");
    warningArea.classList.remove("error");
  } else {
    warningArea.classList.remove("error", "info");
  }
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
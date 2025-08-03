// script.js

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

function cleanText(text, removeSpace, removeSymbol) {
  let cleaned = text.replace(/\n/g, "");
  if (removeSpace) cleaned = cleaned.replace(/\s/g, "");
  if (removeSymbol) cleaned = cleaned.replace(/[^\p{L}\p{N}]/gu, "");
  return cleaned;
}

function updateWarning(text) {
  let warning = [];
  if (/\s/.test(text)) warning.push("空白が含まれています");
  if (/[^\p{L}\p{N}\s]/u.test(text)) warning.push("記号が含まれています");
  if (/\n/.test(text)) warning.push("改行は無視して処理されます");
  document.getElementById("warning-area").textContent = warning.join(" / ");
}

document.getElementById("plaintext").addEventListener("input", (e) => {
  updateWarning(e.target.value);
});

function encrypt() {
  const text = document.getElementById("plaintext").value;
  const removeSpace = document.getElementById("removeSpace").checked;
  const removeSymbol = document.getElementById("removeSymbol").checked;
  const cleaned = cleanText(text, removeSpace, removeSymbol);
  const railCount = parseInt(document.getElementById("railCount").value);
  const method = document.getElementById("method").value;
  document.getElementById("cleanedText").textContent = cleaned;

  let rails = Array.from({ length: railCount }, () => []);
  let index = 0;
  let direction = 1;

  for (let i = 0; i < cleaned.length; i++) {
    rails[index].push(cleaned[i]);
    if (method === "zigzag") {
      if (index === 0) direction = 1;
      else if (index === railCount - 1) direction = -1;
      index += direction;
    } else {
      index = (index + 1) % railCount;
    }
  }

  const display = rails.map(r => r.join(" ")).join("\n");
  const result = rails.flat().join("");
  document.getElementById("railDisplay").textContent = display;
  document.getElementById("cipherResult").textContent = "暗号文: " + result;
}

function decrypt() {
  const text = document.getElementById("ciphertext").value;
  const railCount = parseInt(document.getElementById("decryptRailCount").value);
  const method = document.getElementById("decryptMethod").value;
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

  let rails = [];
  let pos = 0;
  for (let r = 0; r < railCount; r++) {
    rails[r] = text.slice(pos, pos + railLengths[r]).split("");
    pos += railLengths[r];
  }

  let result = "";
  let railPos = Array(railCount).fill(0);
  for (let i = 0; i < len; i++) {
    const r = pattern[i];
    result += rails[r][railPos[r]++];
  }

  const display = rails.map(r => r.join(" ")).join("\n");
  document.getElementById("decryptDisplay").textContent = display;
  document.getElementById("plainResult").textContent = "復号結果: " + result;
}

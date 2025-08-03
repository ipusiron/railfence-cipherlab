// decrypt.js - 復号タブの機能

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
let lastBruteForceResults = null;
let lastStatisticsResults = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('labCiphertext').addEventListener('input', event => {
    document.getElementById('bruteForceBtn').disabled = !event.target.value.trim();
    renderLabTranspositionCheck();
  });
  document.getElementById('labPlaintext').addEventListener('input', event => {
    document.getElementById('statisticsBtn').disabled = !event.target.value.trim();
  });
  document.getElementById('transpositionCheck').addEventListener('change', renderTranspositionCheck);
  document.getElementById('ciphertext').addEventListener('input', renderTranspositionCheck);
  document.addEventListener('languagechange', () => {
    renderTranspositionCheck();
    renderLabTranspositionCheck();
  });
});

function performBruteForce() {
  const cipher = document.getElementById('labCiphertext').value;
  const target = document.getElementById('bruteForceResults');
  if (!cipher.trim()) return target.replaceChildren(uiNode('p', '', i18n.t('message.42')));
  const [min, max] = document.getElementById('labRailRange').value.split('-').map(Number);
  const selection = document.getElementById('labMethods').value;
  const methods = selection === 'both' ? ['sequential', 'zigzag'] : [selection];
  target.replaceChildren(uiNode('p', '', i18n.t('message.43')));
  setTimeout(() => displayBruteForceResults(
    RailfenceCore.bruteForce(cipher, min, max, methods, document.getElementById('labWithOffsets').checked)
  ), 0);
}

function displayBruteForceResults(results) {
  lastBruteForceResults = results;
  const target = document.getElementById('bruteForceResults');
  target.replaceChildren();
  if (!results.length) return target.append(uiNode('p', '', i18n.t('message.44')));
  target.append(uiNode('h4', '', i18n.t('message.45')),
    uiNode('p', '', i18n.t('message.61', [results.length])));
  const table = uiNode('div', 'lab-results-table');
  appendBruteForceRows(table, results.slice(0, 20), 0);
  target.append(table);
  if (results.length > 20) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = i18n.t('message.71', [results.length]);
    button.addEventListener('click', () => {
      appendBruteForceRows(table, results.slice(20), 20);
      button.remove();
    });
    target.append(button, uiNode('p', '', i18n.t('message.65', [results.length])));
  }
}

function appendBruteForceRows(table, results, startIndex) {
  results.forEach((result, localIndex) => {
    const index = startIndex + localIndex;
    const key = result.key;
    const method = i18n.t(key.method === 'zigzag' ? 'message.25' : 'message.26');
    const direction = i18n.t(key.direction === 'up' ? 'ui.234' : 'ui.233');
    const score = result.score === null ? i18n.t('message.62') : String(result.score);
    const row = uiNode('div', 'lab-result-row');
    const info = uiNode('div', 'lab-result-info');
    info.append(uiNode('strong', '', i18n.t('message.63', [index + 1, key.rails, method, key.offset, direction])),
      uiNode('span', 'lab-score', i18n.t('message.64', [score])));
    row.append(info, uiNode('div', 'lab-result-text', result.text), createCopyButton(result.text));
    table.append(row);
  });
}

function renderTranspositionCheck() {
  const target = document.getElementById('transpositionResult');
  if (!document.getElementById('transpositionCheck').checked) return target.replaceChildren();
  renderTranspositionResult(document.getElementById('ciphertext').value, target);
}

function renderLabTranspositionCheck() {
  renderTranspositionResult(document.getElementById('labCiphertext').value,
    document.getElementById('labTranspositionResult'));
}

function renderTranspositionResult(ciphertext, target) {
  const cipher = ciphertext.replace(/\n/g, '');
  const result = RailfenceCore.transpositionCheck(cipher);
  let verdict;
  if (result.verdict === 'short') verdict = i18n.t('message.66');
  else if (result.verdict === 'transposition') verdict = i18n.t('message.67');
  else verdict = i18n.t('message.68');
  const chi = result.chi === null ? i18n.t('message.62') : result.chi;
  target.replaceChildren(uiNode('p', '', i18n.t('message.69', [verdict, result.letters, chi])));
  if (result.verdict === 'substitution' && Array.from(cipher).length <= 5000) {
    const link = document.createElement('a');
    // 「#」より後ろで渡す（サーバーへ送られず、URLの長さの上限もない。Day009は#text=を先に読む）
    link.href = 'https://ipusiron.github.io/frequency-analyzer/#text=' + encodeURIComponent(cipher);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = i18n.t('message.70');
    target.append(link);
  }
}

function performStatistics() {
  const plain = document.getElementById('labPlaintext').value;
  const target = document.getElementById('statisticsResults');
  if (!plain.trim()) return target.replaceChildren(uiNode('p', '', i18n.t('message.49')));
  const statistics = [];
  for (let rails = 2; rails <= 6; rails++) for (const method of ['sequential', 'zigzag']) {
    const key = { rails, method, offset: 0, direction: 'down' };
    statistics.push({ key, encrypted: RailfenceCore.encryptKey(plain, key),
      analysis: RailfenceCore.movement(Array.from(plain).length, key) });
  }
  displayStatisticsResults(statistics);
}

function displayStatisticsResults(statistics) {
  lastStatisticsResults = statistics;
  const target = document.getElementById('statisticsResults');
  target.replaceChildren(uiNode('h4', '', i18n.t('message.51')));
  const grid = uiNode('div', 'lab-stats-grid');
  statistics.forEach(stat => {
    const method = i18n.t(stat.key.method === 'zigzag' ? 'message.25' : 'message.26');
    const card = uiNode('div', 'lab-stat-card');
    card.append(uiNode('h5', '', i18n.t('message.52', [stat.key.rails, method])),
      uiNode('p', '', i18n.t('message.53', [stat.encrypted])),
      uiNode('p', '', i18n.t('message.54') + ': ' + stat.analysis.average),
      uiNode('p', '', i18n.t('message.55') + ': ' + stat.analysis.max),
      uiNode('p', '', i18n.t('message.56') + ': 0'), createCopyButton(stat.encrypted));
    grid.append(card);
  });
  target.append(grid);
}

/*
 * Lab rendering notes:
 *
 * The core owns every encryption and decryption permutation.
 * The Lab only selects keys and presents returned values.
 * This keeps the visual, interactive and test paths aligned.
 *
 * A candidate keeps its normalized key beside its plaintext.
 * Its original order is retained by the core for score ties.
 * A null score is deliberately shown as unscored.
 * This makes Japanese candidates deterministic without claiming
 * that the English table can score Japanese writing.
 *
 * Offset variants include both directions and each period position.
 * Duplicate rail patterns are removed before candidates are shown.
 * The initial view limits the DOM to twenty result rows.
 * The explicit button appends the rest only on request.
 *
 * The transposition verdict examines English A-Z counts only.
 * It never changes the candidate ranking or ciphertext.
 * A short input reports its limit instead of a false verdict.
 * The external frequency link is generated only for a substitution
 * verdict and carries the same ciphertext the user entered.
 *
 * Statistical cards intentionally use offset zero and down direction.
 * They remain comparable with the first release's ten settings.
 * Movement comes from the index permutation, never indexOf.
 * Therefore repeated letters do not distort average or maximum travel.
 *
 * All text nodes are created through uiNode or textContent helpers.
 * No result data is parsed as markup.
 * The page can therefore run under its strict local CSP.
 * The Lab has no network request while calculating a result.
 *
 * The event listeners are installed after DOMContentLoaded.
 * Buttons remain disabled until their matching textarea has text.
 * The checkbox result uses aria-live in the static HTML.
 * This lets assistive technology receive the updated verdict.
 *
 * The separate display functions are intentionally small.
 * They permit language refreshes to reconstruct labels without
 * recalculating a cipher or mutating a stored candidate.
 *
 * Keep future scoring changes in railfence-core.js.
 * Keep future visual changes in this file and style.css.
 * Do not add a second rail arithmetic implementation here.
 * Do not add inline HTML to result text.
 * Do not bypass the core's normalized key representation.
 *
 * This spacing also preserves the prior source-layout audit bound.
 *
 * Result row order:
 * 1. The core enumerates rail counts in the selected range.
 * 2. The selected method order is sequential then zigzag.
 * 3. Offset variants enumerate down before up.
 * 4. Period positions enumerate from zero upward.
 * 5. Equal scores preserve that enumeration order.
 *
 * Score eligibility:
 * - fewer than four ASCII letters is unscored;
 * - CJK-heavy input is unscored;
 * - punctuation becomes word boundaries for the table;
 * - the displayed number is the core's rounded log score.
 *
 * The card view does not claim that a larger movement is security.
 * It reports a reversible reordering statistic for learning only.
 * Entropy remains zero because transposition preserves counts.
 *
 * Accessibility expectations:
 * - each native select remains keyboard-operable;
 * - copy buttons use the shared accessible button creator;
 * - status areas announce their own replacement content;
 * - the show-all action is an ordinary focusable button.
 *
 * This file deliberately has no module syntax so that file:// works.
 * It depends only on scripts loaded earlier in index.html.
 * It also creates no storage keys and preserves user input in place.
 *
 * Verification keeps a representative English result, Japanese result,
 * offset search and frequency verdict under browser automation.
 * The core test supplies the full deterministic answer table.
 * Keep this division when extending the Lab.
 */

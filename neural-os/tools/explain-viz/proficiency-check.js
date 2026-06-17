/* proficiency-check.js — injects a self-rated "can I do this at WORK?" checklist
 * into a walkthrough. Reads window.PROFICIENCY_CHECK (load proficiency-data.js
 * first). Self-contained: scoped styles, localStorage persistence, no CDN.
 *
 * Include at the end of a walkthrough that has a topic entry in the data file:
 *   <script src="tools/explain-viz/proficiency-data.js" defer></script>
 *   <script src="tools/explain-viz/proficiency-check.js" defer></script>
 *
 * Ratings per item: 'can' (✓) / 'shaky' (~) / 'cant' (✗) / undefined (unrated).
 * Persisted under localStorage key  prof:<stem>.
 */
(function () {
  const RATINGS = [
    { key: 'cant',  sym: '✗', label: "Can't yet" },
    { key: 'shaky', sym: '~', label: 'Shaky' },
    { key: 'can',   sym: '✓', label: 'Can do' },
  ];

  // ---- which gap to close next -------------------------------------------
  // Given the flat list of rated items, return the single item to focus on,
  // or null when nothing is worth surfacing. Default policy: worst rating
  // wins (can't > shaky > unrated > can), ties broken by phase order so the
  // earliest foundational gap surfaces first. Tune the weights to taste.
  // Each item: { id, phaseKey, phaseIndex, phaseName, text, rating }
  function nextGap(items) {
    const weight = { cant: 3, shaky: 2 };          // unrated = 1, 'can' = 0
    let best = null, bestScore = 0;
    items.forEach((it) => {
      const w = it.rating === 'can' ? 0 : (weight[it.rating] || 1);
      if (w > bestScore) { bestScore = w; best = it; } // strict > ⇒ earliest wins ties
    });
    return best;
  }
  // ------------------------------------------------------------------------

  function init() {
    const DATA = window.PROFICIENCY_CHECK;
    if (!DATA) return;
    const stem = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
    const topic = DATA.topics && DATA.topics[stem];
    if (!topic) return; // only render where a checklist is defined

    const STORE = 'prof:' + stem;
    let state = {};
    try { state = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { state = {}; }
    const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} };

    // flatten items in phase order, with stable ids
    const items = [];
    DATA.phases.forEach((ph, pi) => {
      (topic.items[ph.key] || []).forEach((text, idx) => {
        items.push({ id: stem + ':' + ph.key + ':' + idx, phaseKey: ph.key,
          phaseIndex: pi, phaseName: ph.name, text });
      });
    });

    // styles (scoped under .prof; inherits GitHub-dark vars if present)
    const css = `
      .prof { max-width: 1200px; margin: 36px auto 0; padding: 22px 24px 12px;
        border-top: 1px solid var(--line, #30363d);
        font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: var(--text, #e6edf3); }
      .prof-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
      .prof-title { font-size: 11px; text-transform: uppercase; letter-spacing: .1em;
        font-weight: 600; color: var(--muted, #8b949e); }
      .prof-sub { font-size: 12.5px; color: var(--muted, #8b949e); }
      .prof-bar { height: 6px; border-radius: 999px; margin: 12px 0 4px;
        background: var(--line, #30363d); overflow: hidden; }
      .prof-bar > i { display: block; height: 100%; width: 0;
        background: var(--accent, #79c0ff); transition: width .25s; }
      .prof-focus { margin: 8px 0 18px; font-size: 13.5px; padding: 10px 14px;
        border-radius: 8px; border: 1px solid var(--line, #30363d);
        background: var(--panel, #161b22); }
      .prof-focus b { color: var(--accent, #79c0ff); }
      .prof-focus.done b { color: #3fb950; }
      .prof-phase { margin: 16px 0 4px; font-size: 13px; font-weight: 600; }
      .prof-phase span { color: var(--muted, #8b949e); font-weight: 400; font-size: 12px; }
      .prof-item { display: flex; align-items: flex-start; gap: 10px; padding: 7px 0;
        border-top: 1px solid color-mix(in srgb, var(--line, #30363d) 55%, transparent); }
      .prof-item p { margin: 2px 0 0; flex: 1; }
      .prof-rate { display: flex; gap: 4px; flex-shrink: 0; }
      .prof-rate button { width: 26px; height: 26px; border-radius: 6px; cursor: pointer;
        border: 1px solid var(--line, #30363d); background: transparent;
        color: var(--muted, #8b949e); font-size: 13px; font-weight: 700; line-height: 1; }
      .prof-rate button:hover { border-color: var(--accent, #79c0ff); }
      .prof-rate button[aria-pressed="true"][data-r="can"]   { background:#23863633; border-color:#3fb950; color:#3fb950; }
      .prof-rate button[aria-pressed="true"][data-r="shaky"] { background:#9e6a0333; border-color:#d29922; color:#d29922; }
      .prof-rate button[aria-pressed="true"][data-r="cant"]  { background:#da363333; border-color:#f85149; color:#f85149; }
      .prof-item.rated-can p { color: var(--muted, #8b949e); }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const root = document.createElement('section');
    root.className = 'prof';
    root.innerHTML =
      `<div class="prof-head">
         <span class="prof-title">Work-ready check · ${topic.title}</span>
         <span class="prof-sub" id="prof-sub"></span>
       </div>
       <div class="prof-bar"><i id="prof-fill"></i></div>
       <div class="prof-focus" id="prof-focus"></div>
       <div id="prof-list"></div>`;
    document.body.appendChild(root);

    const list = root.querySelector('#prof-list');
    let lastPhase = -1;
    items.forEach((it) => {
      if (it.phaseIndex !== lastPhase) {
        lastPhase = it.phaseIndex;
        const ph = DATA.phases[it.phaseIndex];
        const h = document.createElement('div');
        h.className = 'prof-phase';
        h.innerHTML = `${ph.name} <span>· ${ph.hint}</span>`;
        list.appendChild(h);
      }
      const row = document.createElement('div');
      row.className = 'prof-item';
      row.dataset.id = it.id;
      const btns = RATINGS.map((r) =>
        `<button data-r="${r.key}" title="${r.label}" aria-pressed="false">${r.sym}</button>`).join('');
      row.innerHTML = `<div class="prof-rate">${btns}</div><p>${it.text}</p>`;
      row.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
          const r = b.dataset.r;
          state[it.id] = state[it.id] === r ? undefined : r; // click again to clear
          save();
          refresh();
        });
      });
      list.appendChild(row);
    });

    function refresh() {
      items.forEach((it) => { it.rating = state[it.id]; });
      // paint each row's buttons + done styling
      list.querySelectorAll('.prof-item').forEach((row) => {
        const r = state[row.dataset.id];
        row.classList.toggle('rated-can', r === 'can');
        row.querySelectorAll('button').forEach((b) =>
          b.setAttribute('aria-pressed', String(b.dataset.r === r)));
      });
      const can = items.filter((i) => i.rating === 'can').length;
      const rated = items.filter((i) => i.rating).length;
      root.querySelector('#prof-fill').style.width = (100 * can / items.length) + '%';
      root.querySelector('#prof-sub').textContent =
        `${can}/${items.length} work-ready · ${rated} rated`;
      // focus recommendation (human-authored policy)
      const focusEl = root.querySelector('#prof-focus');
      const g = nextGap(items);
      if (g) {
        focusEl.classList.remove('done');
        focusEl.innerHTML = `Focus next → <b>${g.phaseName}:</b> ${g.text}`;
      } else if (can === items.length) {
        focusEl.classList.add('done');
        focusEl.innerHTML = `<b>All ${items.length} capabilities marked work-ready.</b> Ship it.`;
      } else {
        focusEl.classList.remove('done');
        focusEl.innerHTML = `Rate the items below to get a focus recommendation.`;
      }
    }

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

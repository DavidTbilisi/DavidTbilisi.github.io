/* encoding-check.js — injects a compact "have I ENCODED this topic?" strip.
 * A breadth/depth scan across your Neural OS memory methods. UNIVERSAL: the
 * method set is identical for every topic, so this renders on ANY walkthrough
 * that includes it — no per-topic data required.
 *
 * Pairs with (but is orthogonal to) proficiency-check.js:
 *   - proficiency-check.js = depth of DOING ("can I ship this at work?")
 *   - encoding-check.js     = encoding COVERAGE ("have I run it through my
 *                             memory methods — mnemonic, drill, hand-drawn…?")
 *
 * Reads window.ENCODING_CHECK.methods (load encoding-data.js first):
 *   <script src="tools/explain-viz/encoding-data.js" defer></script>
 *   <script src="tools/explain-viz/encoding-check.js" defer></script>
 *
 * Per method, clicking the chip cycles: none ○ → started ◐ → solid ● → none.
 * Persisted under localStorage key  enc:<stem>.
 */
(function () {
  const CYCLE = ['', 'started', 'solid'];
  const SYM = { '': '○', started: '◐', solid: '●' };
  const next = (s) => CYCLE[(CYCLE.indexOf(s || '') + 1) % CYCLE.length];

  function init() {
    const DATA = window.ENCODING_CHECK;
    const methods = DATA && Array.isArray(DATA.methods) ? DATA.methods : [];
    if (!methods.length) return; // nothing to show until the methods are authored

    const stem = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
    const STORE = 'enc:' + stem;
    let state = {};
    try { state = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { state = {}; }
    const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} };

    const css = `
      .enc { max-width: 1200px; margin: 32px auto 0; padding: 18px 24px 6px;
        border-top: 1px solid var(--line, #30363d);
        font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: var(--text, #e6edf3); }
      .enc-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
      .enc-title { font-size: 11px; text-transform: uppercase; letter-spacing: .1em;
        font-weight: 600; color: var(--muted, #8b949e); }
      .enc-sub { font-size: 12.5px; color: var(--muted, #8b949e); }
      .enc-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 6px; }
      .enc-chip { display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
        padding: 7px 12px; border-radius: 999px; user-select: none;
        border: 1px solid var(--line, #30363d); background: transparent;
        color: var(--text, #e6edf3); font-size: 13px; transition: border-color .15s, background .15s; }
      .enc-chip:hover { border-color: var(--accent, #79c0ff); }
      .enc-chip .enc-mark { font-size: 13px; color: var(--muted, #8b949e); }
      .enc-chip .enc-hint { font-size: 11.5px; color: var(--muted, #8b949e); }
      .enc-chip[data-s="started"] { background:#9e6a0322; border-color:#d29922; }
      .enc-chip[data-s="started"] .enc-mark { color:#d29922; }
      .enc-chip[data-s="solid"]   { background:#23863622; border-color:#3fb950; }
      .enc-chip[data-s="solid"] .enc-mark { color:#3fb950; }
      .enc-next { margin: 4px 0 12px; font-size: 12.5px; color: var(--muted, #8b949e); }
      .enc-next b { color: var(--accent, #79c0ff); font-weight: 600; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const root = document.createElement('section');
    root.className = 'enc';
    root.innerHTML =
      `<div class="enc-head">
         <span class="enc-title">Encoded?${DATA.title ? ' · ' + DATA.title : ''}</span>
         <span class="enc-sub" id="enc-sub"></span>
       </div>
       <div class="enc-row" id="enc-row"></div>
       <div class="enc-next" id="enc-next"></div>`;

    const row = root.querySelector('#enc-row');
    methods.forEach((m) => {
      const chip = document.createElement('button');
      chip.className = 'enc-chip';
      chip.dataset.key = m.key;
      chip.innerHTML =
        `<span class="enc-mark">${SYM['']}</span>` +
        `<span>${m.icon ? m.icon + ' ' : ''}${m.label}</span>` +
        (m.hint ? `<span class="enc-hint">${m.hint}</span>` : '');
      chip.title = m.hint || m.label;
      chip.addEventListener('click', () => {
        state[m.key] = next(state[m.key]);
        if (!state[m.key]) delete state[m.key];
        save();
        refresh();
      });
      row.appendChild(chip);
    });

    function refresh() {
      row.querySelectorAll('.enc-chip').forEach((chip) => {
        const s = state[chip.dataset.key] || '';
        chip.dataset.s = s;
        chip.querySelector('.enc-mark').textContent = SYM[s];
      });
      const touched = methods.filter((m) => state[m.key]).length;
      const solid = methods.filter((m) => state[m.key] === 'solid').length;
      root.querySelector('#enc-sub').textContent =
        `${touched}/${methods.length} encoded · ${solid} solid`;
      const gap = methods.find((m) => !state[m.key]);
      const nextEl = root.querySelector('#enc-next');
      if (gap) {
        nextEl.innerHTML = `Next encoding pass → <b>${gap.label}</b>${gap.hint ? ' — ' + gap.hint : ''}`;
      } else if (solid < methods.length) {
        nextEl.innerHTML = `All methods touched. Push the ◐ chips to ● to lock it in.`;
      } else {
        nextEl.innerHTML = `Fully encoded across all ${methods.length} methods. This topic is yours.`;
      }
    }

    // Sit the breadth strip ABOVE the deeper work-ready check if both are present.
    const prof = document.querySelector('.prof');
    if (prof) prof.parentNode.insertBefore(root, prof);
    else document.body.appendChild(root);

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

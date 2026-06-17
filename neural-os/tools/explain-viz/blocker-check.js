/* blocker-check.js — injects a "why am I stalling?" triage panel.
 * Diagnoses the AFFECTIVE blocker (why you won't engage) that the proficiency
 * and encoding checks can't see, because they only measure known territory.
 *
 * Sits at the TOP of the injected stack (above encoding + work-ready): you
 * diagnose the blocker first, and it routes you to the right next instrument.
 *
 * Reads window.BLOCKER_TRIAGE.blockers (load blocker-data.js first):
 *   <script src="tools/explain-viz/blocker-data.js" defer></script>
 *   <script src="tools/explain-viz/blocker-check.js" defer></script>
 *
 * Click a friction to mark it biting; the engine surfaces the highest-priority
 * active one (list order = repair order) as "start here". Per-topic state is
 * persisted under localStorage key  blk:<stem>.
 */
(function () {
  function init() {
    const DATA = window.BLOCKER_TRIAGE;
    const blockers = DATA && Array.isArray(DATA.blockers) ? DATA.blockers : [];
    if (!blockers.length) return;

    const stem = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
    const STORE = 'blk:' + stem;
    let state = {};
    try { state = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { state = {}; }
    const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} };

    const css = `
      .blk { max-width: 1200px; margin: 36px auto 0; padding: 22px 24px 14px;
        border-top: 1px solid var(--line, #30363d);
        font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: var(--text, #e6edf3); }
      .blk-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
      .blk-title { font-size: 11px; text-transform: uppercase; letter-spacing: .1em;
        font-weight: 600; color: var(--muted, #8b949e); }
      .blk-sub { font-size: 12.5px; color: var(--muted, #8b949e); }
      .blk-rx { margin: 12px 0 16px; font-size: 13.5px; padding: 11px 14px; border-radius: 8px;
        border: 1px solid var(--line, #30363d); background: var(--panel, #161b22); }
      .blk-rx b { color: var(--accent, #79c0ff); }
      .blk-list { display: flex; flex-direction: column; gap: 8px; }
      .blk-card { text-align: left; cursor: pointer; padding: 11px 14px; border-radius: 9px;
        border: 1px solid var(--line, #30363d); background: transparent; color: var(--text, #e6edf3);
        display: flex; gap: 11px; align-items: flex-start; transition: border-color .15s, background .15s; }
      .blk-card:hover { border-color: var(--accent, #79c0ff); }
      .blk-dot { flex-shrink: 0; width: 16px; height: 16px; margin-top: 2px; border-radius: 999px;
        border: 1.5px solid var(--muted, #8b949e); }
      .blk-card[data-on="1"] { border-color: #f85149; background: #da363318; }
      .blk-card[data-on="1"] .blk-dot { background: #f85149; border-color: #f85149; }
      .blk-body { flex: 1; }
      .blk-label { font-weight: 600; font-size: 13.5px; }
      .blk-tell { color: var(--muted, #8b949e); font-size: 12.5px; margin-top: 2px; font-style: italic; }
      .blk-fix { font-size: 12.5px; margin-top: 7px; display: none; }
      .blk-fix b { color: #3fb950; font-weight: 600; }
      .blk-card[data-on="1"] .blk-fix { display: block; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const root = document.createElement('section');
    root.className = 'blk';
    root.innerHTML =
      `<div class="blk-head">
         <span class="blk-title">${DATA.title || 'Why am I stalling?'}</span>
         <span class="blk-sub">Click the friction you feel when you stall — the italic line is the tell.</span>
       </div>
       <div class="blk-rx" id="blk-rx"></div>
       <div class="blk-list" id="blk-list"></div>`;

    const list = root.querySelector('#blk-list');
    blockers.forEach((b) => {
      const card = document.createElement('button');
      card.className = 'blk-card';
      card.dataset.key = b.key;
      card.innerHTML =
        `<span class="blk-dot"></span>
         <span class="blk-body">
           <span class="blk-label">${b.label}</span>
           <div class="blk-tell">“${b.tell}”</div>
           <div class="blk-fix"><b>Fix →</b> ${b.fix}</div>
         </span>`;
      card.addEventListener('click', () => {
        if (state[b.key]) delete state[b.key]; else state[b.key] = 1;
        save();
        refresh();
      });
      list.appendChild(card);
    });

    function refresh() {
      list.querySelectorAll('.blk-card').forEach((card) => {
        card.dataset.on = state[card.dataset.key] ? '1' : '0';
      });
      // highest-priority active blocker (list order = repair order) = start here
      const primary = blockers.find((b) => state[b.key]);
      const rx = root.querySelector('#blk-rx');
      const count = blockers.filter((b) => state[b.key]).length;
      if (primary) {
        const more = count > 1 ? ` <span class="blk-sub">(+${count - 1} more flagged — fix this one first)</span>` : '';
        rx.innerHTML = `Start here → <b>${primary.label}.</b> ${primary.fix}${more}`;
      } else {
        rx.innerHTML = `<span class="blk-sub">Nothing flagged yet. Read the six tells below and mark the one that matches what you actually feel — you can't name a blocker you can't see, but you can recognise it.</span>`;
      }
    }

    // Sit ABOVE the encoding strip and the work-ready check if present.
    const anchor = document.querySelector('.enc') || document.querySelector('.prof');
    if (anchor) anchor.parentNode.insertBefore(root, anchor);
    else document.body.appendChild(root);

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

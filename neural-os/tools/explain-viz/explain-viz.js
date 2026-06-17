/* explain-viz — shared runtime for /explain walkthroughs.
 *
 * Data model (current — matrix form):
 *   Explain.init({
 *     title, subtitle, created, svg, code,
 *     matrix: {
 *       'u-see':     { name, framework, steps: [...] },
 *       'd-name':    { name, framework, steps: [...] },
 *       ...
 *       'bridge':    { name, framework, steps: [...] },
 *     },
 *     rowOrder?: ['u-see', 'd-name', ...]   // optional override of default
 *   })
 *
 * Backward-compat: `steps: [...]` at the top level is auto-wrapped into
 * a single-row matrix under 'u-see' with framework 'CAST'.
 *
 * Step object (unchanged):
 *   { layer, title, narration, codeLines, onEnter, onExit, choices? }
 *
 * Default representation rows (UMTF-dim layer, per wiki):
 *   u-see (CAST) · d-name (NEDF) · f-do (SPEAR) · b-watch (HEART)
 *   · l-predict (ORACLE) · r-act (GRACE) · bridge (cross-domain)
 *
 * The sidebar is a 7-row × 5-column matrix (rep × Bloom layer).
 * Each cell is a jump target if that (row, layer) has at least one step.
 */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const LAYERS = ['recognize', 'understand', 'apply', 'analyze', 'synthesize'];
  const LAYER_CODES = { recognize: 'R', understand: 'U', apply: 'A', analyze: 'An', synthesize: 'S' };
  const DEFAULT_ROW_ORDER = ['u-see', 'd-name', 'f-do', 'b-watch', 'l-predict', 'r-act', 'bridge'];

  const state = {
    matrix: {},
    rowOrder: [],
    rowKey: null,
    idx: 0,
    answered: new Set(), // 'rowKey:idx'
    mode: 'learning',
    fileKey: null,
  };

  const api = {
    get step() { return state.idx; },
    get rowKey() { return state.rowKey; },
    get mode() { return state.mode; },

    glow(t) { resolve(t).forEach(e => e.classList.add('glow')); return api; },
    unglow(t) { resolve(t).forEach(e => e.classList.remove('glow')); return api; },
    dim(t) { resolve(t).forEach(e => e.classList.add('dim')); return api; },
    undim(t) { resolve(t).forEach(e => e.classList.remove('dim')); return api; },
    activate(t) { resolve(t).forEach(e => e.classList.add('active')); return api; },
    deactivate(t) { resolve(t).forEach(e => e.classList.remove('active')); return api; },
    reset() {
      $$('.viz-node, .viz-edge').forEach(e => e.classList.remove('glow','dim','active'));
      return api;
    },
    highlightCode(lines) {
      $$('.code .ln').forEach((ln, i) => ln.classList.toggle('hl', lines.includes(i + 1)));
      return api;
    },
  };

  function resolve(target) {
    if (typeof target === 'string') {
      if (target.startsWith('#') || target.startsWith('.')) return $$(target);
      const el = document.getElementById(target);
      return el ? [el] : [];
    }
    if (target instanceof Element) return [target];
    if (Array.isArray(target)) return target.flatMap(resolve);
    return [];
  }

  function computeMode(created) {
    if (!created) return 'learning';
    const createdMs = Date.parse(created);
    const lastKey = `${state.fileKey}:lastReviewed:${state.rowKey || 'u-see'}`;
    const lastReviewedMs = parseInt(localStorage.getItem(lastKey) || '0', 10);
    const effectiveStart = Math.max(createdMs, lastReviewedMs);
    const days = (Date.now() - effectiveStart) / 86400000;
    if (days < 3)  return 'learning';
    if (days < 7)  return 'recall';
    if (days < 21) return 'predict-first';
    return 'cold-review';
  }

  function currentRow() { return state.matrix[state.rowKey]; }
  function currentSteps() { return currentRow() ? currentRow().steps : []; }
  function currentStep() { return currentSteps()[state.idx]; }

  function setCell(rowKey, layer) {
    const row = state.matrix[rowKey];
    if (!row || !row.steps.length) return;
    let idx = 0;
    if (layer) {
      const found = row.steps.findIndex(s => s.layer === layer);
      if (found >= 0) idx = found;
    }
    state.rowKey = rowKey;
    state.idx = idx;
    state.mode = computeMode(currentRow().created || null);
    api.reset();
    render();
  }

  function render() {
    const s = currentStep();
    if (!s) return;
    const row = currentRow();

    // sidebar — highlight active cell
    $$('.matrix-cell').forEach(c => {
      c.classList.toggle('active',
        c.dataset.row === state.rowKey && c.dataset.layer === s.layer);
    });
    $$('.matrix-row').forEach(r => {
      r.classList.toggle('active-row', r.dataset.row === state.rowKey);
    });

    // header
    $('#curr').textContent = state.idx + 1;
    $('#total').textContent = currentSteps().length;
    $('#title').textContent = `${row.name} · ${row.framework} — ${s.title || ''}`;
    const pill = $('#layer-pill');
    pill.dataset.layer = s.layer;
    pill.textContent = s.layer;

    // narration
    $('#narration').innerHTML = s.narration || '';
    $$('#narration .wikilink').forEach(a => {
      a.addEventListener('click', () => {
        const page = a.dataset.wiki;
        if (page) window.location.href = `obsidian://open?vault=Neural-OS-Research&file=${encodeURIComponent('wiki/' + page)}`;
      });
    });

    // choices (Apply / Analyze gates)
    const choiceBox = $('#choices');
    choiceBox.innerHTML = '';
    const feedback = $('#feedback');
    feedback.className = 'feedback';
    feedback.textContent = '';
    const cellKey = state.rowKey + ':' + state.idx;
    const needsChoice = (s.layer === 'apply' || s.layer === 'analyze') && Array.isArray(s.choices);
    if (needsChoice) {
      s.choices.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.textContent = c.label;
        b.addEventListener('click', () => onPick(i, b, s));
        choiceBox.appendChild(b);
      });
    }

    if (Array.isArray(s.codeLines)) api.highlightCode(s.codeLines);
    if (typeof s.onEnter === 'function') s.onEnter(api);

    // predict-first / cold-review viz hide
    const vizWrap = $('#viz-wrap');
    if (vizWrap && (state.mode === 'predict-first' || state.mode === 'cold-review')) {
      vizWrap.classList.add('hidden-for-predict');
      vizWrap.onclick = () => vizWrap.classList.remove('hidden-for-predict');
    } else if (vizWrap) {
      vizWrap.classList.remove('hidden-for-predict');
    }

    if (state.mode === 'recall' && s.layer === 'recognize') { next(); return; }

    // progress
    $('#progress-bar').style.width = (100 * (state.idx + 1) / currentSteps().length) + '%';

    // nav
    $('#prev').disabled = state.idx === 0;
    const isLast = state.idx === currentSteps().length - 1;
    $('#next').disabled = needsChoice && !state.answered.has(cellKey);
    $('#next').textContent = isLast ? 'Done' : 'Next ›';

    // self-rate (cold review only, on last step of row)
    const selfRate = $('#self-rate');
    if (selfRate) {
      const showSelfRate = isLast && state.mode === 'cold-review'
        && (!needsChoice || state.answered.has(cellKey));
      selfRate.classList.toggle('on', showSelfRate);
    }
  }

  function onPick(i, btn, step) {
    const c = step.choices[i];
    $$('#choices .choice').forEach(b => b.disabled = true);
    btn.classList.add('picked', c.correct ? 'correct' : 'wrong');
    const fb = $('#feedback');
    fb.classList.add(c.correct ? 'correct' : 'wrong');
    fb.textContent = (c.correct ? '✓ ' : '✗ ') + (c.reason || (c.correct ? 'Correct.' : 'Not quite.'));
    state.answered.add(state.rowKey + ':' + state.idx);
    render();
  }

  function next() {
    const s = currentStep();
    if (typeof s?.onExit === 'function') s.onExit(api);
    if (state.idx < currentSteps().length - 1) {
      state.idx++;
      api.reset();
      render();
    } else {
      // end of row — record per-row last-reviewed
      localStorage.setItem(`${state.fileKey}:lastReviewed:${state.rowKey}`, String(Date.now()));
    }
  }

  function prev() {
    const s = currentStep();
    if (typeof s?.onExit === 'function') s.onExit(api);
    if (state.idx > 0) { state.idx--; api.reset(); render(); }
  }

  function onSelfRate(rating) {
    const offsets = { easy: 60, medium: 21, hard: 7, forgot: 1 };
    const nextMs = Date.now() + offsets[rating] * 86400000;
    localStorage.setItem(`${state.fileKey}:nextReview:${state.rowKey}`, String(nextMs));
    localStorage.setItem(`${state.fileKey}:lastResult:${state.rowKey}`, rating);
    const fb = $('#self-rate-feedback');
    if (fb) fb.textContent = `Saved. ${currentRow().name} next review in ${offsets[rating]} day${offsets[rating]===1?'':'s'}.`;
  }

  function buildMatrixSidebar() {
    const headerCols = LAYERS.map(l =>
      `<div class="matrix-collabel" title="${l}">${LAYER_CODES[l]}</div>`).join('');

    const rowsHtml = state.rowOrder.map(rk => {
      const row = state.matrix[rk];
      if (!row) return '';
      const cells = LAYERS.map(layer => {
        const has = row.steps.some(s => s.layer === layer);
        return `<div class="matrix-cell ${has ? 'filled' : 'empty'}"
                     data-row="${rk}" data-layer="${layer}"
                     title="${row.name} · ${layer}${has ? '' : ' (empty)'}">
                  <span class="dot"></span>
                </div>`;
      }).join('');
      const totalSteps = row.steps.length;
      return `<div class="matrix-row" data-row="${rk}">
                <div class="matrix-rowlabel">
                  <span class="rk">${row.name}</span>
                  <span class="fk">${row.framework}${totalSteps ? ` · ${totalSteps}` : ''}</span>
                </div>
                ${cells}
              </div>`;
    }).join('');

    return `<aside class="matrix">
              <div class="matrix-title">Representation × Level</div>
              <div class="matrix-header">
                <div class="matrix-rowlabel"></div>
                ${headerCols}
              </div>
              ${rowsHtml}
            </aside>`;
  }

  function buildChrome(opts) {
    const root = document.body;
    state.fileKey = 'walkthrough:' + (location.pathname.split('/').pop() || 'unknown');
    state.mode = computeMode(opts.created);

    root.innerHTML = `
      <div class="app has-matrix">
        <div class="review-banner" data-mode="${state.mode}" id="review-banner"></div>
        <header>
          <h1>${opts.title} <small>— ${opts.subtitle || 'a visual walkthrough'}</small></h1>
          <div class="step-count">
            <span class="layer-pill" id="layer-pill" data-layer="recognize"></span>
            Step <span id="curr">1</span> of <span id="total">1</span> · <span id="title"></span>
          </div>
        </header>
        <main>
          ${buildMatrixSidebar()}
          <div class="center-col">
            <div class="panel panel-viz">
              <div class="label">Visualization</div>
              <div class="viz-wrap" id="viz-wrap">${opts.svg || '<svg></svg>'}</div>
            </div>
            <div class="panel panel-narration">
              <div class="label">Narration</div>
              <div class="narration" id="narration"></div>
              <div class="choices" id="choices"></div>
              <span class="feedback" id="feedback"></span>
            </div>
          </div>
          <div class="panel panel-code">
            <div class="label">Code</div>
            <div class="code" id="code">${opts.code || ''}</div>
          </div>
        </main>
        <div class="self-rate" id="self-rate">
          <button data-rate="forgot">Forgot</button>
          <button data-rate="hard">Hard</button>
          <button data-rate="medium">Medium</button>
          <button data-rate="easy">Easy</button>
        </div>
        <span class="hint" id="self-rate-feedback"></span>
        <nav>
          <button id="prev">‹ Prev</button>
          <div class="progress"><div id="progress-bar"></div></div>
          <button id="next">Next ›</button>
        </nav>
        <div class="hint">← / → step within the active row · click any sidebar cell to jump</div>
      </div>
    `;

    const banners = {
      learning: '',
      recall: 'Review · Recall mode · Recognize steps auto-skipped',
      'predict-first': 'Review · Predict-first · click viz to reveal each step',
      'cold-review': 'Cold review · predict + self-rate at the end of each row',
    };
    $('#review-banner').textContent = banners[state.mode];

    $('#next').addEventListener('click', next);
    $('#prev').addEventListener('click', prev);
    $$('#self-rate button').forEach(b => b.addEventListener('click', () => onSelfRate(b.dataset.rate)));
    $$('.matrix-cell.filled').forEach(cell => {
      cell.addEventListener('click', () => setCell(cell.dataset.row, cell.dataset.layer));
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' && !$('#next').disabled) next();
      else if (e.key === 'ArrowLeft' && !$('#prev').disabled) prev();
    });
  }

  function normalizeInput(opts) {
    if (opts.matrix) {
      state.matrix = opts.matrix;
      state.rowOrder = opts.rowOrder
        || DEFAULT_ROW_ORDER.filter(k => opts.matrix[k]);
      // append any extra rows not in default order
      Object.keys(opts.matrix).forEach(k => {
        if (!state.rowOrder.includes(k)) state.rowOrder.push(k);
      });
    } else if (opts.steps) {
      state.matrix = { 'u-see': { name: 'U — See', framework: 'CAST', steps: opts.steps } };
      state.rowOrder = ['u-see'];
    }
    state.rowKey = state.rowOrder.find(k => state.matrix[k] && state.matrix[k].steps.length)
      || state.rowOrder[0];
    state.idx = 0;
  }

  window.Explain = {
    init(opts) {
      normalizeInput(opts);
      buildChrome(opts);
      render();
    },
    setCell,
    ...api,
  };
})();

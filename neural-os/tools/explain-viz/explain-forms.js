/* explain-forms — pack runtime for multi-representation /explain packs.
 *
 * A "pack" is ONE topic shown through several FORMS (representations),
 * composed by a hub with a form-switcher. Light forms (diagram/table/graph)
 * render inline; heavy forms (sim/3d) link out to their own files.
 *
 * This is the third axis the matrix walkthrough was missing:
 *   depth (Bloom) × cognitive function (UMTF rows) × FORM (this file).
 * The UMTF matrix walkthrough is itself just ONE form here: kind 'diagram'.
 *
 *   ExplainPack.init({
 *     title, kicker?, subtitle?, model?, created?,
 *     forms: [ { key, name, sub?, why?, kind, candidate?, ...kindData } ],
 *     heavy?: [ { name, sub?, href } ],     // link-outs to heavy forms
 *     footer?: [ { label, href, internal? } ]
 *   })
 *
 * Form kinds (extend RENDERERS to add more — timeline, derivation, sim, 3d):
 *   'diagram' | 'embed' : { src }                         -> iframe to a standalone form
 *   'table'             : { table:{ cols:[c1,c2], rows:[[a,b,gloss,keystone?]], quiz? } }
 *   'graph'             : { graph:{ viewBox?, wikiBase?, nodes:[{id,x,y,w?,label,wiki?,gloss?}],
 *                                   edges:[{a,b,label?,dashed?}] } }
 */
(function () {
  const $ = (s, r = document) => r.querySelector(s);

  function init(pack) {
    document.body.innerHTML = chrome(pack);
    const root = $('#pack-panels');
    pack.forms.forEach((f, i) => {
      const panel = document.createElement('section');
      panel.className = 'formpanel' + (i === 0 ? ' active' : '');
      panel.dataset.form = f.key;
      const r = (RENDERERS[f.kind] || RENDERERS.embed)(f);
      panel.innerHTML =
        (f.why ? `<div class="why">${f.why}</div>` : '') +
        (f.candidate ? `<div class="candidate-banner">Candidate representation — keep, edit, reorder, or remove during curation.</div>` : '') +
        r.html;
      root.appendChild(panel);
      if (r.wire) r.wire(panel, f);
    });
    wireTabs();
  }

  function chrome(p) {
    const tabs = p.forms.map((f, i) =>
      `<button class="formtab${i === 0 ? ' active' : ''}${f.candidate ? ' candidate' : ''}" data-form="${f.key}">
         <span class="ft-name">${f.name}</span><span class="ft-sub">${f.sub || ''}</span>
       </button>`).join('');
    const heavy = (p.heavy || []).map(h =>
      `<a class="formtab heavy" href="${h.href}" target="_blank" rel="noopener">
         <span class="ft-name">${h.name}</span><span class="ft-sub">${h.sub || ''}</span>
       </a>`).join('');
    const foot = (p.footer || autoFooter(p)).map(l =>
      `<a href="${l.href}"${l.internal ? '' : ' target="_blank"'}>${l.label}</a>`).join('');
    return `
      <div class="pack">
        <header>
          ${p.kicker ? `<div class="kicker">${p.kicker}</div>` : ''}
          <h1>${p.title}${p.subtitle ? ` <small>${p.subtitle}</small>` : ''}</h1>
        </header>
        ${p.model ? `<div class="model">${p.model}</div>` : ''}
        <div class="formbar" id="pack-formbar">${tabs}${heavy}</div>
        <div id="pack-panels"></div>
        <footer class="packfoot">
          <span>Representations of one topic. Each is independently shareable.</span>${foot}
        </footer>
      </div>`;
  }

  function autoFooter(p) {
    const links = [];
    p.forms.forEach(f => {
      if ((f.kind === 'diagram' || f.kind === 'embed') && f.src) links.push({ label: f.name + ' ↗', href: f.src });
    });
    (p.heavy || []).forEach(h => links.push({ label: h.name, href: h.href }));
    links.push({ label: 'All walkthroughs ↗', href: 'walkthroughs.html', internal: true });
    return links;
  }

  function wireTabs() {
    $('#pack-formbar').addEventListener('click', (e) => {
      const tab = e.target.closest('.formtab');
      if (!tab || tab.classList.contains('heavy')) return;   // heavy forms are real links
      const key = tab.dataset.form;
      document.querySelectorAll('.formtab').forEach(b => b.classList.toggle('active', b === tab));
      document.querySelectorAll('.formpanel').forEach(pn => pn.classList.toggle('active', pn.dataset.form === key));
    });
  }

  // ── renderers ───────────────────────────────────────────────────
  function renderEmbed(f) {
    return { html: `<iframe class="form-frame" src="${f.src}" title="${f.name}"></iframe>` };
  }

  function renderTable(f) {
    const t = f.table;
    const rows = t.rows.map((r, i) =>
      `<tr class="${r[3] ? 'keystone' : ''}" data-i="${i}"><td class="logic">${r[0]}</td><td class="comp">${r[1]}</td></tr>`).join('');
    const html = `
      <div class="ch-wrap">
        <table class="ch">
          <thead><tr><th class="logic">${t.cols[0]}</th><th class="comp">${t.cols[1]}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="ch-gloss">Click any row to see how the two sides line up.</div>
      ${t.quiz ? `<div class="quizbox"></div>` : ''}`;
    return {
      html,
      wire(panel) {
        const gloss = panel.querySelector('.ch-gloss');
        panel.querySelectorAll('table.ch tbody tr').forEach(tr => {
          tr.addEventListener('click', () => {
            panel.querySelectorAll('table.ch tbody tr').forEach(x => x.classList.remove('sel'));
            tr.classList.add('sel');
            const r = t.rows[+tr.dataset.i];
            gloss.innerHTML = `<b>${r[0]}</b> &nbsp;≈&nbsp; <b>${r[1]}</b><br>${r[2] || ''}`;
          });
        });
        if (t.quiz) wireQuiz(panel.querySelector('.quizbox'), t.quiz);
      },
    };
  }

  function wireQuiz(box, q) {
    box.innerHTML = `<div class="q">${q.prompt}</div>
      <div class="choices">${q.options.map((o, i) => `<button class="choice" data-i="${i}">${o.label}</button>`).join('')}</div>
      <span class="feedback"></span>`;
    const fb = box.querySelector('.feedback');
    box.querySelectorAll('.choice').forEach(btn => btn.addEventListener('click', () => {
      const o = q.options[+btn.dataset.i];
      box.querySelectorAll('.choice').forEach(b => b.disabled = true);
      btn.classList.add('picked', o.correct ? 'correct' : 'wrong');
      fb.className = 'feedback ' + (o.correct ? 'correct' : 'wrong');
      fb.textContent = (o.correct ? '✓ ' : '✗ ') + (o.reason || '');
    }));
  }

  function renderGraph(f) {
    const g = f.graph;
    const N = Object.fromEntries(g.nodes.map(n => [n.id, n]));
    const H = 30;
    const edgeSvg = g.edges.map((e) => {
      const A = N[e.a], B = N[e.b];
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      const lbl = e.label ? `<text class="gelabel" x="${mx}" y="${my - 4}" text-anchor="middle">${e.label}</text>` : '';
      return `<line class="gedge ${e.dashed ? 'dashed' : ''}" data-a="${e.a}" data-b="${e.b}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"></line>${lbl}`;
    }).join('');
    const nodeSvg = g.nodes.map(n => {
      const w = n.w || 150;
      return `<g class="gnode" data-id="${n.id}">
                <rect x="${n.x - w / 2}" y="${n.y - H}" width="${w}" height="${2 * H}" rx="9"></rect>
                <text x="${n.x}" y="${n.y + 4}" text-anchor="middle">${n.label}</text>
              </g>`;
    }).join('');
    const html = `<div class="graph-wrap"><svg viewBox="${g.viewBox || '0 0 980 500'}">${edgeSvg}${nodeSvg}</svg></div>
      <div class="graph-gloss">Click any concept to trace its connections${g.wikiBase ? ' and open its wiki page' : ''}.</div>`;
    return {
      html,
      wire(panel) {
        const gloss = panel.querySelector('.graph-gloss');
        panel.querySelectorAll('.gnode').forEach(gn => {
          gn.addEventListener('click', () => {
            const id = gn.dataset.id, n = N[id];
            const inc = new Set();
            panel.querySelectorAll('.gedge').forEach(ln => {
              const hit = ln.dataset.a === id || ln.dataset.b === id;
              ln.classList.toggle('lit', hit);
              ln.classList.toggle('dim', !hit);
              if (hit) { inc.add(ln.dataset.a); inc.add(ln.dataset.b); }
            });
            panel.querySelectorAll('.gnode').forEach(o => {
              o.classList.toggle('sel', o.dataset.id === id);
              o.classList.toggle('dim', !inc.has(o.dataset.id) && o.dataset.id !== id);
            });
            const link = (n.wiki && g.wikiBase) ? ` <a data-wiki="${n.wiki}">open [[${n.wiki}]]</a>` : '';
            gloss.innerHTML = `<b style="color:var(--pick)">${n.label}</b> — ${n.gloss || ''}${link}`;
            const a = gloss.querySelector('a[data-wiki]');
            if (a) a.addEventListener('click', () => {
              // a node's `wiki` may be a bare name (prepend wikiBase) OR an
              // absolute `wiki/<folder>/<page>` path (used it as-is) — packs
              // that span multiple wiki folders need the absolute form.
              const w = a.dataset.wiki;
              const file = w.indexOf('wiki/') === 0 ? w : (g.wikiBase + w);
              window.location.href = `obsidian://open?vault=Neural-OS-Research&file=` + encodeURIComponent(file);
            });
          });
        });
      },
    };
  }

  const RENDERERS = { diagram: renderEmbed, embed: renderEmbed, table: renderTable, graph: renderGraph };

  window.ExplainPack = { init, RENDERERS };
})();

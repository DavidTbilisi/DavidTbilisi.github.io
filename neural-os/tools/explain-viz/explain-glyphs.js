/* explain-glyphs — high-quality on-demand SVG glyphs for /explain walkthroughs.
 *
 *  Usage:
 *    const svg = `
 *      <svg viewBox="0 0 600 400">
 *        ${Explain.svgDefs()}
 *        ${Explain.glyph('document', { x: 100, y: 80, id: 'doc-1', label: 'Document', sub: 'Draft' })}
 *        ${Explain.glyph('server',   { x: 300, y: 80, id: 'web',   label: 'Web' })}
 *        ${Explain.glyph('arrow',    { from: [140, 80], to: [260, 80], id: 'e1', label: 'publish()' })}
 *      </svg>`;
 *
 *  Every glyph:
 *    - centers at (x, y) — transforms work without offset math
 *    - emits `class="viz-node"` so .glow/.dim/.undim work uniformly
 *    - reads color from CSS vars by default — pass color: 'var(--l3)' to theme per layer
 *    - returns a <g>...</g> string (no DOM)
 */

(function () {
  if (!window.Explain) { console.error('explain-glyphs requires explain-viz.js loaded first'); return; }

  // Canonical shared <defs>: arrowheads, drop-shadow, gradient stops.
  const SVG_DEFS = `
    <defs>
      <marker id="arrowF" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6"
              orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 Z" fill="currentColor" />
      </marker>
      <marker id="arrowB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6"
              orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 Z" fill="currentColor" opacity="0.7" />
      </marker>
      <filter id="glyphShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.35"/>
      </filter>
      <linearGradient id="panelGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1c232c"/>
        <stop offset="1" stop-color="#161b22"/>
      </linearGradient>
    </defs>`;

  const attrId  = a => a.id ? ` id="${a.id}"` : '';
  const attrCls = a => `viz-node${a.cls ? ' ' + a.cls : ''}`;
  const color   = (a, fallback = 'var(--accent)') => a.color || fallback;
  const stroke  = 'stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"';

  // Common label rendering — placed below the glyph, centered.
  const lbl = (x, y, text, sub) => {
    if (!text && !sub) return '';
    return `
      ${text ? `<text x="${x}" y="${y + 4}" text-anchor="middle"
                     fill="var(--text)" font="600 12px sans-serif">${text}</text>` : ''}
      ${sub  ? `<text x="${x}" y="${y + 18}" text-anchor="middle"
                     fill="var(--muted)" font="500 10px ui-monospace, monospace">${sub}</text>` : ''}`;
  };

  // Individual glyph factories — all coordinates are local to a translated <g>.
  // Each draws centered at (0,0) and is then translated to (x,y).
  const glyphs = {

    box(a) {
      const w = a.w || 110, h = a.h || 56;
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">
        <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="8" ry="8"
              fill="var(--panel)" stroke="currentColor" ${stroke}/>
        ${lbl(0, -4, a.label, a.sub)}
      </g>`;
    },

    document(a) {
      const w = 56, h = 70, fold = 14;
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">
        <path d="M${-w/2},${-h/2} L${w/2 - fold},${-h/2} L${w/2},${-h/2 + fold}
                 L${w/2},${h/2} L${-w/2},${h/2} Z"
              fill="var(--panel)" stroke="currentColor" ${stroke}/>
        <path d="M${w/2 - fold},${-h/2} L${w/2 - fold},${-h/2 + fold} L${w/2},${-h/2 + fold}"
              fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
        <line x1="${-w/2 + 8}" y1="-12" x2="${w/2 - 8}" y2="-12" stroke="currentColor" stroke-width="1" opacity="0.45"/>
        <line x1="${-w/2 + 8}" y1="-2"  x2="${w/2 - 8}" y2="-2"  stroke="currentColor" stroke-width="1" opacity="0.45"/>
        <line x1="${-w/2 + 8}" y1="8"   x2="${w/2 - 8}" y2="8"   stroke="currentColor" stroke-width="1" opacity="0.45"/>
        <text x="0" y="${h/2 + 16}" text-anchor="middle" fill="var(--text)" font="600 12px sans-serif">${a.label || ''}</text>
        ${a.sub ? `<text x="0" y="${h/2 + 30}" text-anchor="middle" fill="currentColor"
                       font="600 10px ui-monospace, monospace">${a.sub}</text>` : ''}
      </g>`;
    },

    cylinder(a) {
      const w = 50, h = 64, ry = 7;
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">
        <path d="M${-w/2},${-h/2 + ry} a${w/2},${ry} 0 0 1 ${w},0 L${w/2},${h/2 - ry}
                 a${w/2},${ry} 0 0 1 ${-w},0 Z"
              fill="var(--panel)" stroke="currentColor" ${stroke}/>
        <ellipse cx="0" cy="${-h/2 + ry}" rx="${w/2}" ry="${ry}"
                 fill="var(--bg)" stroke="currentColor" ${stroke}/>
        ${lbl(0, h/2 + 16, a.label, a.sub)}
      </g>`;
    },

    cloud(a) {
      const w = a.w || 130, h = a.h || 70;
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">
        <path d="M${-w*0.35},${h*0.15}
                 a${h*0.25},${h*0.25} 0 0 1 ${h*0.15},${-h*0.45}
                 a${h*0.35},${h*0.35} 0 0 1 ${w*0.35},${-h*0.05}
                 a${h*0.3},${h*0.3} 0 0 1 ${w*0.25},${h*0.2}
                 a${h*0.2},${h*0.2} 0 0 1 ${-h*0.1},${h*0.4}
                 L${-w*0.35},${h*0.3} Z"
              fill="var(--panel)" stroke="currentColor" ${stroke}/>
        ${lbl(0, h*0.55, a.label, a.sub)}
      </g>`;
    },

    server(a) {
      const w = 60, h = 70;
      const status = a.status === 'warn' ? 'var(--warn)' : a.status === 'off' ? 'var(--muted)' : 'var(--ok)';
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">
        <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="4"
              fill="var(--panel)" stroke="currentColor" ${stroke}/>
        ${[0,1,2].map(i => `
          <line x1="${-w/2 + 6}" y1="${-h/2 + 12 + i*16}" x2="${w/2 - 14}" y2="${-h/2 + 12 + i*16}"
                stroke="currentColor" stroke-width="1.5" opacity="0.55"/>
          <circle cx="${w/2 - 8}" cy="${-h/2 + 12 + i*16}" r="2.2" fill="${i===0 ? status : 'var(--muted)'}"/>
        `).join('')}
        ${lbl(0, h/2 + 16, a.label, a.sub)}
      </g>`;
    },

    user(a) {
      const r = 12;
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">
        <circle cx="0" cy="${-r}" r="${r}" fill="var(--panel)" stroke="currentColor" ${stroke}/>
        <path d="M${-r*1.5},${r*1.6} a${r*1.5},${r*1.2} 0 0 1 ${r*3},0"
              fill="var(--panel)" stroke="currentColor" ${stroke}/>
        ${lbl(0, r*2.6 + 8, a.label, a.sub)}
      </g>`;
    },

    shield(a) {
      const w = 44, h = 56;
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">
        <path d="M0,${-h/2} L${w/2},${-h/2 + 8} L${w/2},${h*0.15}
                 Q${w/2},${h/2} 0,${h/2}
                 Q${-w/2},${h/2} ${-w/2},${h*0.15} L${-w/2},${-h/2 + 8} Z"
              fill="var(--panel)" stroke="currentColor" ${stroke}/>
        <path d="M${-8},0 L${-3},6 L8,${-6}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${lbl(0, h/2 + 16, a.label, a.sub)}
      </g>`;
    },

    key(a) {
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">
        <circle cx="-14" cy="0" r="9" fill="var(--panel)" stroke="currentColor" ${stroke}/>
        <circle cx="-14" cy="0" r="3" fill="currentColor"/>
        <line x1="-5" y1="0" x2="18" y2="0" stroke="currentColor" ${stroke}/>
        <line x1="10" y1="0" x2="10" y2="6" stroke="currentColor" ${stroke}/>
        <line x1="16" y1="0" x2="16" y2="8" stroke="currentColor" ${stroke}/>
        ${lbl(0, 22, a.label, a.sub)}
      </g>`;
    },

    lock(a) {
      const locked = a.locked !== false;
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">
        <rect x="-14" y="-2" width="28" height="22" rx="3" fill="var(--panel)" stroke="currentColor" ${stroke}/>
        <path d="M-9,-2 V-10 a9,9 0 0 1 ${locked ? 18 : 14},0 V${locked ? '-2' : '-6'}"
              fill="none" stroke="currentColor" ${stroke}/>
        <circle cx="0" cy="9" r="2.5" fill="currentColor"/>
        ${lbl(0, 30, a.label, a.sub)}
      </g>`;
    },

    gear(a) {
      const r = 14, teeth = 8;
      let teethPath = '';
      for (let i = 0; i < teeth; i++) {
        const ang = (i / teeth) * Math.PI * 2;
        const x1 = Math.cos(ang) * r, y1 = Math.sin(ang) * r;
        const x2 = Math.cos(ang) * (r + 5), y2 = Math.sin(ang) * (r + 5);
        teethPath += `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} `;
      }
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">
        <circle cx="0" cy="0" r="${r}" fill="var(--panel)" stroke="currentColor" ${stroke}/>
        <circle cx="0" cy="0" r="5" fill="var(--bg)" stroke="currentColor" stroke-width="1.2"/>
        <path d="${teethPath}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        ${lbl(0, r + 18, a.label, a.sub)}
      </g>`;
    },

    packet(a) {
      const w = 28, h = 18;
      return `<g${attrId(a)} class="${attrCls(a)} viz-packet" transform="translate(${a.x},${a.y})"
                style="color:${color(a, 'var(--pick)')}">
        <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="3"
              fill="currentColor" opacity="0.85"/>
        <text x="0" y="3" text-anchor="middle" fill="var(--bg)" font="700 10px ui-monospace, monospace">${a.label || 'pkt'}</text>
      </g>`;
    },

    bucket(a) {
      const w = 56, h = 50;
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">
        <path d="M${-w/2},${-h/2 + 4} L${-w/2 + 6},${h/2} L${w/2 - 6},${h/2} L${w/2},${-h/2 + 4} Z"
              fill="var(--panel)" stroke="currentColor" ${stroke}/>
        <ellipse cx="0" cy="${-h/2 + 4}" rx="${w/2}" ry="4"
                 fill="var(--bg)" stroke="currentColor" ${stroke}/>
        ${lbl(0, h/2 + 16, a.label, a.sub)}
      </g>`;
    },

    stack(a) {
      const layers = a.layers || ['L1', 'L2', 'L3'];
      const w = a.w || 110, h = 14, gap = 2;
      const totalH = layers.length * (h + gap);
      const out = layers.map((name, i) => {
        const yi = -totalH/2 + i * (h + gap);
        return `<g class="stack-layer" data-layer="${i}">
          <rect x="${-w/2}" y="${yi}" width="${w}" height="${h}" rx="3"
                fill="var(--panel)" stroke="currentColor" ${stroke}/>
          <text x="0" y="${yi + h/2 + 4}" text-anchor="middle" fill="var(--text)"
                font="600 11px ui-monospace, monospace">${name}</text>
        </g>`;
      }).join('');
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">${out}${lbl(0, totalH/2 + 16, a.label)}</g>`;
    },

    node(a) {
      const r = a.r || 22;
      return `<g${attrId(a)} class="${attrCls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a)}">
        <circle cx="0" cy="0" r="${r}" fill="currentColor"/>
        <text x="0" y="4" text-anchor="middle" fill="var(--bg)" font="700 13px sans-serif">${a.label || ''}</text>
        ${a.sub ? `<text x="0" y="${r + 14}" text-anchor="middle" fill="var(--muted)"
                       font="500 10px ui-monospace, monospace">${a.sub}</text>` : ''}
      </g>`;
    },

    arrow(a) {
      const [x1, y1] = a.from, [x2, y2] = a.to;
      const curve = a.curve || 0; // -1..1 = how much to bend
      let d;
      if (curve === 0) {
        d = `M${x1},${y1} L${x2},${y2}`;
      } else {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const dx = x2 - x1, dy = y2 - y1;
        const off = curve * 40;
        const cx = mx - (dy / Math.hypot(dx, dy)) * off;
        const cy = my + (dx / Math.hypot(dx, dy)) * off;
        d = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
      }
      const cls = `viz-edge${a.cls ? ' ' + a.cls : ''}${a.dashed ? ' dashed' : ''}`;
      const id = a.id ? ` id="${a.id}"` : '';
      return `<g style="color:${color(a, 'var(--pick)')}">
        <path${id} class="${cls}" d="${d}" fill="none" stroke="currentColor"
              marker-end="url(#arrowF)"/>
        ${a.label ? (() => {
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          return `<text x="${mx}" y="${my - 6}" text-anchor="middle"
                       fill="currentColor" font="600 10px ui-monospace, monospace">${a.label}</text>`;
        })() : ''}
      </g>`;
    },

    label(a) {
      const anchor = a.anchor || 'middle';
      return `<text x="${a.x}" y="${a.y}" text-anchor="${anchor}"
                   fill="${color(a, 'var(--text)')}" font="${a.font || '600 12px sans-serif'}">${a.label || ''}</text>`;
    },

    caption(a) {
      return `<text x="${a.x}" y="${a.y}" text-anchor="middle"
                   fill="var(--muted)" font="600 10px ui-monospace, monospace">${a.label || ''}</text>`;
    },
  };

  Explain.glyph = (type, attrs = {}) => {
    const fn = glyphs[type];
    if (!fn) { console.error(`Explain.glyph: unknown type "${type}"`); return ''; }
    return fn(attrs);
  };

  Explain.svgDefs = () => SVG_DEFS;

  Explain.glyphTypes = () => Object.keys(glyphs);

  /* ── Dialect extension point (the OCP seam) ─────────────────────────────
   * The general spine ends here. Domain DIALECTS extend it by registering
   * NEW glyphs — they never edit the spine `glyphs` map. This is the
   * spine-and-dialect contract from
   *   wiki/meta-wiki/software-design-principles-for-neural-os.md §Domain Dialects
   * made executable: the spine is closed (its keys are immutable), but open
   * for extension (new keys welcome).
   *
   * Guardrail #2 — the ORTHOGONALITY LOCK — is enforced here, not just
   * documented: registerGlyphs REFUSES to overwrite an existing key. A
   * dialect may add `attacker`; it can never re-map `user`.
   */
  Explain.registerGlyphs = (dialect, defs = {}) => {
    const added = [], refused = [];
    for (const [k, fn] of Object.entries(defs)) {
      if (glyphs[k]) {
        refused.push(k);
        console.warn(`[dialect:${dialect}] orthogonality lock: glyph "${k}" is already on the spine — override refused`);
        continue;
      }
      glyphs[k] = fn;
      added.push(k);
    }
    return { added, refused };
  };

  Explain.dialects = Explain.dialects || {};
  Explain.registerDialect = (d) => {
    if (!d || !d.name) { console.error('registerDialect: a dialect needs a { name }'); return null; }
    const res = Explain.registerGlyphs(d.name, d.glyphs || {});
    Explain.dialects[d.name] = Object.assign({}, d, { _glyphs: res });
    console.info(`[dialect:${d.name}] registered — +${res.added.length} glyph(s)` +
      (res.refused.length ? `, ${res.refused.length} refused by orthogonality lock` : ''));
    return Explain.dialects[d.name];
  };
})();

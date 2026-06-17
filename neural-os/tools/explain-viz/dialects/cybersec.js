/* cybersec dialect for /explain — the first domain dialect.
 *
 *  WHAT THIS IS
 *  A *dialect* per wiki/meta-wiki/software-design-principles-for-neural-os.md
 *  §Domain Dialects: a thin extension that hangs off the general /explain spine
 *  (explain-viz.js + explain-glyphs.js) and adds the primitives that only make
 *  sense inside cybersecurity. The spine stays closed; this file only ADDS.
 *
 *  WHAT THE SPINE COULD NOT KNOW (and why each primitive earns its place)
 *    - attacker   : an adversary is NOT a generic `user`. Different intent,
 *                   different color semantics (threat, not actor).
 *    - firewall   : a perimeter control is NOT the generic `shield`. It sits
 *                   *between* zones (a boundary), not *on* an asset.
 *    - vuln       : a weakness has no spine glyph at all — it is the hinge the
 *                   whole exploit phase turns on.
 *    - payload    : an exploit in flight is NOT a benign `packet`.
 *    - c2         : command-and-control is a beacon, not a plain `server`.
 *    - target     : the objective host wears a crosshair, not a plain box.
 *  Plus the load-bearing domain IDIOM — the REX-PV kill chain — the recurring
 *  *shape* of every intrusion, which a general explainer would render as five
 *  anonymous boxes.
 *
 *  LOAD ORDER (in the walkthrough HTML):
 *    explain-viz.js  →  explain-glyphs.js  →  dialects/cybersec.js
 *  Registration uses Explain.registerDialect, so the orthogonality lock in the
 *  spine refuses any accidental override of a spine glyph.
 *
 *  METER: a walkthrough that loads this dialect should fire `explain.dialect_used`
 *  { dialect:'cybersec' } once on load (see Cybersec.meter). The reuse floor that
 *  governs dialect lifecycle lives in the §Domain Dialects contract.
 */

(function () {
  if (!window.Explain || !Explain.registerDialect) {
    console.error('cybersec dialect requires explain-glyphs.js (with the dialect seam) loaded first');
    return;
  }

  /* Local copies of the spine's private rendering conventions. A dialect is
   * self-contained: it mirrors the conventions (centered at x,y; viz-node class
   * so .glow/.dim work; color from CSS var) without reaching into the spine. */
  const stroke = 'stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"';
  const attrId = a => (a.id ? ` id="${a.id}"` : '');
  const cls    = a => `viz-node${a.cls ? ' ' + a.cls : ''}`;
  const color  = (a, f = 'var(--accent)') => a.color || f;
  const lbl = (x, y, t, s) =>
    `${t ? `<text x="${x}" y="${y + 4}" text-anchor="middle" fill="var(--text)" font="600 12px sans-serif">${t}</text>` : ''}` +
    `${s ? `<text x="${x}" y="${y + 18}" text-anchor="middle" fill="var(--muted)" font="500 10px ui-monospace, monospace">${s}</text>` : ''}`;

  // ── Domain glyphs ──────────────────────────────────────────────────────
  const glyphs = {

    // Hooded adversary — dark face with two lit eyes. Defaults to threat-red.
    attacker(a) {
      return `<g${attrId(a)} class="${cls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a, 'var(--warn)')}">
        <path d="M-18,22 Q-20,-6 0,-20 Q20,-6 18,22 Z" fill="var(--panel)" stroke="currentColor" ${stroke}/>
        <path d="M-11,2 Q0,-14 11,2 Q0,8 -11,2 Z" fill="var(--bg)" stroke="currentColor" stroke-width="1.2"/>
        <circle cx="-4" cy="-1" r="1.7" fill="currentColor"/>
        <circle cx="4"  cy="-1" r="1.7" fill="currentColor"/>
        ${lbl(0, 36, a.label, a.sub)}
      </g>`;
    },

    // Perimeter control — staggered brick courses clipped to the wall width.
    firewall(a) {
      const w = 56, h = 56, rows = 4, bw = w / 3, bh = h / rows;
      let bricks = '';
      for (let r = 0; r < rows; r++) {
        const y = -h / 2 + r * bh, stagger = (r % 2) * (bw / 2);
        for (let x = -w / 2 - bw; x < w / 2 + bw; x += bw) {
          const x0 = Math.max(x + stagger, -w / 2), x1 = Math.min(x + stagger + bw - 1.5, w / 2);
          if (x1 <= x0) continue;
          bricks += `<rect x="${x0.toFixed(1)}" y="${(y + 0.75).toFixed(1)}" width="${(x1 - x0).toFixed(1)}" height="${(bh - 1.5).toFixed(1)}" rx="1.5" fill="var(--panel)" stroke="currentColor" stroke-width="1"/>`;
        }
      }
      return `<g${attrId(a)} class="${cls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a, 'var(--accent)')}">
        <rect x="${-w/2 - 1}" y="${-h/2 - 1}" width="${w + 2}" height="${h + 2}" rx="3" fill="var(--bg)"/>
        ${bricks}
        ${lbl(0, h/2 + 16, a.label, a.sub)}
      </g>`;
    },

    // Vulnerability — hazard diamond with a "!". The hinge of the exploit phase.
    vuln(a) {
      const s = a.r || 16;
      return `<g${attrId(a)} class="${cls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a, 'var(--warn)')}">
        <path d="M0,${-s} L${s},0 L0,${s} L${-s},0 Z" fill="var(--panel)" stroke="currentColor" ${stroke}/>
        <line x1="0" y1="${-s*0.45}" x2="0" y2="${s*0.2}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="0" cy="${s*0.5}" r="1.8" fill="currentColor"/>
        ${lbl(0, s + 16, a.label, a.sub)}
      </g>`;
    },

    // Exploit payload in flight — a packet wearing a tiny skull. Not benign.
    payload(a) {
      const w = 38, h = 22;
      return `<g${attrId(a)} class="${cls(a)} viz-packet" transform="translate(${a.x},${a.y})"
                style="color:${color(a, 'var(--warn)')}">
        <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="4" fill="currentColor"/>
        <circle cx="-8" cy="-1" r="5.5" fill="var(--bg)"/>
        <circle cx="-10" cy="-2" r="1.4" fill="currentColor"/>
        <circle cx="-6"  cy="-2" r="1.4" fill="currentColor"/>
        <rect x="-10.5" y="3" width="5" height="3" rx="1" fill="currentColor"/>
        <text x="7" y="3.5" text-anchor="middle" fill="var(--bg)" font="700 10px ui-monospace, monospace">${a.label || 'EXP'}</text>
      </g>`;
    },

    // Command-and-control — server with an antenna emitting signal arcs.
    c2(a) {
      const w = 54, h = 64;
      return `<g${attrId(a)} class="${cls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a, 'var(--warn)')}">
        <rect x="${-w/2}" y="${-h/2 + 10}" width="${w}" height="${h - 10}" rx="4" fill="var(--panel)" stroke="currentColor" ${stroke}/>
        ${[0,1,2].map(i => `<line x1="${-w/2 + 6}" y1="${-h/2 + 24 + i*12}" x2="${w/2 - 10}" y2="${-h/2 + 24 + i*12}" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>`).join('')}
        <line x1="0" y1="${-h/2 + 10}" x2="0" y2="${-h/2 - 8}" stroke="currentColor" ${stroke}/>
        <circle cx="0" cy="${-h/2 - 10}" r="2.5" fill="currentColor"/>
        <path d="M6,${-h/2 - 14} a10,10 0 0 1 0,12"  fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.8"/>
        <path d="M11,${-h/2 - 19} a16,16 0 0 1 0,22" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
        ${lbl(0, h/2 + 16, a.label, a.sub)}
      </g>`;
    },

    // Objective host — a crosshair locked onto a box.
    target(a) {
      const r = a.r || 20;
      return `<g${attrId(a)} class="${cls(a)}" transform="translate(${a.x},${a.y})"
                style="color:${color(a, 'var(--pick)')}">
        <circle cx="0" cy="0" r="${r}" fill="var(--panel)" stroke="currentColor" ${stroke}/>
        <circle cx="0" cy="0" r="${r*0.55}" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.7"/>
        <line x1="${-r - 5}" y1="0" x2="${-r*0.55}" y2="0" stroke="currentColor" stroke-width="1.4"/>
        <line x1="${r*0.55}" y1="0" x2="${r + 5}"   y2="0" stroke="currentColor" stroke-width="1.4"/>
        <line x1="0" y1="${-r - 5}" x2="0" y2="${-r*0.55}" stroke="currentColor" stroke-width="1.4"/>
        <line x1="0" y1="${r*0.55}" x2="0" y2="${r + 5}"   stroke="currentColor" stroke-width="1.4"/>
        <circle cx="0" cy="0" r="2.5" fill="currentColor"/>
        ${lbl(0, r + 20, a.label, a.sub)}
      </g>`;
    },
  };

  /* ── The load-bearing domain IDIOM: the REX-PV kill chain ────────────────
   * Source: wiki/cybersec/hacking-kill-chain.md (the 5-phase substrate-agnostic
   * loop). This is the domain's recurring *shape* — the thing a general
   * explainer cannot supply because it does not know that intrusions are
   * staged. Each phase carries its operational question and the failure mode
   * that signals it was skipped, so a walkthrough can teach the diagnostic. */
  const REXPV = [
    { key: 'recon',   letter: 'R', name: 'Recon',     q: 'Who / what is the target? What surface exists?',        fail: 'Wrong vector — attacking a surface the target does not have' },
    { key: 'enum',    letter: 'E', name: 'Enumerate', q: 'Of that surface, which endpoints are reachable & weak?', fail: 'Burning a 0-day on an already-patched binary' },
    { key: 'exploit', letter: 'X', name: 'Exploit',   q: 'Convert the vulnerability into initial access',          fail: '“I have the vuln but the payload does not land”' },
    { key: 'persist', letter: 'P', name: 'Persist',   q: 'Turn a foothold into durable, asset-reaching access',    fail: 'Foothold lost on reboot; the asset is never reached' },
    { key: 'evade',   letter: 'V', name: 'Evade',     q: 'Cut the detection signature; remove forensic traces',    fail: 'Detected → engagement burned, the org hardens' },
  ];

  // Draw the chain horizontally; pass active:'<key>' to flag the live phase red.
  // Returns an SVG string. Node ids are `kc-<key>` so onEnter can e.glow them.
  function killChain({ x = 90, y = 210, gap = 160, active = null, loop = true } = {}) {
    let s = '';
    const xs = REXPV.map((_, i) => x + i * gap);
    REXPV.forEach((st, i) => {
      s += Explain.glyph('node', {
        x: xs[i], y, id: `kc-${st.key}`, r: 24, label: st.letter, sub: st.name,
        color: active === st.key ? 'var(--warn)' : 'var(--accent)',
      });
    });
    for (let i = 0; i < xs.length - 1; i++) {
      s += Explain.glyph('arrow', { from: [xs[i] + 26, y], to: [xs[i + 1] - 26, y], id: `kc-e${i}` });
    }
    if (loop) {
      s += Explain.glyph('arrow', {
        from: [xs[xs.length - 1], y + 30], to: [xs[0], y + 30],
        curve: 0.85, dashed: true, id: 'kc-loop', label: 'next target',
      });
    }
    return s;
  }

  // ── Register the dialect (orthogonality lock applies on these glyph keys) ──
  Explain.registerDialect({
    name: 'cybersec',
    version: '0.1.0',
    spec: 'wiki/meta-wiki/software-design-principles-for-neural-os.md#domain-dialects',
    glyphs,
    idioms: { killChain },

    // BRIDGE row defaults: refines the skill's generic cross-domain candidates
    // (Step 2.5.5) toward shapes a cybersec learner is likely to hold. Each must
    // share a MECHANISM with the kill chain, not just a theme.
    bridgeDomains: [
      'immune system / antigenic variation (staged response + evasion)',
      'military targeting cycle — OODA / F2T2EA (ordered sense→act, skip-a-stage penalty)',
      'epidemiology — R0 and reservoir/latency (foothold → persistence)',
      'sales / customer-acquisition funnel (staged conversion with per-stage drop-off)',
    ],

    // B — Watch vocabulary (the domain's recurring failure modes; from
    // hacking-kill-chain.md §Anti-patterns). These seed the Watch row.
    failureVocab: [
      'phase-skipping — exploit without enumeration ("try every module")',
      'stuck-on-exploit — over-investing exploit-craft, under-investing recon/escalation (real ratio ≈ 70/30)',
      'evade-as-optional — "it is just a lab" → trace-leaving habit transfers to engagements',
      'substrate-confusion — naming the wrong phase (saying "exploit" when it is "enumerate")',
    ],

    // METER: the walkthrough fires this on load; the reuse floor governs lifecycle.
    meter: { event: 'explain.dialect_used', dialect: 'cybersec' },
  });

  // Expose idiom + phase metadata to walkthroughs that opt in.
  window.Cybersec = { REXPV, killChain, meter: { event: 'explain.dialect_used', dialect: 'cybersec' } };
})();

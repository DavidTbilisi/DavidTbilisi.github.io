/* walkthrough-nav.js — injects a "Related walkthroughs" footer + a back-to-hub link
 * into every walkthrough. Reads window.WALKTHROUGH_GRAPH (load walkthrough-graph.js
 * first). Self-contained: adds its own scoped styles, appends to <body>. No CDN.
 *
 * Include at the end of each walkthrough:
 *   <script src="tools/explain-viz/walkthrough-graph.js" defer></script>
 *   <script src="tools/explain-viz/walkthrough-nav.js" defer></script>
 */
(function () {
  function init() {
    const G = window.WALKTHROUGH_GRAPH;
    if (!G) return;

    // current file stem, e.g. ".../s3-storage.html" -> "s3-storage"
    const stem = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
    if (!stem || stem === 'index' || stem === G.hub.replace(/\.html?$/i, '')) return;

    // neighbours = curated relations ∪ bridge partners (both directions), deduped
    const set = new Set(G.related[stem] || []);
    (G.bridges || []).forEach(([a, b]) => {
      if (a === stem) set.add(b);
      if (b === stem) set.add(a);
    });
    const neighbours = [...set].filter((f) => f !== stem);

    // pretty title from a file stem: title-case words, fix known acronyms
    const ACR = { aws: 'AWS', ec2: 'EC2', s3: 'S3', iam: 'IAM', vpc: 'VPC', css: 'CSS',
      html: 'HTML', ai: 'AI', ml: 'ML', os: 'OS', ffuf: 'ffuf', geo: 'Geo', macos: 'macOS',
      vs: 'vs', plist: 'plist', launchd: 'launchd' };
    const titleOf = (f) => f.split('-').map((w) =>
      ACR[w] !== undefined ? ACR[w] : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // styles (scoped under .wt-nav; inherits the GitHub-dark palette vars if present)
    const css = `
      .wt-nav { max-width: 1200px; margin: 40px auto 0; padding: 20px 24px 8px;
        border-top: 1px solid var(--line, #30363d);
        font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: var(--text, #e6edf3); }
      .wt-nav-head { display: flex; align-items: baseline; justify-content: space-between;
        flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
      .wt-nav-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;
        font-weight: 600; color: var(--muted, #8b949e); }
      .wt-nav-hub { font-size: 13px; color: var(--muted, #8b949e); text-decoration: none; }
      .wt-nav-hub:hover { color: var(--accent, #79c0ff); }
      .wt-rel { display: flex; flex-wrap: wrap; gap: 8px; }
      .wt-rel a { text-decoration: none; font-size: 13px; padding: 5px 12px; border-radius: 999px;
        border: 1px solid var(--line, #30363d); color: var(--text, #e6edf3);
        background: var(--panel, #161b22); transition: border-color .15s, color .15s; }
      .wt-rel a:hover { border-color: var(--accent, #79c0ff); color: var(--accent, #79c0ff); }
      .wt-rel-empty { font-size: 13px; color: var(--muted, #8b949e); font-style: italic; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const nav = document.createElement('nav');
    nav.className = 'wt-nav';
    const links = neighbours.length
      ? `<div class="wt-rel">${neighbours.map((f) =>
          `<a href="${f}.html">${titleOf(f)}</a>`).join('')}</div>`
      : `<div class="wt-rel-empty">No related walkthroughs linked yet.</div>`;
    nav.innerHTML =
      `<div class="wt-nav-head">
         <span class="wt-nav-title">Related walkthroughs</span>
         <a class="wt-nav-hub" href="${G.hub}">← all walkthroughs</a>
       </div>${links}`;
    document.body.appendChild(nav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

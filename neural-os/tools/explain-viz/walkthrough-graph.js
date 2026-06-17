/* walkthrough-graph.js — single source of truth for how the /explain walkthroughs
 * connect to each other. Consumed by:
 *   - walkthrough-nav.js  (injects the per-page "Related walkthroughs" footer)
 *   - walkthroughs.html   (the hub that lists every walkthrough by family)
 *
 * Add a new walkthrough in ONE place: drop its file into the right family below,
 * and (optionally) list its closest cousins in `related`. Footers + hub update
 * automatically — never hand-edit a sibling's footer.
 */
window.WALKTHROUGH_GRAPH = {
  hub: 'walkthroughs.html',

  // Discovery axis: every walkthrough belongs to exactly one family.
  families: [
    { key: 'patterns', name: 'Design Patterns', blurb: 'Gang-of-Four object patterns.', files: [
      'strategy-pattern', 'state-pattern', 'observer-pattern', 'command-pattern',
      'template-method-pattern', 'visitor-pattern', 'iterator-pattern', 'mediator-pattern',
      'memento-pattern', 'interpreter-pattern', 'chain-of-responsibility-pattern',
      'abstract-factory-pattern', 'factory-method-pattern', 'builder-pattern',
      'prototype-pattern', 'singleton-pattern', 'adapter-pattern', 'bridge-pattern',
      'composite-pattern', 'decorator-pattern', 'facade-pattern', 'flyweight-pattern',
      'proxy-pattern',
    ] },
    { key: 'aws', name: 'AWS', blurb: 'Core AWS services and how they fit together.', files: [
      's3-storage', 'ec2-vs-lambda', 'vpc-network', 'iam-identity', 'observability-trio',
    ] },
    { key: 'cheatsheets', name: 'Cheatsheets', blurb: 'Fast reference for everyday tools.', files: [
      'css-cheatsheet', 'css-cheatsheet-geo', 'html-cheatsheet-geo', 'git-cheatsheet-geo',
    ] },
    { key: 'cybersec', name: 'Cybersecurity', blurb: 'Offensive/defensive tooling.', files: [
      'ffuf-cheatsheet',
    ] },
    { key: 'systems', name: 'Systems & OS', blurb: 'Operating-system internals.', files: [
      'macos-plist-launchd',
    ] },
    { key: 'networking', name: 'Networking', blurb: 'Packets, routes, delivery.', files: [
      'delivery-routing',
    ] },
    { key: 'architecture', name: 'Architecture', blurb: 'Cross-cutting design axes.', files: [
      'architecture-pillars',
    ] },
    { key: 'ai', name: 'AI / ML', blurb: 'Models and vision pipelines.', files: [
      'ai-vision-object-detection',
    ] },
    { key: 'languages', name: 'Languages', blurb: 'Programming paradigms.', files: [
      'logic-programming-prolog',
    ] },
    { key: 'tools', name: 'Tools', blurb: 'Build-it utilities.', files: [
      'frame-forge',
    ] },
  ],

  // Lateral axis: closest cousins per walkthrough (directed; nav.js also pulls in
  // bridge partners below). Design-pattern relations follow GoF intent/structure.
  related: {
    // creational
    'abstract-factory-pattern': ['factory-method-pattern', 'builder-pattern', 'prototype-pattern', 'singleton-pattern'],
    'factory-method-pattern':   ['abstract-factory-pattern', 'template-method-pattern', 'prototype-pattern'],
    'builder-pattern':          ['abstract-factory-pattern', 'composite-pattern', 'prototype-pattern'],
    'prototype-pattern':        ['abstract-factory-pattern', 'factory-method-pattern', 'memento-pattern'],
    'singleton-pattern':        ['abstract-factory-pattern', 'facade-pattern', 'flyweight-pattern'],
    // structural
    'adapter-pattern':          ['bridge-pattern', 'decorator-pattern', 'facade-pattern', 'proxy-pattern'],
    'bridge-pattern':           ['adapter-pattern', 'strategy-pattern', 'state-pattern', 'abstract-factory-pattern'],
    'composite-pattern':        ['decorator-pattern', 'visitor-pattern', 'iterator-pattern', 'builder-pattern'],
    'decorator-pattern':        ['adapter-pattern', 'composite-pattern', 'proxy-pattern', 'strategy-pattern'],
    'facade-pattern':           ['adapter-pattern', 'mediator-pattern', 'singleton-pattern'],
    'flyweight-pattern':        ['singleton-pattern', 'composite-pattern', 'proxy-pattern'],
    'proxy-pattern':            ['adapter-pattern', 'decorator-pattern', 'facade-pattern'],
    // behavioral
    'chain-of-responsibility-pattern': ['command-pattern', 'mediator-pattern', 'observer-pattern', 'composite-pattern'],
    'command-pattern':          ['chain-of-responsibility-pattern', 'memento-pattern', 'strategy-pattern', 'observer-pattern'],
    'interpreter-pattern':      ['composite-pattern', 'visitor-pattern', 'iterator-pattern'],
    'iterator-pattern':         ['composite-pattern', 'visitor-pattern', 'mediator-pattern'],
    'mediator-pattern':         ['observer-pattern', 'command-pattern', 'facade-pattern', 'chain-of-responsibility-pattern'],
    'memento-pattern':          ['command-pattern', 'prototype-pattern', 'state-pattern'],
    'observer-pattern':         ['mediator-pattern', 'command-pattern', 'chain-of-responsibility-pattern', 'state-pattern'],
    'state-pattern':            ['strategy-pattern', 'bridge-pattern', 'memento-pattern', 'observer-pattern'],
    'strategy-pattern':         ['state-pattern', 'bridge-pattern', 'decorator-pattern', 'command-pattern', 'template-method-pattern'],
    'template-method-pattern':  ['strategy-pattern', 'factory-method-pattern', 'visitor-pattern'],
    'visitor-pattern':          ['composite-pattern', 'iterator-pattern', 'interpreter-pattern', 'decorator-pattern'],
    // aws (small family — link the whole set)
    's3-storage':       ['ec2-vs-lambda', 'vpc-network', 'iam-identity', 'observability-trio'],
    'ec2-vs-lambda':    ['s3-storage', 'vpc-network', 'iam-identity', 'observability-trio'],
    'vpc-network':      ['ec2-vs-lambda', 's3-storage', 'iam-identity', 'observability-trio'],
    'iam-identity':     ['s3-storage', 'ec2-vs-lambda', 'vpc-network', 'observability-trio'],
    'observability-trio': ['ec2-vs-lambda', 's3-storage', 'vpc-network', 'iam-identity'],
    // cheatsheets
    'css-cheatsheet':     ['css-cheatsheet-geo', 'html-cheatsheet-geo', 'git-cheatsheet-geo'],
    'css-cheatsheet-geo': ['css-cheatsheet', 'html-cheatsheet-geo', 'git-cheatsheet-geo'],
    'html-cheatsheet-geo':['css-cheatsheet', 'css-cheatsheet-geo', 'git-cheatsheet-geo'],
    'git-cheatsheet-geo': ['css-cheatsheet-geo', 'html-cheatsheet-geo'],
  },

  // Cross-family bridges (undirected): edges that jump between families because the
  // *mechanism* rhymes, not the topic. Rendered in both partners' footers.
  // Seeded with a few defensible ones; add more as cross-domain rhymes surface.
  // (Note: frame-forge and macos-plist-launchd have no bridge yet — open to curation.)
  bridges: [
    ['delivery-routing', 'vpc-network'],          // both: how a request crosses hops
    ['ffuf-cheatsheet', 'git-cheatsheet-geo'],    // both: command-line tool reference
    ['architecture-pillars', 'ec2-vs-lambda'],    // both: AWS design trade-offs
    ['logic-programming-prolog', 'interpreter-pattern'], // both: evaluating a declarative grammar
    ['ai-vision-object-detection', 'logic-programming-prolog'], // both: inference over structured input
  ],
};

/* encoding-data.js — your personal "encoding methods" vocabulary.
 * Consumed by encoding-check.js, which injects a compact breadth/depth strip
 * ("have I run this topic through my memory methods?") into every walkthrough.
 *
 * UNIVERSAL by design: this list is authored ONCE and every walkthrough inherits
 * it — there is no per-topic data. Each method is a thing you DID to internalise
 * a topic, rated by clicking its chip: none ○ → started ◐ → solid ●.
 *
 * Each method: { key, label, hint, icon }   (icon optional; key must be stable —
 * it is the localStorage rating key, so don't rename a key after you've used it).
 *
 * ---------------------------------------------------------------------------
 * CANDIDATE SET (grounded in the wiki's own vocabulary — copy/edit into methods):
 *
 *   { key: 'mnemonic', icon: '🧠', label: 'Mnemonic',
 *     hint: 'memory hook / palace anchor' },          // concept-triad Mnemonic; NEDF/CAST
 *   { key: 'visual',   icon: '✏️', label: 'Hand-drawn',
 *     hint: 'sketched it myself (paper / iPad)' },     // concept-triad Visual; dual coding
 *   { key: 'checksum', icon: '✓',  label: 'Checksum',
 *     hint: 'wrote falsifiable recall questions' },    // concept-triad Checksum
 *   { key: 'cards',    icon: '🗂️', label: 'Spaced cards',
 *     hint: 'built an Anki / spaced-rep deck' },       // encoded-spaced-repetition
 *   { key: 'drilled',  icon: '🔁', label: 'Drilled',
 *     hint: 'ran it up the drill ladder' },            // active-recall + drill ladder
 *   { key: 'taught',   icon: '🗣️', label: 'Taught it',
 *     hint: 'explained it in my own words' },          // transfer / automaticity top rung
 *   { key: 'cold',     icon: '🧊', label: 'Recalled cold',
 *     hint: 'regenerated from cue alone' },            // 5-Gates: Regenerate
 *
 * Pick the set that matches how YOU actually study — drop any you won't use,
 * add ones the candidate list misses, and order them the way you'd work a topic
 * (the strip surfaces the first untouched method as your next pass).
 * ---------------------------------------------------------------------------
 */
window.ENCODING_CHECK = {
  title: 'memory methods',
  methods: [
    // TODO(human): author your encoding-methods list (see candidate set above).
  ],
};

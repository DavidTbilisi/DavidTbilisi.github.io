/* blocker-data.js — the "why am I stalling?" friction vocabulary.
 * Consumed by blocker-check.js, which injects a triage panel into a walkthrough.
 *
 * UNIVERSAL by design: the blocker set is the same for every topic (your
 * selection is per-topic, but the menu of frictions is not). Diagnose AWS as
 * "no map", the Bible as "no purpose" — same six tells, different answer.
 *
 * Each blocker:
 *   { key, label, tell, fix }
 *   - key   stable localStorage id (don't rename after use)
 *   - label the handle (the friction named)
 *   - tell  the SYMPTOM you recognise yourself in — this is the real diagnostic
 *   - fix   the concrete next move; which of the other instruments to reach for
 *
 * ORDER MATTERS: it is the repair order. A blocker high in the list poisons the
 * ones below it (you can't get traction on a missing prerequisite), so the
 * engine surfaces the highest-priority ACTIVE blocker as "start here".
 *
 * (A 7th, "identity / narrative" — 'I tell myself I'm not an infra person' — is
 * real but deliberately omitted: it usually dissolves the moment one of the six
 * below is fixed and a thing actually ships. Add it if it bites you.)
 */
window.BLOCKER_TRIAGE = {
  title: 'why am I stalling?',
  blockers: [
    { key: 'prereq', label: 'Missing prerequisite',
      tell: "Every explanation assumes something I don't have — it feels like quicksand.",
      fix:  "Trace the dependency chain DOWN (e.g. AWS → networking → TCP/IP) and shore up the shakiest rung before climbing back up." },
    { key: 'purpose', label: 'No purpose',
      tell: "I can't say what I'd actually build with this.",
      fix:  "Pick one concrete thing you want to ship that needs it; let the project pull the knowledge in (Value Filter)." },
    { key: 'map', label: 'No map — feels like trivia',
      tell: "The pieces feel disconnected; each service is an isolated fact.",
      fix:  "Get the skeleton first — a one-page service map / the Well-Architected pillars — before any detail. (Build the Territory Map.)" },
    { key: 'traction', label: 'Nothing sticks',
      tell: "I read it, it makes sense, then it's gone — every session restarts.",
      fix:  "Stop re-reading (that's the fluency illusion). Switch to active recall + the encoding strip: mnemonic, drill, recall cold." },
    { key: 'nowin', label: 'No feedback / no win',
      tell: "I never get the 'it worked' moment — nothing I do produces a visible result.",
      fix:  "Ship the smallest end-to-end thing (one bucket, one deployed function) for a real green check." },
    { key: 'altitude', label: 'Wrong altitude',
      tell: "I'm either drowning in docs or skating on marketing — never the right level.",
      fix:  "Match the resource to the need: a walkthrough for gist, the CLI reference for doing, the whitepaper for why." },
  ],
};

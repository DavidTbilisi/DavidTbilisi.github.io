/* proficiency-data.js — "can I do this at WORK?" capability registry.
 * Consumed by proficiency-check.js, which injects a self-rated gap checklist
 * into any walkthrough whose stem appears in `topics` below.
 *
 * Design-the-pattern-once: `phases` is the REUSABLE skeleton — the same five
 * build-&-ship stages apply to every topic. Each topic only supplies its own
 * `items` per phase. To extend coverage to another walkthrough, add one entry
 * under `topics` keyed by its file stem; the engine and styling are shared.
 */
window.PROFICIENCY_CHECK = {
  // Reusable skeleton for "build & ship real infra". Order = rough dependency
  // order (you provision before you secure before you automate).
  phases: [
    { key: 'provision', name: 'Provision', hint: 'Stand it up' },
    { key: 'configure', name: 'Configure', hint: 'Set it up right' },
    { key: 'secure',    name: 'Secure',    hint: 'Lock it down' },
    { key: 'operate',   name: 'Operate',   hint: 'Run & debug day-to-day' },
    { key: 'automate',  name: 'Automate',  hint: 'Make it repeatable (CLI / IaC)' },
  ],

  // Per-topic capability items. Each string is a first-person "can I…" claim you
  // rate ✓ / ~ / ✗. Written at work-depth (Apply/Analyze), not recognition.
  topics: {
    's3-storage': {
      title: 'S3 — build & ship',
      items: {
        provision: [
          'Create a bucket from the CLI (aws s3 mb) and explain why the name is globally unique + DNS-valid.',
          'Choose the right region and say what breaks if I pick wrong (latency, data residency, transfer cost).',
        ],
        configure: [
          'Enable Versioning and explain what a delete marker is and how to recover an overwritten object.',
          'Write a Lifecycle rule: transition Standard → IA → Glacier and expire noncurrent versions.',
          'Pick a storage class per prefix and justify it on access-pattern + retrieval-cost trade-off.',
        ],
        secure: [
          'Turn on Block Public Access at account + bucket level and explain the four sub-settings.',
          'Write a least-privilege bucket policy scoped to one prefix and one principal.',
          'Set default encryption and say when SSE-KMS is worth the cost/throttle over SSE-S3.',
          'Generate a presigned URL and explain why it beats making the object public.',
        ],
        operate: [
          'Debug a 403 AccessDenied by walking the chain: Block Public Access → bucket policy → IAM → ACL → KMS key policy.',
          'Use CloudTrail / server access logs to find who deleted or read an object.',
          'Estimate monthly cost from storage class + request count + egress, and spot the expensive line item.',
        ],
        automate: [
          'Define bucket + policy + lifecycle in Terraform/CloudFormation and apply it twice with no drift (idempotent).',
          'Run aws s3 sync in CI with the right --delete / --cache-control flags and know what --delete can wipe.',
        ],
      },
    },
  },
};

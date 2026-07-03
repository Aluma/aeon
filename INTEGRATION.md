# Skill-Execution Attestation — Integration Guide

How to add **verifiable provenance for skill runs** to your Aeon fork using
[GitHub Artifact Attestations](https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds).

Each attested run produces a signed, tamper-evident statement binding the run's
**output bytes** to the exact workflow identity that produced them — repo, commit
SHA, workflow file, runner, trigger event — signed through Sigstore and logged to
the public [Rekor transparency log](https://docs.sigstore.dev/logging/overview/).
Anyone can later verify a piece of Aeon output was really produced by an
unmodified skill at a known commit, without trusting you or your repo.

The whole integration is **~2 workflow steps + one permissions line + a repo
variable**. It touches **zero skills** — attestation happens in the trusted
workflow layer on the output Aeon already captures, so no skill is rewritten.

---

## What it proves — and what it doesn't

Be honest with yourself about the guarantee before wiring it up:

- ✅ **Proves:** *these exact output bytes* came from *skill X*, in workflow
  `aeon.yml`, at *commit C*, on a GitHub runner, at *time T*, triggered by
  *event E* — non-repudiable, tamper-evident, third-party-verifiable.
- ❌ **Does not prove:** that the output is *correct*, truthful, or that the model
  reasoned faithfully. Attestation is provenance of *bytes*, not a guarantee of
  *behavior*.

It answers *"was this really produced by an unmodified skill at a known commit,
or tampered with after the fact?"* — not *"is the output any good?"*

---

## Prerequisites

- **A GitHub-hosted runner** (Aeon already uses `ubuntu-latest`). ✔
- **Attestation availability for your repo:**
  - **Public repo** → works out of the box on every plan.
  - **Private repo** → the attestation store requires a plan that includes
    Artifact Attestations (GitHub Team / Enterprise). Check before enabling.
- **The `gh` CLI ≥ 2.49** locally if you want to *verify* attestations yourself
  (`gh attestation verify`). Not needed to *produce* them.

> Note: `aeon.yml` runs on `push` / `schedule` / `workflow_dispatch` on **your own
> repo**, so it always has a full workflow token — the fork-PR restrictions that
> limit `id-token` on `pull_request` events from forks do **not** apply here.

---

## How it plugs into Aeon

Nothing about the skill run changes. Aeon already captures every run's output to
`output/.chains/${SKILL}.md` (the **Capture skill output** step, `aeon.yml` ~L638).
We add a step right after it that:

1. **Resolves a gate** — should *this* run be attested? (global switch + per-skill
   opt-in + a sensible default). Mirrors exactly how `model:` / `harness:` / `mode:`
   already resolve.
2. **Attests** the captured output if the gate says yes.

```
  Skill runs (claude -p)                     ← unchanged, in sandbox
        │
  Capture skill output  → output/.chains/X.md   ← already exists (aeon.yml L638)
        │
  Resolve attestation gate  → attest=true|false ← NEW (this guide)
        │
  Attest skill execution    → Sigstore + Rekor  ← NEW (this guide, trusted layer)
        │
  Analyze / notify-jsonrender / commit …        ← unchanged
```

The attestation is stored in **GitHub's attestation store keyed by the file
digest** — it is *not* committed to the repo and adds no git churn.

---

## Step 1 — Grant the two extra permissions

Attestation needs an OIDC token to sign with and write access to the attestation
store. In `aeon.yml`, find the top-level `permissions:` block (currently ~L72):

```yaml
permissions:
  contents: write
```

Extend it to:

```yaml
permissions:
  contents: write
  id-token: write        # mint the OIDC token that signs the attestation
  attestations: write    # write the attestation to the repo's attestation store
```

Both are additive and safe — there is a single job (`run`) in this workflow.

---

## Step 2 — Add the gate + attest steps

Paste these **two steps immediately after the `Capture skill output` step**
(`aeon.yml`, right after the `::notice::Skill output captured…` line, ~L653).

```yaml
      - name: Resolve attestation gate
        id: attest-gate
        if: steps.work.outputs.mode != '' && steps.run.outcome == 'success'
        env:
          ATTEST_ENABLED: ${{ vars.ATTEST_ENABLED || 'false' }}
          JSONRENDER_ENABLED: ${{ vars.JSONRENDER_ENABLED || 'true' }}
          SKILL_NAME: ${{ steps.skill.outputs.name }}
        run: |
          set -euo pipefail
          ATTEST=false

          # Tier 0 — global kill switch (repo var, default OFF so forks opt in).
          if [ "${ATTEST_ENABLED}" = "true" ]; then
            SKILL="${SKILL_NAME}"

            # Tier 1 — per-skill override in aeon.yml (operator config, one line,
            # no skill file touched). Same grep idiom as model:/harness:.
            SKILL_ATTEST=$(grep "^  ${SKILL}:" aeon.yml \
              | sed -n 's/.*attest: *\(true\|false\).*/\1/p' || true)

            # Tier 2 — SKILL.md frontmatter (author intent, travels with the skill).
            FM_ATTEST=$(awk '/^---$/{n++; next}
              n==1 && /^attest:/{
                v=$0; sub(/^attest:[ \t]*/,"",v); sub(/[ \t]*#.*$/,"",v);
                gsub(/^[ \t"]+|[ \t"]+$/,"",v); print v; exit
              }' "skills/${SKILL}/SKILL.md" 2>/dev/null || true)

            # Tier 3 — default policy: attest runs whose output is PUBLISHED to the
            # json-render feed (the trust boundary that actually benefits).
            PUBLISHED=false
            if [ "${JSONRENDER_ENABLED}" = "true" ] \
               && [ -f "apps/dashboard/outputs/.pending-${SKILL}.md" ]; then
              PUBLISHED=true
            fi

            if [ "$SKILL_ATTEST" = "false" ]; then
              ATTEST=false                       # explicit operator opt-out wins
            elif [ "$SKILL_ATTEST" = "true" ] || [ "$FM_ATTEST" = "true" ] \
                 || [ "$PUBLISHED" = "true" ]; then
              ATTEST=true
            fi
          fi

          echo "attest=$ATTEST" >> "$GITHUB_OUTPUT"
          echo "::notice::attestation gate for ${SKILL_NAME}: attest=$ATTEST"

      - name: Attest skill execution
        if: steps.attest-gate.outputs.attest == 'true'
        uses: actions/attest-build-provenance@v2   # pin to the current major; see note
        with:
          subject-path: output/.chains/${{ steps.skill.outputs.name }}.md
```

That's the entire runtime change. The attest step runs only on successful runs
(the same guard as capture) and only when the gate opens.

> **Pin the action.** Your repo pins actions deliberately (`checkout@v7`,
> `setup-node@v6`, and `claude-code@2.1.168` "for supply-chain safety"). Do the
> same here: confirm the latest major on
> <https://github.com/actions/attest-build-provenance/releases> and pin it (a
> full commit SHA is strongest).

---

## Step 3 — Turn it on

Attestation is **off by default**. Three switches, in precedence order.

### a) Global — enable the feature for the fork

Set the repo variable (dashboard → Variables, or CLI):

```bash
gh variable set ATTEST_ENABLED --body true --repo <owner>/<repo>
```

With this on and **no** per-skill config, the default policy kicks in: only runs
that **published output to the feed** get attested. That's usually what you want.

### b) Per-skill — operator opt-in (no skill file changes)

Add `attest: true` to a skill's inline map in `aeon.yml`:

```yaml
  # before
  crypto-scan: { enabled: true, schedule: "0 12 * * *" }
  # after
  crypto-scan: { enabled: true, schedule: "0 12 * * *", attest: true }
```

Use `attest: false` to force-exclude a skill even when everything else says yes
(e.g. a noisy `price-alert` you never want in the transparency log).

### c) Author-declared — portable intent (one frontmatter line)

If you want a skill to *demand* provenance wherever it's installed, add to its
`skills/<name>/SKILL.md` frontmatter (same shape as `mode:`):

```yaml
---
name: disclosure-emailer
category: security
mode: write
attest: true          # always attest this skill's output
---
```

This travels with the skill through `bin/export-skill` and the catalog.

**Precedence:** `aeon.yml attest:false` (opt-out) → `aeon.yml attest:true` →
frontmatter `attest:true` → default feed-published policy. All gated behind the
global `ATTEST_ENABLED` switch.

---

## Verifying an attestation

Given the output file (e.g. downloaded from the feed or checked out of
`output/.chains/`):

```bash
gh attestation verify output/.chains/crypto-scan.md --repo <owner>/<repo>
```

Expected output confirms the Sigstore bundle, the signer identity
(`https://github.com/<owner>/<repo>/.github/workflows/aeon.yml@<ref>`), and the
commit SHA. You can also scope by owner or require a specific workflow:

```bash
gh attestation verify <file> \
  --owner <owner> \
  --signer-workflow <owner>/<repo>/.github/workflows/aeon.yml
```

Browse all attestations in the repo under **Actions → Attestations**, or list
them from the API / `gh attestation`. Every entry is also in the public Rekor log.

---

## Optional enhancements

### Richer run-manifest (attest the *run*, not just the file)

To bind model / mode / trigger / commit into the attested subject, generate a
small manifest and attest **that** instead of the raw output. Replace the
`subject-path` in Step 2 with a manifest built from data Aeon already has:

```yaml
      - name: Build run manifest
        id: manifest
        if: steps.attest-gate.outputs.attest == 'true'
        env:
          SKILL_NAME: ${{ steps.skill.outputs.name }}
          SKILL_MODEL: ${{ steps.run.outputs.SKILL_MODEL }}
        run: |
          set -euo pipefail
          SKILL="${SKILL_NAME}"
          OUT="output/.chains/${SKILL}.md"
          MODE="$(bash scripts/skill_mode.sh mode "$SKILL")"
          DIGEST="$(sha256sum "$OUT" | cut -d' ' -f1)"
          MANIFEST="output/.attest-${SKILL}.json"
          cat > "$MANIFEST" <<EOF
          {
            "skill":   "${SKILL}",
            "model":   "${SKILL_MODEL}",
            "mode":    "${MODE}",
            "trigger": "${GITHUB_EVENT_NAME}",
            "commit":  "${GITHUB_SHA}",
            "run_id":  "${GITHUB_RUN_ID}",
            "output":  { "path": "${OUT}", "sha256": "${DIGEST}" }
          }
          EOF
          echo "path=$MANIFEST" >> "$GITHUB_OUTPUT"

      - name: Attest skill execution
        if: steps.attest-gate.outputs.attest == 'true'
        uses: actions/attest-build-provenance@v2
        with:
          subject-path: ${{ steps.manifest.outputs.path }}
```

To verify: verify the manifest with `gh attestation verify`, then re-hash the
output and check it against the manifest's `output.sha256` — a two-link
provenance chain from workflow identity → manifest → output bytes.

### Attest inbound & chained runs too

`messages.yml` (inbound Telegram/Discord/Slack) and `chain-runner.yml` run the
same skill prompt. If you want those attested, apply the **same** permissions
line (Step 1) and the **same** two steps (Step 2) to each — they each capture
output the same way.

### Provenance badge in the feed

Since attested feed items now have verifiable provenance, you can surface a
"✓ verified" badge in `apps/dashboard` that runs `gh attestation verify` (or the
Sigstore JS verifier) against the item's bytes and links to the Rekor entry.
Purely presentational; no change to the workflow above.

---

## Rollback

Fully reversible, zero skill impact:

- **Pause instantly:** `gh variable set ATTEST_ENABLED --body false` (or delete
  the variable). The gate closes; runs proceed exactly as before.
- **Remove entirely:** delete the two steps from Step 2 and the two permission
  lines from Step 1. No skill, memory, or catalog change is involved.

---

## Gotchas

- **Off by default.** Nothing attests until `ATTEST_ENABLED=true` — safe for
  forks that don't want it.
- **Success only.** The gate reuses `steps.run.outcome == 'success'`, so failed
  runs are never attested (there's no meaningful output to bind).
- **Read-only skills are fine.** `output/.chains/${SKILL}.md` is written by the
  *workflow*, not the skill, so it survives the read-only post-run revert. Its
  bytes come from the skill's notify/feed output.
- **The store outlives the file.** Attestations are keyed by digest in GitHub's
  store + Rekor; they persist even if `output/` is later overwritten. To
  *verify*, you need the original bytes.
- **Cost is a public record.** Each attestation is a Sigstore signing + a
  permanent public Rekor entry. That's the argument for the selective default
  (attest what crosses a trust boundary) rather than attesting every run of every
  skill.
- **Pin the action version** per your repo's supply-chain convention (see the
  note under Step 2).

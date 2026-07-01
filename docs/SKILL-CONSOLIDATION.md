# Skill Consolidation Plan

> **Status:** proposal / spec. No skills have been changed yet — this document is the
> plan we execute from. Every skill in `skills/` has exactly one verdict below:
> **delete**, **merge into `<hub>`**, or **keep**.

## Headline

| | count |
|---|---|
| Skills today | **203** |
| Delete outright | **16** |
| Merge into a hub (absorbed) | **86** |
| **Surviving skills** | **102** |
| — of which hubs (absorbed ≥1 sibling) | 50 |
| — of which standalone (unchanged) | 52 |

Reconciliation: `203 − 16 deleted − 86 absorbed + 1 renamed hub = 102`.

**No capability is lost by the merges** — each absorbed skill lives on as a `mode:` /
flag / config entry on its hub. The **deletes** are the only place functionality is
actually dropped, and each is justified below (deterministic work a script already does,
a vanity artifact, or a single-integration demo).

> Note: deleting the 15 Tier 1–3 skills only reduces the surviving count by **2**
> (`janitor`, `liquidpad-launch`). The other 13 were already being merged away, so
> deleting them instead just means their hub does **not** inherit that mode.

## Principles

1. **Redundant siblings** collapse into the most general one via a `mode:`/flag.
2. **Hyper-niche vertical trackers** fold into one configurable tracker.
3. **Deterministic work** (linting, dedup, file cleanup, feed generation) should be a
   script or CI step, not an LLM run — delete the skill.
4. **Vanity/marketing artifacts** with low signal — delete.
5. **Single-integration demos** — delete unless that integration is in active use.
6. A merge is only valid if it doesn't cross a hard boundary: a **read-only** skill
   forced into a **write** hub, a **pre-batch vs post-batch** timing split, or a
   **distinct secret / data source**. Those were kept separate (see §3).

---

## 1. Delete outright (16)

These are removed, not merged. Grouped by why.

### Tier 1 — deterministic work an LLM shouldn't do (a script already exists or should)

| Skill | What it does | Why delete |
|---|---|---|
| `config-validator` | Lints `aeon.yml` + workflow for structural invariants (checkout order, dup keys, missing files) | `scripts/validate-config.js` (+ test) already does this deterministically. Make it a CI check. |
| `rss-feed` | Generates + validates an Atom XML feed from articles | `scripts/generate-feed.sh` already exists; the skill is a thin LLM wrapper over it. |
| `janitor` | Deletes stale `.notify-*` / `.pending-*` / expired `.outputs/` temp files | Pure file cleanup — belongs in a workflow post-step, not a reasoning run. |
| `frequency-guard` | Counts each skill's daily runs vs a cap, alerts on breach | Deterministic counting; a script/assertion does it cheaper and more reliably. |
| `memory-dedupe` | Collapses duplicate rows + duplicate H2 headings in `MEMORY.md` | Mechanical dedup; `state_reduce.py` / `compact_logs.py` own memory maintenance. |

### Tier 2 — vanity / meta-meta, low signal

| Skill | What it does | Why delete |
|---|---|---|
| `skill-spotlight` | Picks a skill, writes a promo tweet, then auto-dispatches that skill | Self-promotion; the auto-dispatch is a surprising side effect. |
| `self-repair-ledger` | Publishes a dated public ledger of every skill written/repaired | Marketing artifact; the data already lives in git history + logs. |
| `signal-verdict` | Audits whether tracker skills produce citable signals | Meta-meta — `skill-health` / `skill-evals` already score skill value. |
| `contributor-spotlight` | Recognition post for one fork operator | Vanity social post; `contributor-leaderboard` holds the underlying data. |
| `fork-release` | "Celebrates" when a fork cuts a tagged release | Near-zero actionability — a notification with nothing to decide. |

### Tier 3 — single-integration demos (dead weight unless that exact thing is in use)

| Skill | What it does | Why delete |
|---|---|---|
| `beamr-route` | Routes a prompt through a BEAMR x402 gateway, prints an on-chain receipt | Proof-of-concept for one gateway. |
| `liquidpad-launch` | Emits a LiquidPad token-deploy payload with a fixed 80/15/5 fee split | Single-product launch action (drop `scripts/{prefetch,postprocess}-liquidpad.sh` with it). |
| `atrium-watch` | Diffs the Atrium skill-marketplace catalog for changes | Bookkeeping for one specific external marketplace. |
| `sparkleware-catalog` | Exports a catalog JSON for the external "Sparkleware" tool | Serves one downstream consumer. |
| `aixbt-pulse` | Market pulse from AIXBT's specific free grounding endpoint | Tied to one vendor endpoint; `narrative-tracker` / `token-movers` cover it vendor-neutrally. |

### Also removed

| Skill | Why |
|---|---|
| `routine` | It's the synthesis node of a chain (`chains:` in `aeon.yml` already orchestrates the fan-in). The orchestration is config, not a skill; drop the skill and express it as a chain if wanted. |

**Cleanup that rides along with the deletes:** remove their `aeon.yml` entries (all
currently `enabled: false`), delete `scripts/{prefetch,postprocess}-liquidpad.sh`, and
regenerate `skills.json` / `packs.json` / `skill-packs.json` via `generate-skills-json` /
`generate-packs-json`. Keep `scripts/validate-config.js` and `scripts/generate-feed.sh`
(they're the deterministic replacements for the deleted wrappers).

---

## 2. Merge map (86 skills → 50 hubs)

Format: **hub ← absorbed skills : mechanism**. "mode" notes flag where the hub's
capability mode changes after absorbing a sibling.

### Content & writing
- **`article`** ← `repo-article`, `project-lens`, `technical-explainer` : `angle: standard|repo|lens` + `--visual` flag (Replicate hero image; carries `REPLICATE_API_TOKEN?`)
- **`write-tweet`** ← `thread-writer`, `remix-tweets` : `format: drafts|thread|remix`
- **`article-queue`** ← `topic-momentum`, `beat-tracker` : one content-planner — ranks gap signals *and* tracks multi-beat storylines
- **`syndicate-article`** (→ `publish`) ← `update-gallery` : `channels: devto,farcaster,gallery`
- **`changelog`** ← `docs-sync` : `--push-to <website-repo>` mode (docs-sync's cross-repo changelog PR; carries `GH_GLOBAL`)
- **`digest`** ← `rss-digest` : RSS becomes a source. **mode: hub becomes `write`** (digest is currently read-only)
- **`note-taking`** ← `idea-capture` : any-channel capture with triage

### Social & platform digests
- **`fetch-tweets`** ← `tweet-digest`, `tweet-roundup`, `list-digest`, `refresh-x`, `agent-buzz` : `source: keyword|topic|account|list` (agent-buzz = topic-filtered)
- **`reply-maker`** ← `engagement-act` : `--from-logs` mode drafts replies off flagged opportunities
- **`telegram-digest`** ← `channel-recap` : `--single-channel` recap mode. **mode: hub becomes `write`**
- **`reddit-digest`** ← `vibecoding-digest` : subreddit is a param

### Research & trackers
- **`deep-research`** ← `research-brief` : `--depth=shallow` (already the mechanism) = the brief
- **`github-trending`** (→ `trending`) ← `huggingface-trending` : `source: github|hf`
- **`launch-radar`** ← `competitor-radar` : `filter: backlog|category`
- **`x402-monitor`** (→ `vertical-tracker`) ← `rwa-pulse`, `compute-pulse`, `mcp-pulse`, `agent-displacement` : each vertical is a config entry in `memory/topics/tracked-protocol.md` (skill is already built to swap protocols)

### Crypto markets
- **`token-movers`** ← `monitor-runners`, `token-report` : `source: coingecko|geckoterminal`, `mode: movers|single-token` (single-token carries `ALCHEMY_API_KEY?`)
- **`defi-overview`** ← `defi-monitor`, `market-context` : one read covering tracked-protocol positions + macro context

### On-chain / Base
- **`investigation-report`** ← `rug-scan`, `contract-audit`, `deployer-trace`, `holder-concentration`, `honeypot-check`, `lp-lock` : `--checks=rug,contract,deployer,holders,honeypot,lp` + `--depth=quick|deep` (quick = old rug-scan). **mode: stays `read-only`** — all six are read-only Base analyzers (cleanest merge in the set)
- **`wallet-profile`** ← `wallet-digest`, `wallet-risk`, `approval-audit`, `linked-wallets`, `fund-flow` : `mode: profile|balances|risk|cluster|trace`. **Keep hub `read-only`** (analysis only)
- **`vigil`** ← `vigil-revoke` : `--revoke` action arm (Bankr-gated) on the scanner's own findings

### Prediction markets
- **`monitor-polymarket`** (→ `pm-monitor`) ← `monitor-kalshi` : `platform: polymarket|kalshi`

### Product & growth
- **`idea-forge`** ← `idea-validator`, `startup-idea` : `mode: generate|validate|memo`
- **`product-hunt`** (→ `launch-post`) ← `show-hn` : `channel: producthunt|showhn|reddit`
- **`goal-tracker`** ← `milestone-tracker` : milestones = goals with threshold alerts
- **`star-milestone`** ← `star-momentum` : crossing alert + next-milestone projection
- **`product-pulse`** ← `repo-pulse`, `content-performance`, `vercel-projects` : product health = repo growth + X engagement + deploy fleet (vercel-projects carries `VERCEL_TOKEN`)
- **`repo-scanner`** ← `repo-actions`, `builder-map` : catalog emits per-repo action ideas + who's-building intel

### GitHub ops & vuln disclosure
- **`github-monitor`** ← `github-issues`, `github-releases`, `pr-tracker` : already watches PRs/issues/releases — these were views
- **`pr-review`** ← `pr-merge` : `--survey` risk-tiered mode
- **`feature`** ← `external-feature`, `repo-revive` : `target: watched|external|dormant`, `--fix-issues`
- **`vuln-scanner`** (write) ← `pvr-watchlist`, `disclosure-emailer` : the disclose arm — PVR re-submit + email channel (via `send-email` / `RESEND_API_KEY?`)
- **`vuln-tracker`** (read) ← `pvr-triage`, `disclosure-tracker` : all cheap daily lifecycle polls (PR status + PVR triage state + pending-queue aging)
- **`ecosystem-pulse`** ← `ecosystem-links` : liveness + link-health in one pass

### Fleet & fork
- **`fork-health`** (→ `fork-tracker`) ← `fork-cohort`, `fleet-state` : run-recency buckets + 3-signal health tier + "state of the fleet" narrative (fleet-state was mis-scoped as managed-instance; it's a fork skill)
- **`fork-fleet`** ← `fork-digest` : one "divergence" skill — code divergence + config divergence
- **`fork-events`** ← `fork-firstrun` : same-day fork event alerts (rename of `fork-firstrun`; `fork-release` deleted). Runs daily to preserve latency
- **`fleet-control`** ← `fleet-scorecard` : `view: control|scorecard` (managed child instances)
- **`distribute-tokens`** ← `contributor-reward` : the reward plan is the distribution input
- **`skill-gap`** ← `skill-adoption`, `skill-leaderboard` : one fleet skill-adoption view (most/least adopted + per-fork gaps)

### Skill-meta & self-management
- **`skill-scan`** ← `skill-triage`, `phylax-audit` : `target: repo|pr|external-preinstall` (phylax's Base-contract + x402 probing carries `ETHERSCAN_API_KEY?`)
- **`skill-health`** ← `skill-analytics` : analytics = the metrics view
- **`skill-update`** ← `skill-freshness` : upstream drift + dependency staleness together
- **`capabilities-map`** (→ `skill-atlas`) ← `capabilities-sweep`, `skill-graph` : coverage audit + one-shot backfill + Mermaid dep graph
- **`self-improve`** ← `self-review` : `mode: improve|audit`
- **`auto-workflow`** ← `skill-enabler` : generating `aeon.yml` already implies flipping `enabled`

### Ops, memory & ads
- **`cost-report`** ← `spend-monitor` : `--budget-cap` alert mode
- **`operator-scorecard`** ← `ops-recap`, `push-recap` : recaps are views of "what shipped / was it worth it"
- **`heartbeat`** ← `priority-brief` : `--top3` focus mode
- **`reflect`** ← `retrospective` : consolidate + KALM retro in one memory pass
- **`schedule-ads`** ← `create-campaign` : `mode: provision|schedule` (provision creates PAUSED, schedule launches)

---

## 3. Deliberately kept separate (audit corrections)

Skills I considered merging but the code shows a hard boundary — **keep standalone**:

| Skill | Almost merged into | Why it stays separate |
|---|---|---|
| `narrative-convergence` | `narrative-tracker` | tracker is deliberately `read-only`; convergence is `write` and a novel cross-skill detector — merging degrades the tracker's safety mode |
| `treasury-info` | `defi-overview` | reads your **own treasury wallets** via `BANKR_API_KEY` + `ALCHEMY` — different data source & secret than a market read |
| `batch-health` | `api-health` | api-health runs **pre-batch** (`30 6 * * *`); batch-health audits **post-batch** — one run can't be both |
| `paper-digest` | `paper-pick` | keep `paper-pick` a clean `read-only` "one decisive pick" primitive; don't force it to `write` |

Also note: `docs-sync` moved from the publish cluster into `changelog` (it's a cross-repo
changelog PR, not article distribution).

**Borderline — merged, but easy to pull back** if you'd rather keep them standalone:
`vercel-projects` → `product-pulse` (deploy-ops vs product growth), `retrospective` →
`reflect` (a report vs memory hygiene).

---

## 4. Conditional capabilities (Tier 4) — your call

Not bad skills, but the whole cluster is removable if you don't do the thing. Decide per
your operating model:

| Capability | Skills | Remove if… |
|---|---|---|
| Managed-fleet ops | `spawn-instance`, `fleet-control` (+ absorbed `fleet-scorecard`) | you don't run a fleet of managed child instances |
| Paid ads | `schedule-ads` (+ absorbed `create-campaign`) | you don't run Meta/TikTok ad campaigns |
| On-chain payouts | `distribute-tokens` (+ absorbed `contributor-reward`) | you don't pay contributors in tokens |

---

## 5. Surviving skills (102)

### Hubs (50) — absorbed ≥1 sibling
`article`, `article-queue`, `auto-workflow`, `capabilities-map`, `changelog`,
`cost-report`, `deep-research`, `defi-overview`, `digest`, `distribute-tokens`,
`ecosystem-pulse`, `feature`, `fetch-tweets`, `fleet-control`, `fork-events`,
`fork-fleet`, `fork-health`, `github-monitor`, `github-trending`, `goal-tracker`,
`heartbeat`, `idea-forge`, `investigation-report`, `launch-radar`, `monitor-polymarket`,
`note-taking`, `operator-scorecard`, `pr-review`, `product-hunt`, `product-pulse`,
`reddit-digest`, `reflect`, `reply-maker`, `repo-scanner`, `schedule-ads`,
`skill-gap`, `skill-health`, `skill-scan`, `skill-update`, `self-improve`,
`star-milestone`, `syndicate-article`, `telegram-digest`, `token-movers`, `vigil`,
`vuln-scanner`, `vuln-tracker`, `wallet-profile`, `write-tweet`, `x402-monitor`

### Standalone (52) — unchanged
`action-converter`, `api-health`, `auto-merge`, `autoresearch`, `base-mcp`,
`batch-health`, `bd-radar`, `code-health`, `contributor-leaderboard`, `create-skill`,
`ctrl`, `deal-flow`, `deploy-prototype`, `farcaster-digest`, `fear-divergence`,
`followup-patrol`, `framework-watch`, `hn-digest`, `idea-pipeline`, `inbox-triage`,
`install-skill`, `issue-triage`, `last30`, `memory-flush`, `mention-radar`,
`narrative-convergence`, `narrative-tracker`, `onboard`, `onchain-monitor`,
`paper-digest`, `paper-pick`, `picks-tracker`, `pm-manipulation`, `pm-pulse`,
`pr-triage`, `price-alert`, `reg-monitor`, `search-skill`, `security-digest`,
`send-email`, `shiplog`, `skill-evals`, `skill-repair`, `soul-builder`,
`spawn-instance`, `strategy-builder`, `token-pick`, `tool-builder`, `treasury-info`,
`tx-explain`, `unlock-monitor`, `workflow-audit`

---

## 6. Execution checklist (for when we do the changes)

1. **Delete** the 16 skill directories in §1.
2. **Merge** each cluster in §2 — fold the absorbed skill's logic into the hub's
   `SKILL.md` behind the noted `mode:`/flag, then delete the absorbed directory.
3. Update **`aeon.yml`**: remove deleted/absorbed entries; add the new `var:` params to
   surviving hubs; re-point any `chains:` / `consume:` at hub slugs.
4. Set the correct **capability mode** on hubs that changed (`digest`, `telegram-digest`
   → `write`; keep `investigation-report`, `wallet-profile` → `read-only`).
5. Delete orphaned scripts (`scripts/{prefetch,postprocess}-liquidpad.sh`); keep
   `validate-config.js` + `generate-feed.sh`.
6. Regenerate catalogs: `./generate-skills-json` and `./generate-packs-json`.
7. Run `scripts/validate-config.js` and the skill-category/capabilities parity checks.

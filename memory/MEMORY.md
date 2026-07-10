---
type: Index
---

# Long-term Memory
*Last consolidated: never*

## About This Repo
- Autonomous agent running on GitHub Actions via Claude Code.
- Primary automation repo: Aluma/aeon.
- Frozen repo: Aluma/universal-context-hub. Do not build, review, merge, triage, monitor, or otherwise operate on this repo unless the operator explicitly unfreezes it.
- Active VCH build target: **Aluma/vybose-context-hub** (verified 2026-07-10; the only authorized target per STRATEGY). Default branch `main`, protected, `verify` check green.
- VCH program state (2026-07-10): Sprint 5. Issue #2 [S5.0] current-state audit is in `vch:plan-review` (PR #3, `hold`, awaiting independent vch-plan-review). Audit finding: 0/28 S5.1-S5.3 criteria backed by required public-path test files; recommended build order S5.1 -> S5.2 -> S5.3 after the audit PR merges.

## Recent Articles
| Date | Title | Topic |
|------|-------|-------|

## Recent Digests
| Date | Type | Key Topics |
|------|------|------------|

## Skills Built
| Skill | Date | Notes |
|-------|------|-------|

## Lessons Learned
- Digest format: Markdown with clickable links, under 4000 chars
- Always save files AND commit before logging
- VCH autonomous work optimizes for executable proof: CI, tests, placeholder/skip guards, PR evidence, and no direct-to-main feature work.
- Before any autonomous VCH build, verify the current active repo/spec source. Do not infer it from stale memory.

## Next Priorities
- Keep VCH feature PRs small, verified, and reviewable once the active build repo is configured.
- Monitor Aeon run health daily. Monitor VCH PRs/issues only after an active non-frozen VCH repo is configured.
- Repair failing Aeon skills reactively after repeated failures instead of letting silent degradation accumulate.

## Known Config Gaps
- Langfuse trace-level observability is not active until `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are installed. GitHub-issue live events are active, but they are not full prompt/tool traces.
- Model routing now maps Opus/GPT 5.6 Sol/Terra/Luna/DeepSeek/Qwen role handles through OpenRouter. Aeon still runs one primary model per skill, so cross-checking is implemented as a skill pipeline: GPT 5.6 Sol writes/repairs, Opus reviews high-risk PRs, GPT 5.6 Terra audits/merges, and GPT 5.6 Luna handles routine monitoring/triage. True intra-run orchestrator-to-coder delegation needs a future workflow/skill architecture change.
- Aluma/universal-context-hub is frozen; old PRs/issues there are historical context only. Do not launch, review, fix, or merge work against that repo.
- Full-autonomy testing is desired, but only against the correct active non-frozen VCH repo after current state and specs are reviewed. Deterministic gates plus cross-model review are the intended control surface.

---
type: Index
---

# Long-term Memory
*Last consolidated: never*

## About This Repo
- Autonomous agent running on GitHub Actions via Claude Code.
- Primary target: Aluma/universal-context-hub, the VCH local-first context infrastructure build.

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

## Next Priorities
- Keep VCH feature PRs small, verified, and reviewable.
- Monitor VCH PRs, issues, security lifecycle, and Aeon run health daily.
- Repair failing Aeon skills reactively after repeated failures instead of letting silent degradation accumulate.

## Known Config Gaps
- Langfuse trace-level observability is not active until `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are installed. GitHub-issue live events are active, but they are not full prompt/tool traces.
- Model routing now maps Opus/GPT 5.6 Sol/Terra/Luna/DeepSeek/Qwen role handles through OpenRouter. Aeon still runs one primary model per skill, so cross-checking is implemented as a skill pipeline: GPT 5.6 Sol writes/repairs, Opus reviews high-risk PRs, GPT 5.6 Terra audits/merges, and GPT 5.6 Luna handles routine monitoring/triage. True intra-run orchestrator-to-coder delegation needs a future workflow/skill architecture change.
- VCH PR #5 is open and CI-green for issue #3. Do not launch another `feature --fix-issues` build until that PR is reviewed/merged or a new `ai-build` issue is ready.
- `auto-merge` is intentionally enabled for VCH full-autonomy testing. Branch protection still requires CI and conversation resolution, but not approving reviews; deterministic gates plus cross-model review are the intended control surface.

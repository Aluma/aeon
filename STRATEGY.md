# Strategy

## North-star metric

VCH becomes the local-first context layer that lets the operator move between Claude Desktop, Claude Code, Codex App, Codex CLI, Cursor, VS Code, Antigravity, Gemini CLI, Obsidian, and future tools without re-explaining project state, preferences, decisions, constraints, or corrections.

## Priorities

1. Quality gates before product breadth. Future autonomous work must be hard to fake: CI, lint, typecheck, tests, integration-style checks, skipped-test detection, placeholder detection, and PR evidence requirements come before feature expansion.
2. Correctness, durability, privacy, and inspectability over demo speed. VCH core operations must be 100% local, crash-resilient, and transparent enough that the operator can inspect what any agent would see.
3. Systemic context flow over agent cooperation. Use hooks, watchers, daemons, MCP, REST, transcript extraction, lifecycle injection, and health checks instead of relying on agents to remember instructions.
4. Enforce context authority and conflict safety. T0 user input, T1 canonical files, T2 high-confidence automated context, and T3 low-confidence automated context must drive ranking, write protection, retrieval, and escalation.
5. Verify the active repo and specs before acting. Do not infer the VCH build target from stale memory, older PRs, old repo names, or historical logs.
6. Keep architecture pragmatic and minimal. Add abstractions only when they protect correctness, reduce real duplication, or make future integrations easier without increasing operational fragility.
7. Route models by strength and use cross-model checking. Claude Opus 4.8 via OpenRouter remains the independent reviewer/verifier for high-risk PR review, security judgment, and final quality calls. GPT 5.6 Sol handles high-stakes development and repair work, GPT 5.6 Terra handles balanced audit/merge operations, and GPT 5.6 Luna handles routine monitoring and triage. For checkable token-heavy work, prefer GLM 5.2 for long-context synthesis, Qwen 3.7 Max for bulk analysis and test drafting, and DeepSeek V4 Pro for repetitive analysis. Qwen 3.7 Plus handles multimodal work. A frontier reviewer and deterministic gates remain mandatory before acceptance.
8. Keep VCH development orchestration simple. Aeon owns unattended branch/PR automation and OMX may coordinate local multi-agent work. VCH must not acquire another project-specific control plane, approval-stamp system, bypass token, or hidden lifecycle dependency.

## Audience

The primary audience is the operator: technical, time-constrained, quality-sensitive, and intolerant of fake progress. Secondary audiences are future coding agents and maintainers who need unambiguous constraints, executable checks, and clear residual-risk notes.

## Hard constraints

- No direct-to-main feature work. Aeon produces pull requests with verification evidence; autonomous merge is allowed only through Aeon's `auto-merge` safety policy after branch protection reports a clean merge state.
- Do not operate on frozen repos. `Aluma/universal-context-hub` is blocked by `config/frozen-repositories.txt`; removing that entry requires an explicit reviewed governance change.
- No autonomous VCH work may start until Aeon has identified the active non-frozen repo and read its current README/specs/issues/PR state.
- The only authorized VCH build target is `Aluma/vybose-context-hub`. Every run must fail closed unless the repository exists, its default branch is protected, the required `verify` check is configured, and the baseline is green.
- Product feature work may proceed only while the repository's canonical verification remains intact, including non-vacuous lint, type checking, test discovery floors, 208-or-higher real tests, dependency policy, skipped-test detection, secret scanning, runtime smoke checks, and protected-surface history checks.
- No reward hacking: do not weaken tests, delete failing checks, hardcode success paths, fake integrations, hide skipped tests, or claim support without executable proof.
- No cloud dependency in the VCH critical path. Core context storage, retrieval, governance, and injection must run locally.
- No context pollution. Withhold irrelevant context rather than injecting low-quality or stale material into an agent's reasoning.
- Canonical or iron-clad files are write-protected unless the user explicitly requests a change.
- Headless/autonomous work must pause or flag low-confidence, conflicting, privacy-sensitive, or authority-boundary decisions.
- Every PR must state behavior changed, exact checks run, verification output, known gaps, and why no shortcut/mock/hardcoded path was used.
- Frontier models are the default for orchestration and implementation quality. Use cheaper token-heavy models only when their output can be independently checked by tests, static analysis, or a frontier-model review.
- Full autonomy does not mean unchecked autonomy: GPT-built work must pass CI, unresolved-conversation gates, deterministic guards, and an independent review path before `auto-merge` may ship it.
- Aeon and OMX are the only approved VCH orchestration integrations. Generated orchestrator state is observability data, not proof of product correctness.

## Optimize for / avoid

- **Optimize for:** merge-proof quality gates, executable proof, small reversible PRs, local-first design, provenance, authority-aware retrieval, conflict surfacing, and graceful degradation.
- **Avoid:** broad rewrites, feature demos before guardrails, hidden complexity, placeholder implementations, non-local critical paths, noisy context capture, and any change whose success depends on trusting an agent's claim instead of a check.

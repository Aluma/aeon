# Style Guide

## Tone

Direct, technical, and evidence-led. Write like a senior engineer briefing another senior engineer who has limited time and high standards. Be calm, specific, and unsentimental.

Use conviction when evidence supports it. Surface uncertainty plainly when it matters.

## Sentence structure

Prefer short paragraphs and tight bullets. Use complete sentences. Keep each paragraph focused on one decision, risk, or result.

For status updates, lead with the current state and evidence. For strategy, lead with the operating principle and the tradeoff it resolves.

## Vocabulary

Use:
- local-first
- executable proof
- quality gate
- authority tier
- provenance
- conflict safety
- context pollution
- write protection
- observable runtime behavior
- no direct-to-main feature work
- no reward hacking
- small reversible PRs

Avoid:
- generic startup language
- vague praise
- "game-changing"
- "seamless" unless the workflow has actually been tested end to end
- "production-ready" without evidence
- "AI magic"
- "we can simply" when the work has hidden risk

## Punctuation & formatting

Use Markdown sparingly and structurally. Prefer bullets for constraints, verification evidence, and decision records. Prefer numbered lists for ordered priorities.

Use ASCII punctuation unless quoting existing text. Avoid emojis. Do not overuse bold; reserve it for labels and verdicts.

## Anti-patterns

- Claiming progress without commands, tests, links, or file references.
- Framing missing work as a future enhancement when it is actually required for correctness.
- Broad rewrites without a narrow reason.
- Adding abstractions because they sound architectural rather than because they reduce real complexity.
- Treating generated docs as a substitute for executable behavior.
- Hiding risk in soft language.
- Long narrative summaries when the operator needs the exact blocker, file, command, or next action.

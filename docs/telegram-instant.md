# Telegram Instant Mode

Default polling checks for messages every 5 minutes (and GitHub throttles that
`*/5` cron hard under load). There are **two** ways to get ~1-second replies —
pick by whether you want zero external systems or zero continuous Actions minutes.

| Mode | External system? | Cost | Best for |
|------|------------------|------|----------|
| **Native long-poll** (`telegram-instant.yml`) | **None** — runs in your own GitHub Actions | Free/unlimited on **public** repos; burns the 2000-min/mo free tier on private ones | Public forks that want instant replies with nothing else to deploy |
| **Cloudflare Worker** (`apps/webhook/`) | A Worker in your Cloudflare account | Free (Cloudflare free tier); ~no Actions minutes | Private repos, or anyone who prefers push over a long-poll job |

Both deliver the **full inbound feature set** — plain messages to Claude, plus
`/slash` commands, inline-button taps, and reply follow-ups routed with no LLM via
[`scripts/telegram-route.sh`](../scripts/telegram-route.sh). They're mutually
exclusive and self-arbitrating (see "How the three modes coexist" below).

---

## Native long-poll — instant, no external system

Telegram offers exactly two delivery mechanisms: **push** (`setWebhook`, needs a
public server) and **pull** (`getUpdates`, needs only a process making the call).
Push is what forces an external system. So native mode does the pull — but instead
of the poller's single `getUpdates?timeout=0` every 5 minutes, a dedicated workflow
holds a **long-poll** open (`getUpdates?timeout=50`) continuously and acts on each
update the instant Telegram returns it. It runs entirely inside the GitHub Actions
your fork already uses — no Worker, no third party, no credential custody.

**How it stays alive:**

- One job runs a ~5-hour long-poll loop, then **re-launches itself** (handing off
  the Telegram offset) before GitHub's 6-hour job cap.
- The `messages.yml` `*/5` tick is a **revival heartbeat**: if the loop was ever
  killed (GitHub maintenance, cancellation, crash), the next tick starts a fresh
  one — so downtime is at most one cron interval.
- A concurrency group (`telegram-instant-longpoll`) guarantees **at most one loop**
  runs at a time; redundant launches queue and take over as the natural successor.

### Enable it

1. Set a repo **variable** (not a secret):
   **Settings → Secrets and variables → Actions → Variables → New variable**
   ```
   TELEGRAM_INSTANT_NATIVE = true
   ```
   (`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` must already be set — Aeon is scoped
   to that one chat, so only you can command the bot.)
2. Start it now from **Actions → Telegram Instant (native long-poll) → Run
   workflow**, or just wait — the next `*/5` tick's keepalive starts it for you.

### Turn it off

Delete the `TELEGRAM_INSTANT_NATIVE` variable (or set it to anything other than
`true`). The running loop re-reads the toggle every ~5 minutes and exits without
re-arming, so it stops within a few minutes; to stop instantly, also cancel the
in-progress **Telegram Instant** run from the Actions tab. Polling resumes
automatically.

### Cost & latency, honestly

- **Cost.** A long-poll job is mostly idle (blocked on the socket), but it does hold
  a runner continuously. On **public** repos GitHub Actions minutes are free and
  unlimited — effectively free. On **private** repos a 24/7 loop exhausts the
  2000-min/month free tier in ~1.4 days; there, use the Cloudflare Worker instead.
- **Latency.** *Delivery* is ~1s. For `/commands`, buttons, and reply prompts (no
  LLM) the loop replies almost immediately. A plain-English question still spins up
  a fresh runner for Claude (~30–90s) — that's inherent to running the model in
  Actions and is true of the Cloudflare path too; the webhook only makes *delivery*
  instant, not the model's answer.

---

## Cloudflare Worker — instant, no continuous Actions minutes

Deploy the self-contained Worker in [`apps/webhook/`](../apps/webhook/) into your
own Cloudflare account and register it as the bot's webhook. It classifies each
update and relays it to your fork via a GitHub `repository_dispatch`, which fires
**Messages & Scheduler** immediately (~1s). Full setup, including the "Deploy to
Cloudflare" button, lives in **[`apps/webhook/README.md`](../apps/webhook/README.md)**.

In short:

1. Deploy `webhook/` to your own Cloudflare account (button or `npx wrangler deploy`).
2. Fill in `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`,
   `GITHUB_REPO`, and `GITHUB_TOKEN` when the deploy wizard prompts (or set them as
   Worker secrets via `wrangler secret put` when deploying from a clone).
3. Point your bot at the Worker:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://your-worker.workers.dev&secret_token=<YOUR_WEBHOOK_SECRET>"
   ```

---

## How the three modes coexist

Only one owns Telegram at any time; the arbitration is automatic:

1. **Cloudflare webhook set?** It wins. `getUpdates` returns `409` against an active
   webhook, so both the poller and the native loop detect it (`getWebhookInfo`) and
   stand down. Delivery runs through the Worker.
2. **`TELEGRAM_INSTANT_NATIVE=true` (and no webhook)?** The native long-poll owns
   `getUpdates`; the `*/5` poller skips its Telegram branch (two concurrent
   `getUpdates` would steal each other's updates via the offset ack). The poller
   still runs the scheduler and Discord/Slack polling as usual.
3. **Neither?** Plain 5-minute polling, exactly as before.

Switching modes needs no cleanup — flip the variable or set/clear the webhook and
the others yield on their next check.

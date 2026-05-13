# Aria — AI SDR Intelligence Platform

> **Know your prospect before you say hello.**

---

## Overview

A three-panel application:

- **Left sidebar** — navigation.
- **Main content** — primary work surface.
- **Right drawer** — slides in as context when you click a prospect.

Dark theme. Professional, not startup-y. Think *Linear meets Gong*. Accent: electric blue on dark grey.

---

## Screen 1 — SDR Command Table

The main view. What the SDR sees every morning: a table of all booked calls.

### Columns

| Column | Description |
| --- | --- |
| **Prospect** | Avatar, name, role, company |
| **Call Time** | Date, time, countdown (e.g. "in 2 hours", "tomorrow 3pm") |
| **Emotional Signal** | Badge — see states below |
| **Intel Status** | "Research complete", "Gathering…", "Ready for review" |
| **Company Signal** | One line. e.g. "Just raised Series A", "Losing customers to competitor X" |
| **Pre-Call Brief** | Button — opens the right drawer |
| **Call Score** | Empty before call. Auto-filled after. 0–100 with a colour bar |
| **Next Action** | "Follow up email drafted", "Demo scheduled", "Proposal sent" |

### Emotional Signal states

- 🔴 **Frustrated** — recent negative posts detected
- 🟡 **Evaluating** — comparing options, not decided
- 🟢 **Excited** — hiring, growing, announced something
- 🔵 **Skeptical** — has objected to similar tools before

### Sample prospects

- **James Whitfield** — VP Sales, Clearbit · 🔴 Frustrated · *"Posted about his team missing quota 3 days ago"*
- **Sarah Chen** — Founder, Notion-competitor SaaS · 🟢 Excited · *"Just closed seed round, hiring sales team"*
- **Marcus O'Brien** — Head of RevOps, Intercom · 🔵 Skeptical · *"Tweeted that AI sales tools overpromise"*
- **Priya Nair** — COO, HealthTech startup · 🟡 Evaluating · *"Shortlisting vendors this week per LinkedIn post"*
- **David Okafor** — CEO, Lagos-based fintech · 🟢 Excited · *"Expanding to UK market, posted about it yesterday"*

---

## Screen 2 — Pre-Call Intelligence Brief (Right Drawer)

Slides in when you click any prospect. Full right panel, scrollable.

### Person Snapshot

- Large avatar, name, role, company
- "Connected on LinkedIn" badge
- "Research completed 47 mins ago"
- **One-line emotional summary:** *"James is visibly frustrated. His team missed quota last quarter and he's under pressure from the board. He needs a win."*

### 1. What's on his mind right now

Three cards pulled from recent activity:

- **LinkedIn post (3 days ago):** *"Frustrated with tools that promise pipeline and deliver reports."* — direct signal
- **Commented on a post about sales team accountability** — signal: feeling pressure from above
- **Company job post for 3 new AEs** — signal: scaling but struggling with current conversion

### 2. Company Intelligence

- Company size, funding, tech stack detected
- **Recent news:** "Clearbit acquired by HubSpot — James's role may be shifting"
- **Growth signal:** Headcount up 40% in 6 months
- **Pain point:** Stack has Apollo + Outreach + Gong — paying for 3 tools that don't talk to each other

### 3. Personality Read

| Trait | Read |
| --- | --- |
| Communication style | Direct, data-driven, low tolerance for fluff |
| Decision style | Needs ROI proof before moving; involves CFO |
| Responds well to | Specificity, case studies, peer references |
| Avoid | Vague promises, long demos, feature lists |

### 4. How to open this call

> *"James, I saw your post about tools that promise pipeline but deliver reports. That's exactly the frustration we built Aria around. Can I show you something specific in the first 5 minutes?"*

### 5. Likely objections + handling

- **"We already have Gong"** — response suggested
- **"We're in a budget freeze"** — response suggested
- **"I've seen this before and it doesn't work"** — response suggested

### 6. Recommended close strategy

- Don't pitch the full platform
- Lead with the pre-call brief feature — it solves his exact pain
- Offer a 2-week pilot, no contract
- Loop in his CFO early; don't wait for him to bring it up

### Action bar (drawer footer)

- Open Cal.com link
- Send brief to my email
- **Mark call complete** — triggers the post-call agent

---

## Screen 3 — Post-Call Scorecard

Replaces the brief in the same drawer after the call is marked complete.

- **Call Score:** 73 / 100
- **Talk-to-listen ratio:** 60 / 40 — *you talked too much*
- **Objections raised:** 2 — both handled
- **Buying signals detected:** 1 — asked about pricing
- **Commitments made:** "Send proposal by Friday"
- **What went well:** Opened strong, referenced his LinkedIn post — he responded positively
- **What to fix:** Went into feature explanation too early, lost momentum at minute 12
- **Next action auto-drafted:** Follow-up email written and ready to send; proposal template populated with his details

---

## Screen 4 — Agent Activity Feed

Left sidebar, secondary screen. Shows what the agents are doing in real time — makes the *agentic* nature visible.

- ✅ **Research Agent** — Scanned James Whitfield's LinkedIn (47 posts analysed)
- ✅ **Research Agent** — Found 3 recent tweets, 1 negative signal detected
- ✅ **Intel Compiler** — Brief generated for James Whitfield
- 🔄 **Research Agent** — Currently scanning Priya Nair's online presence…
- ✅ **Outreach Agent** — Follow-up email sent to Marcus O'Brien
- ✅ **Post-Call Agent** — Scorecard generated for Sarah Chen
- 🔄 **Scheduling Agent** — Waiting for David Okafor to confirm timeslot

---

## Screen 5 — New Prospect Input (Modal)

Triggered by the **Add Prospect** button. Two inputs:

1. LinkedIn URL or name
2. Cal.com / Calendly link

**Button:** *Run Intelligence*

Progress animation:

- Searching LinkedIn… ✅
- Scanning recent activity… ✅
- Detecting emotional signals… ✅
- Building company profile… ✅
- Generating brief… ✅
- **Brief ready. Call scheduled.**

---

## Arcade Demo Flow

1. Open to the SDR table — 5 prospects visible, all with different emotional badges.
2. Click **James Whitfield** — brief slides in.
3. Scroll through the brief slowly — emotional signal, what's on his mind, open script.
4. Click **Mark Call Complete** — scorecard animates in.
5. Go back to the table — show the agent activity feed.
6. Click **Add Prospect** — paste a LinkedIn URL — show the progress animation.
7. New prospect appears in the table with "Gathering…" status.
8. End on the table with all 5 prospects ready.

> **Total demo time:** 90 seconds. Every second makes a client's jaw drop.

---

# Build Plan

A self-contained Next.js app. No real backend, no auth, no api-gateway. Every page reads from an in-memory mock fabric with realistic distributions.

## Principles

- **Fabricate freely.** If a feature makes the product look bigger, build it. The demo is the spec.
- **No real backend.** All hooks talk to the mock fabric. Reload = reset to seeded state.
- **Believable numbers.** Every metric derives from the seeded store. Never hardcoded, never random.

## Data Targets

Per org, default scenario:

- 4,000 prospects · 6,500 calls (90d) · 600 calls (7d) · 12 campaigns · 3 agents · 6 teammates.
- **Funnel per 100 dials:** 30 connects → 19 conversations → 8 qualified → 2 booked → 1.3 attended.
- **Top-line:** 6,500 calls → 1,950 connects → 390 booked → 260 attended. Book rate ~6%.
- **Per-campaign variance:** best 9–11%, worst 2–3%.
- **Avg duration** 2m 40s · sentiment 55 / 30 / 15 neutral/positive/negative · quality 7.4 ± 1.2.
- **Outcome mix:** voicemail 38 · no-answer 22 · not-interested 18 · callback 8 · booked 6 · wrong-number 4 · opted-out 2 · other 2.
- **Heatmap:** Tue–Thu 10–11am and 2–4pm run 1.4× baseline. Weekends 10% of weekday volume.
- **Trend:** weekly volume +5–8% WoW with one bad week and one holiday dip. Conversion drifts 4.1% → 6.0% over 90 days.

Distributions live in `lib/mock/distributions.ts`. Every call object flows through them so aggregates land in the bands above automatically.

## Layers

1. **Mock fabric** — in-memory store, seeded faker generators, simulated latency, event clock for live activity.
2. **Pattern library** — `PageHeader`, `StatTile`, `SectionCard`, `DataTable`, `FilterBar`, `DetailDrawer`, `EmptyState`, `InlineEditField`, `Timeline`. Every page is a re-arrangement of these.
3. **Features** — Dashboard, Calls, Live, Leads, Campaigns, Agent Studio, KB, Workflows, Inbox, Settings.

## Phases

### Phase 1 — Foundation

Replace `lib/api/` with `lib/mock/`. Delete `proxy.ts` and the `mockData` env flag. Build the pattern library. Refactor existing pages onto fabric + patterns. *Same scope, better bones.*

### Phase 2 — Pipeline

Leads list with drawer, bulk actions, saved views. Lead Importer wizard (CSV drag-drop, column mapping, validation, dedup/enrichment, streaming import). Campaigns grid, detail page, and 4-step builder.

### Phase 3 — Activity & Intelligence

Dashboard depth: 6 stat tiles, performance chart, funnel widget, heatmap, leaderboards, AI insights computed from the store. Calls drawer with waveform, transcript, AI analysis, CRM panel, timeline. Live page with pulsing map, streaming feed, and live transcript drawer.

### Phase 4 — Polish

Agent Studio (inline-edit, voice picker, sectioned script editor, test call). KB editor. Workflows + Inbox. Settings depth (profile, team, billing, API keys, integrations, notifications). Cmd+K palette, notifications dropdown, org switcher, persona switcher (`⌘⇧D`), onboarding tour, demo-mode banner.

## Out of Scope

Real auth · real gateway · reload persistence · mobile · i18n · tests.

## Risks

- **Fabric drift** — colocate types in `lib/mock/types.ts`.
- **Bundle bloat** — lazy-load wavesurfer, framer-motion, react-simple-maps, faker, papaparse via `next/dynamic`.
- **Numbers contradict** — only ever derive from the store. Add a dev-only `<NumberAudit>` overlay.
- **Presenter surprises** — persona switcher is a hidden chord, surfaced in Help only.

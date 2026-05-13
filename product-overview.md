Here’s the full demo spec.

Product Name
Aria – AI SDR Intelligence Platform
Tagline: Know your prospect before you say hello.

Overall Layout
Three panel application. Left sidebar for navigation. Main content area. Right panel that slides in as a context drawer when you click a prospect.
Dark theme. Professional. Not startup-y. Think Linear meets Gong. Accent colour – electric blue on dark grey background.

Screen 1 – The SDR Command Table (Main View)
This is what the SDR sees every morning. A table of all booked calls.
Columns:
	•	Prospect – Avatar, name, role, company
	•	Call Time – Date, time, countdown (“in 2 hours”, “tomorrow 3pm”)
	•	Emotional Signal – A badge. Four states:
	•	:red_circle: Frustrated – recent negative posts detected
	•	:large_yellow_circle: Evaluating – comparing options, not decided
	•	:large_green_circle: Excited – hiring, growing, announced something
	•	:large_blue_circle: Skeptical – has objected to similar tools before
	•	Intel Status – “Research complete”, “Gathering…”, “Ready for review”
	•	Company Signal – One line. “Just raised Series A” or “Losing customers to competitor X” or “CEO posted about scaling pains yesterday”
	•	Pre-Call Brief – Button. Opens the right panel.
	•	Call Score – Empty before call. Auto-filled after. 0-100 with a colour bar.
	•	Next Action – “Follow up email drafted” or “Demo scheduled” or “Proposal sent”
Fake prospects in the table – make them feel real:
	•	James Whitfield, VP Sales, Clearbit – :red_circle: Frustrated – “Posted about his team missing quota 3 days ago”
	•	Sarah Chen, Founder, Notion-competitor SaaS – :large_green_circle: Excited – “Just closed seed round, hiring sales team”
	•	Marcus O’Brien, Head of RevOps, Intercom – :large_blue_circle: Skeptical – “Tweeted that AI sales tools overpromise”
	•	Priya Nair, COO, HealthTech startup – :large_yellow_circle: Evaluating – “Shortlisting vendors this week per LinkedIn post”
	•	David Okafor, CEO, Lagos-based fintech – :large_green_circle: Excited – “Expanding to UK market, posted about it yesterday”

Screen 2 – Pre-Call Intelligence Brief (Right Drawer)
Slides in when you click any prospect. Full right panel, scrollable.
Top section – Person Snapshot
	•	Large avatar, name, role, company
	•	Connected on LinkedIn badge
	•	“Research completed 47 mins ago”
	•	One line emotional summary: “James is visibly frustrated. His team missed quota last quarter and he’s under pressure from the board. He needs a win.”
Section 1 – What’s On His Mind Right Now
Three cards pulled from recent activity:
	•	LinkedIn post 3 days ago: “Frustrated with tools that promise pipeline and deliver reports” – direct signal
	•	Commented on a post about sales team accountability – signal: feeling pressure from above
	•	Company job post for 3 new AEs – signal: scaling but struggling with current conversion
Section 2 – Company Intelligence
	•	Company size, funding, tech stack detected
	•	Recent news: “Clearbit acquired by HubSpot – James’s role may be shifting”
	•	Growth signal: “Headcount up 40% in 6 months”
	•	Pain point: “Stack has Apollo + Outreach + Gong – paying for 3 tools that don’t talk to each other”
Section 3 – Personality Read
	•	Communication style: Direct, data-driven, low tolerance for fluff
	•	Decision style: Needs ROI proof before moving, involves CFO
	•	Responds well to: Specificity, case studies, peer references
	•	Avoid: Vague promises, long demos, feature lists
Section 4 – How To Open This Call
A script suggestion:
“James, I saw your post about tools that promise pipeline but deliver reports. That’s exactly the frustration we built Aria around. Can I show you something specific in the first 5 minutes?”
Section 5 – Likely Objections + How To Handle Each
	•	“We already have Gong” – Response suggested
	•	“We’re in a budget freeze” – Response suggested
	•	“I’ve seen this before and it doesn’t work” – Response suggested
Section 6 – Recommended Close Strategy
	•	Don’t pitch the full platform
	•	Lead with the pre-call brief feature specifically – it solves his exact pain
	•	Offer a 2 week pilot, no contract
	•	Loop in his CFO early, don’t wait for him to bring it up
Bottom – Action Bar
	•	Open Cal.com link
	•	Send brief to my email
	•	Mark call complete – triggers post-call agent

Screen 3 – Post Call Scorecard (same drawer, after call)
Replaces the brief after call is marked complete.
	•	Call Score: 73 / 100
	•	Talk to listen ratio: 60/40 – you talked too much
	•	Objections raised: 2 – both handled
	•	Buying signals detected: 1 – asked about pricing
	•	Commitments made: “Send proposal by Friday”
	•	What went well: Opened strong, referenced his LinkedIn post – he responded positively
	•	What to fix: Went into feature explanation too early, lost momentum at minute 12
	•	Next action auto-drafted: Follow up email written and ready to send, proposal template populated with his details

Screen 4 – Agent Activity Feed (Left sidebar, secondary screen)
Shows what the agents are doing in real time. Makes the “agentic” nature visible.
Live feed entries:
	•	:white_check_mark: Research Agent – Scanned James Whitfield’s LinkedIn (47 posts analysed)
	•	:white_check_mark: Research Agent – Found 3 recent tweets, 1 negative signal detected
	•	:white_check_mark: Intel Compiler – Brief generated for James Whitfield
	•	:arrows_counterclockwise: Research Agent – Currently scanning Priya Nair’s online presence…
	•	:white_check_mark: Outreach Agent – Follow up email sent to Marcus O’Brien
	•	:white_check_mark: Post-Call Agent – Scorecard generated for Sarah Chen
	•	:arrows_counterclockwise: Scheduling Agent – Waiting for David Okafor to confirm timeslot

Screen 5 – New Prospect Input (Modal)
Simple. Triggered by “Add Prospect” button.
Two inputs only:
	•	LinkedIn URL or name
	•	Cal.com / Calendly link
Button: Run Intelligence
Then a progress animation:
	•	Searching LinkedIn… :white_check_mark:
	•	Scanning recent activity… :white_check_mark:
	•	Detecting emotional signals… :white_check_mark:
	•	Building company profile… :white_check_mark:
	•	Generating brief… :white_check_mark:
	•	Brief ready. Call scheduled.

The Arcade Demo Flow
Open to the SDR table – 5 prospects visible, all with different emotional badges
Click James Whitfield – brief slides in
Scroll through the brief slowly – emotional signal, what’s on his mind, open script
Click “Mark Call Complete” – scorecard animates in
Go back to table – show agent activity feed
Click “Add Prospect” – paste a LinkedIn URL – show the progress animation
New prospect appears in table with “Gathering…” status
End on the table with all 5 prospects ready
Total demo time: 90 seconds. Every second makes a client’s jaw drop.

---

# Build Plan

A self-contained Next.js app. No real backend, no auth, no api-gateway. Every page reads from an in-memory mock fabric with realistic distributions.

## Principles

- **Fabricate freely.** If a feature makes the product look bigger, build it. The demo is the spec.
- **No real backend.** All hooks talk to the mock fabric. Reload = reset to seeded state.
- **Believable numbers.** Every metric derives from the seeded store. Never hardcoded, never random.

## Data targets

Per org, default scenario:

- 4,000 prospects, 6,500 calls (90d), 600 calls (7d), 12 campaigns, 3 agents, 6 teammates.
- Funnel per 100 dials: 30 connects → 19 conversations → 8 qualified → 2 booked → 1.3 attended.
- Top-line: 6,500 calls → 1,950 connects → 390 booked → 260 attended. Book rate ~6%.
- Per-campaign variance: best 9–11%, worst 2–3%.
- Avg duration 2m 40s; sentiment 55/30/15 neutral/positive/negative; quality 7.4 ± 1.2.
- Outcome mix: voicemail 38, no-answer 22, not-interested 18, callback 8, booked 6, wrong-number 4, opted-out 2, other 2.
- Heatmap: Tue–Thu 10–11am and 2–4pm run 1.4× baseline. Weekends 10% of weekday volume.
- Weekly volume trends +5–8% WoW with one bad week and one holiday dip. Conversion drifts 4.1% → 6.0% over 90d.

Distributions live in `lib/mock/distributions.ts`. Every call object goes through them so aggregates land in the bands above automatically.

## Layers

1. **Mock fabric** — in-memory store, seeded faker generators, simulated latency, event clock for live activity.
2. **Pattern library** — `PageHeader`, `StatTile`, `SectionCard`, `DataTable`, `FilterBar`, `DetailDrawer`, `EmptyState`, `InlineEditField`, `Timeline`. Every page is a re-arrangement of these.
3. **Features** — Dashboard, Calls, Live, Leads, Campaigns, Agent Studio, KB, Workflows, Inbox, Settings.

## Phases

**Phase 1 — Foundation.** Replace `lib/api/` with `lib/mock/`. Delete `proxy.ts` and the `mockData` env flag. Build the pattern library. Refactor existing pages onto fabric + patterns. Same scope, better bones.

**Phase 2 — Pipeline.** Leads list with drawer, bulk actions, saved views. Lead Importer wizard (CSV drag-drop, column mapping, validation, dedup/enrichment, streaming import). Campaigns grid + detail page + 4-step builder.

**Phase 3 — Activity & Intelligence.** Dashboard depth: 6 stat tiles, performance chart, funnel widget, heatmap, leaderboards, AI insights computed from the store. Calls drawer with waveform, transcript, AI analysis, CRM panel, timeline. Live page with pulsing map, streaming feed, and live transcript drawer.

**Phase 4 — Polish.** Agent Studio (inline-edit, voice picker, sectioned script editor, test call). KB editor. Workflows + Inbox. Settings depth (profile, team, billing, API keys, integrations, notifications). Cmd+K palette, notifications dropdown, org switcher, persona switcher (cmd+shift+D), onboarding tour, demo-mode banner.

## Out of scope

Real auth. Real gateway. Reload persistence. Mobile. i18n. Tests.

## Risks

- **Fabric drift** — colocate types in `lib/mock/types.ts`.
- **Bundle bloat** — lazy-load wavesurfer, framer-motion, react-simple-maps, faker, papaparse via `next/dynamic`.
- **Numbers contradict** — only ever derive from the store. Add a dev-only `<NumberAudit>` overlay.
- **Presenter surprises** — persona switcher is a hidden chord, surfaced in Help only.

Ready to build it?​​​​​​​​​​​​​​​​

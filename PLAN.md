# Xylo Portal Demo — Premium Mock Plan

## Why

The current portal is a **read-only viewer** sitting on top of static JSON. Pages render correctly but feel hollow: dashboard charts re-aggregate the same 20 calls, agent/KB/org/settings are flat key-value dumps, there are no mutations, no campaigns, no lead pipeline, no live activity. A buyer demo'ing Xylo today would see "yes, calls happened" and nothing else.

Goal of this plan: turn the portal into a **fabricated-but-believable SaaS product** that looks and behaves like the category-leader for AI outbound calling. Everything is mocked — no real network, no real auth, no api-gateway dependency. The entire experience is a self-contained Next.js app whose only job is to *feel premium and complete* in a 10-minute demo.

Three principles drive every decision:

1. **Fabricate freely.** Any feature that makes the product look bigger is fair game, even if api-gateway has no endpoint for it. The demo is the spec, not the gateway.
2. **No real backend.** Strip the `mockData` env flag — there is no real path. All "fetches" go through an in-memory mock fabric that simulates latency, websockets, and mutations.
3. **Believable numbers.** Every metric must look like it came from a real outbound sales motion, not a random number generator. See "Realistic data targets" below — these are non-negotiable.

---

## Realistic data targets

The fastest way a demo gets called fake is bad numbers. A 92% connect rate, 4-second average call duration, or every campaign converting equally tells the audience this is a toy. We anchor every fabricated metric to industry-plausible ranges.

### Volume baselines (per org, default scenario)

- **Total leads in CRM:** ~4,000
- **Calls placed (last 90 days):** ~6,500
- **Calls placed (last 7 days):** ~600
- **Active campaigns:** 4 running, 6 paused/completed, 2 drafts (12 total)
- **Agents configured:** 3
- **Team members:** 6

### Funnel ratios (industry-plausible for B2B outbound voice AI)

Anchor every funnel chart, every campaign card, every dashboard tile to these bands. Per 100 dials:

- **Connect rate (someone picks up):** 25–35% → ~30 connects
- **Conversation rate (talks > 30s):** 60–70% of connects → ~19 conversations
- **Qualified (passed discovery):** 35–45% of conversations → ~8 qualified
- **Meeting booked:** 20–30% of qualified → ~2 meetings
- **Show-up rate (meeting actually happens):** 60–70% of booked → ~1.3 attended

So the top-line story for the dashboard demo: **6,500 calls → ~1,950 connects → ~390 meetings booked → ~260 attended**. Book rate (meetings / dials) reads as **~6%**, which is genuinely strong-but-believable for AI outbound. Per-campaign variance should be wider: best campaign 9–11%, worst 2–3%.

### Call-shape data

- **Average call duration:** 2m 40s overall; meeting-booked calls 4m 10s; voicemail 18s; not-interested 45s.
- **Talk/listen ratio:** agent 45%, lead 55% on booked calls; flipped on lost calls.
- **Sentiment distribution:** 55% neutral, 30% positive, 15% negative.
- **Quality score:** mean 7.4 / 10, std-dev ~1.2.
- **Outcome mix across all dials:** voicemail 38%, no-answer 22%, not-interested 18%, meeting-booked 6%, callback 8%, wrong-number 4%, opted-out 2%, other 2%.

### Time-of-day & day-of-week patterns

The heatmap must not be uniform. Bake in the real patterns sales teams know:

- **Best hours:** Tue–Thu 10–11am and 2–4pm local. ~1.4× baseline connect rate.
- **Worst hours:** Mon before 10am, Fri after 3pm. ~0.5× baseline.
- **Weekends:** ~10% of weekday volume, connect rate flat.

### Lead-level signal

- **Lead score distribution:** roughly normal around 55, skewed slightly high. ~12% above 80 ("hot"), ~20% below 30 ("cold").
- **Source mix:** Website form 35%, CSV import 25%, HubSpot sync 20%, Apollo 12%, manual 8%.
- **Status mix:** new 28%, queued 14%, calling 6%, completed 47%, DNC 5%.

### Growth & motion

- Weekly call volume should trend **up and to the right** with ~5–8% week-over-week growth and realistic dips (one bad week, one holiday week with -40%).
- Connect rate should be **flat-ish** (±2pp) — efficiency doesn't usually swing wildly.
- Conversion rate should show a **gentle improvement** over the 90-day window (4.1% → 6.0%) — sells the "we get smarter" narrative.

### How to enforce

The fabric does not call `faker.number.int({min, max})` directly for metrics. Instead, `lib/mock/distributions.ts` exports tuned generators: `dialOutcome()`, `callDuration(outcome)`, `sentiment(outcome)`, `qualityScore(outcome)`, `connectRateForHour(dow, hour)`. Every call object goes through these so all downstream aggregates fall into the bands above automatically.

Numbers shown to the user must always be **derived from the seeded store**, never hardcoded in components. If the store says 6,512 calls happened, the KPI tile says 6,512 — never a different number elsewhere on the page.

---

## How

Three layers, built in order across four phases.

1. **Mock fabric** — a single in-memory store + faker-based generators tuned to the distributions above + simulated latency + a fake event stream. All hooks talk to this; nothing else.
2. **Design system pass** — promote a small set of repeating compositions (PageHeader, StatTile, EmptyState, SectionCard, DataTable, Drawer pattern, FilterBar) so every new page is a re-arrangement of known pieces.
3. **Feature build-out** — new sections (Campaigns, Leads, Live, Workflows, Playground, Inbox) and depth passes on existing sections (Dashboard, Calls, Agent, KB, Settings).

Phases below are the execution unit. Each phase ends with a demo-able state.

---

# Phase 1 — Foundation

**Goal:** make the existing portal feel solid before adding surface area. End of this phase: same pages as today, but built on the mock fabric, using shared patterns, with realistic numbers. A presenter can already give a credible 5-minute walkthrough of Dashboard + Calls.

**Why this is phase 1:** every later feature depends on the fabric and the patterns. Building Campaigns on top of static JSON and inconsistent cards would be thrown away.

## 1.1 Mock fabric

Replaces `lib/api/` with `lib/mock/`:

- `lib/mock/store.ts` — in-memory singleton, plain Maps/arrays keyed by entity.
- `lib/mock/seed.ts` — runs once on module load, fixed faker seed, generates the volume baselines above.
- `lib/mock/distributions.ts` — tuned generators enforcing the funnel ratios, call-shape data, and time-of-day patterns.
- `lib/mock/generators/*.ts` — `makeLead`, `makeCall`, `makeCampaign`, `makeAgent`, `makeMember`. All pure, all typed.
- `lib/mock/handlers.ts` — async functions replacing every entry in `lib/api/xylo.ts`. Wrap real work in `simulate(80, 240)`. ~2% of writes throw `MockError`.
- `lib/mock/clock.ts` — `useMockClock()` hook + event bus emitting `call.started` / `call.ended` / `lead.imported` at the rate implied by the volume baselines (~600 calls/wk = ~1 every ~17 min during business hours; faster in demo time).
- `lib/mock/scenarios.ts` — named scenarios (`happy-path`, `first-day`, `power-user`, `investor-pitch`). Switching re-seeds.

Delete `lib/api/xylo.ts`'s real-fetch branch, `lib/api/mocks/*.json`, the `mockData` env flag, and root `proxy.ts`.

`hooks/queries.ts` keeps the same hook names and shapes. Only the implementation swaps to call handlers.

Contract:

```ts
type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
```

## 1.2 Pattern library

Build the compositions in `components/patterns/` and adopt them across existing pages in the same PR sequence:

- `PageHeader`, `StatTile`, `SectionCard`, `DataTable`, `FilterBar`, `DetailDrawer`, `EmptyState`, `InlineEditField`, `Timeline`.
- Visual polish pass: consistent `rounded-xl` cards / `rounded-lg` controls, single elevation token, tabular numerics on every number, semantic status colors, skeletons matching final shape.
- Light motion via Framer Motion: drawer slide, row enter, KPI tween, toast stack. 150–250ms ease-out, nothing flashier.

## 1.3 Existing pages refactored

- **Dashboard, Calls, Agent, KB, Org, Settings** rewritten on the new patterns and the fabric. No new features yet — same scope, better bones.
- Numbers now come from the seeded store and respect the distributions, so the dashboard reads as "6,512 calls · 30.1% connect · 6.2% book rate" instead of the current flat stat.

**Phase 1 exit criteria:** all current pages work without `proxy.ts` or any real fetch; KPIs and tables show realistic-looking data; cmd+k stub exists but is empty; presenter can do today's demo with materially higher fidelity.

---

# Phase 2 — Pipeline (Leads & Campaigns)

**Goal:** introduce the "how work gets into Xylo" story. Lead Importer is the flagship of this phase — it's the single most credibility-building feature we can ship. End of phase: presenter can demo end-to-end pipeline creation: import a CSV → review leads → build a campaign → launch.

**Why this is phase 2:** without leads and campaigns, depth on Calls and Live has nothing to ride on. This phase creates the entities the later phases visualize.

## 2.1 Leads list

DataTable + FilterBar over `useLeads()`:

- Columns: name, company, phone, email, status, last touched, source, campaign, lead score (color band 0–100).
- Row click → DetailDrawer with **Profile / Activity / Notes / Raw** tabs. Activity tab uses the Timeline pattern.
- Bulk actions: assign to campaign, mark DNC, export, delete.
- Saved views: "Hot leads" (score > 80), "Never contacted", "Imported today".
- Source mix on filter chips matches the realistic distribution.

## 2.2 Lead Importer (flagship)

Multi-step wizard at `Leads → Import`:

1. **Source picker** — CSV drag-drop (real, papaparse), Google Sheets URL, HubSpot/Salesforce/Pipedrive tiles. Non-CSV tiles open a fake OAuth modal (spinner → success toast).
2. **Column mapping** — auto-detect with confidence pills. "AI-suggest" button shimmers and re-orders.
3. **Validation preview** — first 50 rows, inline errors, top-of-page counts ("3,812 valid · 47 invalid · 124 duplicates"). Numbers respect the realistic invalid/dup rates (~1% invalid, ~3% dup).
4. **Dedup & enrichment** — toggles for skip-duplicates, enrich missing company, auto-assign to campaign. Enrichment is fake: per-row "✨ Enriching" pill animates over 2s.
5. **Confirm & import** — progress bar streaming counts via the mock clock; lands on Leads list with new rows highlighted.

## 2.3 Campaigns list + detail

Grid of campaign cards, not a table — campaigns are visual:

- Card: name, status pill, audience size, calls made, meetings booked, conversion bar (per-campaign variance 2–11%), agent avatar, schedule summary, quick actions on hover.
- **Detail page:** header with pause/resume/duplicate/end, KPI strip, funnel chart (Dialed → Connected → Qualified → Booked with realistic drop-offs), call log filtered to this campaign, "AI insights" card with fabricated takeaways pulled from the campaign's own data ("Top objection: pricing — 34% of lost calls" — the 34% is computed from the seeded objections).

## 2.4 Campaign builder

4-step wizard:

1. **Audience** — filter leads, live count updates as filters change.
2. **Agent & script** — pick agent, edit opening line, add objections.
3. **Schedule** — timezone, business hours grid, daily cap, retry rules. Defaults respect the "best hours" pattern.
4. **Review & launch** — preview pane on right throughout; launch creates the campaign in the fabric and the dashboard activity feed picks it up.

**Phase 2 exit criteria:** presenter can import 4,000 leads from a CSV, build a campaign, launch it, see it appear on the dashboard activity feed and start ticking up call counts.

---

# Phase 3 — Activity & Intelligence

**Goal:** make Xylo feel *alive* and *smart*. This phase delivers the two highest-impact demo moments: a Live page that visibly moves, and a Call detail experience that feels AI-native. Plus deep Dashboard analytics that tell the "we make you better at outbound" story.

**Why this is phase 3:** pipeline exists, so live activity has something to draw from. Dashboard depth needs realistic 90-day history, which the fabric now generates.

## 3.1 Dashboard depth

Replace the current flat dashboard:

- **6 StatTiles** with sparklines + WoW deltas (calls, connects, conversations, meetings booked, show-up rate, avg quality score). Numbers anchored to the funnel ratios.
- **Performance chart** — area chart, metric switcher (calls / connect rate / meetings / pipeline $), range switcher (7d / 30d / 90d / QTD), "vs prior period" toggle. Shows the up-and-to-the-right trend with a realistic dip.
- **Funnel widget** — Lead → Dialed → Connected → Qualified → Meeting Booked with drop-off % and absolute counts that match the ratios.
- **Heatmap** — day-of-week × hour-of-day, cells colored by connect rate. The Tue–Thu mid-day hotspot must be visible.
- **Leaderboards** — top campaigns by booked meetings, top agents by quality score.
- **AI insights** — 3 fabricated cards computed from the store ("Tuesday 2pm runs 38% above average connect rate — consider shifting more dials there"). Computed, not hardcoded, so they change with scenario.
- **Activity timeline** — mixed events (campaign launched, lead batch imported, member joined, agent updated), fed by the clock.

## 3.2 Calls depth

Drawer becomes the centerpiece:

- **Header** — outcome pill, sentiment chip, quality ring, duration, timestamp.
- **Audio player** — wavesurfer.js waveform, click-to-seek. Single placeholder MP3 looped; waveform regenerated per call from seeded random.
- **Transcript** — speaker-labelled, search box, sentiment dot per turn, click line to seek.
- **AI analysis** — objections detected (chips), commitments made, next steps, summary paragraph, talk/listen ratio bar matching the booked-vs-lost pattern.
- **CRM panel** — what synced, status, link to fake CRM record, re-sync button.
- **Timeline** — greeting / objection raised / meeting offered / meeting booked events.

## 3.3 Live page

Subscribes to the mock clock:

- Pulsing dot-density map (react-simple-maps) showing dial locations.
- Right rail: live feed of starts/ends, color-coded by outcome (matching outcome-mix distribution).
- Top KPIs that tick: calls-in-flight, calls-today, meetings-today, avg duration.
- Click live call → drawer with **streaming transcript** (canned exchange picked by outcome, lines arrive every 800–1500ms), live sentiment meter, agent talk/listen ratio updating.

**Phase 3 exit criteria:** presenter can show a dashboard that tells a real growth story, open any historical call and play through transcript + waveform + AI analysis, and switch to Live to watch the system breathe.

---

# Phase 4 — Configuration & Polish

**Goal:** complete the surface and add the global polish moves that take the demo from "great" to "this is the next big thing." Everything a buyer would click on after the wow moments should also feel finished.

## 4.1 Agent Studio

Promote read-only Agent into a workspace:

- InlineEdit name/persona, voice picker with 3-sec preview clips, tone slider.
- Script editor sectioned (opening / qualification / pitch / objections / close), per-section "AI rewrite" buttons with typing animation.
- **Test call panel** — phone input + "Call me now" → fake outgoing-call modal: ringing → connected → live transcript stream → outcome.
- Visual weekly schedule grid (drag to set hours).
- Versions list with diff view and restore.

## 4.2 Knowledge Base editor

Tabbed (Products / Objections / Case Studies / FAQs / Competitors / Guards). Add/edit/delete with optimistic mutations. "AI suggest" buttons in Objections and FAQs fabricate 3 suggestions with accept/dismiss. Products tab has a file-drop zone that fakes PDF extraction.

## 4.3 Workflows & Inbox

- **Workflows page** — CRM mapping rules, business-hours-by-segment, retry policies. Editable. Sells the "configurable" story.
- **Inbox** — unified feed of hot replies needing human follow-up, failed CRM syncs, agent errors. Read/unread, assignable, resolvable. Sells human-in-the-loop.

## 4.4 Settings depth

- **Profile** — InlineEdit name/email, avatar upload (data URL).
- **Team** — invite modal, pending invites, role changes, remove member.
- **Billing** — current plan, usage meters (dial minutes, enrichments) showing realistic consumption against the 6,500-calls volume, invoice history, fake "Upgrade" flow.
- **API keys** — list / create / revoke, one-time-reveal.
- **Integrations** — CRM/calendar/Slack tiles with fake OAuth.
- **Notifications** — toggle matrix.

## 4.5 Global polish

- **Command palette (cmd+k)** — `cmdk`, searches leads/calls/campaigns, exposes actions ("New campaign", "Import leads", "Toggle theme").
- **Notifications dropdown** — bell in header, fed by the mock clock.
- **Org switcher** — header dropdown with Acme / Globex / Initech. Switching re-seeds with a different scenario, so dashboards visibly change. Sells multi-tenancy.
- **Persona switcher (cmd+shift+D)** — presenter-only, switches scenarios on the current org ("first day" / "power user" / "investor pitch").
- **Onboarding tour** — first-load coachmarks across Dashboard → Leads → Campaigns → Live. Dismissable, replayable from Help.
- **Demo mode banner** — thin top bar: "Demo environment · data is simulated · Reset demo".

**Phase 4 exit criteria:** every click in the product lands on a finished surface. No dead links, no flat pages, no "coming soon".

---

## Out of scope

- Real auth. Session is a fixture.
- Real api-gateway integration. `proxy.ts` is deleted in phase 1.
- Persistence across reloads. Reload = reset to seeded state. This is correct for a demo.
- Mobile. Tablet-and-up only.
- i18n. English only.
- Tests. Demo surface, not production code. Revisit if it becomes long-lived.

---

## Risks & mitigations

- **Fabric drift** — handler shapes diverge from hook expectations. Colocate types in `lib/mock/types.ts`, import from both sides.
- **Bundle bloat** — wavesurfer, framer-motion, react-simple-maps, faker, papaparse. Lazy-load heavy ones via `next/dynamic` so the dashboard stays fast.
- **"Too obviously fake"** — counter with realistic distributions (see Realistic data targets), latency jitter, occasional errors, plausible names from faker locale.
- **Numbers contradict across pages** — only ever derive from the store, never hardcode. Add a dev-only `<NumberAudit>` overlay in phase 1 that highlights any literal numeric in a tile.
- **Presenter surprises** — persona switcher must be discoverable for presenter, *not* for audience. Hidden chord (cmd+shift+D), surfaced in Help menu only.

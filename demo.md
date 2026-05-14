# Xylo Portal — Arcade Demo Guide

We are publishing three short Arcade demos of Xylo Portal for stakeholders. Each one is a clean, click-through walkthrough focused on **results and output**, not features or UI tours. Pick the path that matches the audience.

Target length per demo: **60–90 seconds**, 8–12 steps.

---

## Before you start capturing

1. **Pull latest** and run the portal locally.
   ```bash
   cd demos/xylo-portal
   pnpm install
   pnpm dev
   ```
   Open `http://localhost:3000`.

2. **Browser setup.**
   - Chrome, clean profile, no extensions visible.
   - Window size **1440×900**, zoom **100%**.
   - Hide the bookmarks bar. Close all other tabs.

3. **Install the Arcade Chrome extension** and sign in.
   - Capture mode: **Auto-capture** (Arcade records each click as a step).
   - Resolution: 1440×900.

4. **Dry run the flow** before recording. Reload the page once to reset the mock fabric to its seeded state — every number on screen should look believable (book rate ~6%, 6.5k calls over 90d, etc.).

5. **Capture cleanly.** No back-clicks, no hesitation, no opening the wrong drawer. If you misclick, stop and restart — it is faster than editing in Arcade.

---

## Shared conventions (apply to all three demos)

- **Cover screen.** Xylo wordmark, demo title, one-sentence subtitle. Dark background.
- **Hotspot copy.** Maximum two short sentences per step. Lead with the result, not the UI element.
- **No filler steps.** Every step must move the story forward. If a step would say "this is the sidebar", cut it.
- **End screen.** One-line takeaway and a CTA: *Book a 15-minute walkthrough*.
- **No emojis, no exclamation marks.** Stakeholder tone.
- **Branding.** Use the Xylo logo as the watermark. Theme: dark.
- **Sharing.** Set the Arcade to **Public, password-optional**. Disable Arcade branding if the plan allows.

---

## Demo 1 — The Operator View

**Audience:** Sales leaders, RevOps, COOs. People who need to know the team is producing and the system is observable.

**Story in one line:** *"You can see every call, every outcome, in real time."*

**Path:**

| # | Page | What to click | Hotspot copy (suggested) |
|---|---|---|---|
| 1 | Cover | — | "Xylo — the operating layer for AI outbound calling." |
| 2 | `/` Dashboard | Land on page | "6,500 calls in the last 90 days. 6% book rate. Live numbers, derived from real activity." |
| 3 | `/` Dashboard | Click the range toggle to `7d` | "Slice any window. Last 7 days: ~600 calls, trending up week over week." |
| 4 | `/` Dashboard | Scroll to the heatmap | "See exactly when your team converts. Tue–Thu, 10am and 2pm, every time." |
| 5 | `/` Dashboard | Hover the AI Insights panel | "The system flags what is working and what to fix. No dashboards to build." |
| 6 | `/calls` | Click into the Calls page | "Every call, searchable, with transcript and AI analysis." |
| 7 | `/calls` | Open one booked call's drawer | "Full transcript, sentiment, and the moment the meeting was booked." |
| 8 | `/live` | Navigate to Live | "What is happening right now. Live transcripts, no waiting for a report." |
| 9 | End screen | — | "Visibility into every call. Book a 15-minute walkthrough." |

**Length:** ~75 seconds.

---

## Demo 2 — The Pipeline View

**Audience:** VPs of Sales, demand-gen leaders, founders evaluating an outbound motion.

**Story in one line:** *"Leads in, meetings booked. Here is the funnel."*

**Path:**

| # | Page | What to click | Hotspot copy (suggested) |
|---|---|---|---|
| 1 | Cover | — | "Xylo — leads in, meetings booked." |
| 2 | `/leads` | Land on Leads | "4,000 leads, scored and segmented. Sources mixed across web, CSV, HubSpot, Apollo." |
| 3 | `/leads` | Click into a hot lead | "Lead score, full activity timeline, every touchpoint logged." |
| 4 | `/campaigns` | Navigate to Campaigns | "Campaigns target a segment and run an agent. Twelve in flight." |
| 5 | `/campaigns/[id]` | Open the top-performing campaign | "9–11% book rate on the winners. Underperformers get paused." |
| 6 | `/campaigns/[id]` | Scroll to the performance chart | "Every campaign reports its own funnel: dials, connects, conversations, meetings." |
| 7 | `/` Dashboard | Navigate back to Dashboard, scroll to funnel | "Top-line: 6,500 dials → 1,950 connects → 390 meetings booked → 260 attended." |
| 8 | `/` Dashboard | Hover the conversion-trend chart | "Conversion improves over the 90-day window as the agent learns." |
| 9 | End screen | — | "From cold list to booked calendar. Book a 15-minute walkthrough." |

**Length:** ~80 seconds.

---

## Demo 3 — The AI Product View

**Audience:** Product evaluators, technical buyers, anyone asking "does the AI actually work."

**Story in one line:** *"Configure the agent, hear the call, see the analysis."*

**Path:**

| # | Page | What to click | Hotspot copy (suggested) |
|---|---|---|---|
| 1 | Cover | — | "Xylo — the AI sales agent, in full." |
| 2 | `/agent` | Land on Agent Studio | "One agent, fully configurable. Voice, script, knowledge — no code." |
| 3 | `/agent` | Click into the script editor | "Sectioned script: intro, discovery, objection handling, close. Editable inline." |
| 4 | `/agent` | Scroll to knowledge bindings | "The agent answers from your knowledge base, live during the call." |
| 5 | `/knowledge-base` | Navigate to Knowledge Base | "Your sources of truth. The agent never makes up an answer." |
| 6 | `/calls` | Navigate to Calls and open a booked call | "Here is the agent on a real call." |
| 7 | Call drawer | Show transcript | "Full transcript with speaker turns and sentiment." |
| 8 | Call drawer | Scroll to AI analysis | "Quality score, objections raised, buying signals, commitments captured." |
| 9 | `/inbox` | Navigate to Inbox | "When the agent hands off, a human picks up here. Nothing falls through." |
| 10 | End screen | — | "AI you can audit, end to end. Book a 15-minute walkthrough." |

**Length:** ~90 seconds.

---

## Publishing checklist

For each of the three demos, before sharing:

- [ ] Cover screen reads cleanly at 50% zoom (Arcade share previews are small).
- [ ] Every hotspot is short, professional, and leads with the result.
- [ ] No hotspot covers a number or a chart axis.
- [ ] No PII or test-account names visible.
- [ ] The mock fabric numbers are believable (no `0` tiles, no `NaN`, no `undefined`).
- [ ] End screen has the CTA link wired to the scheduling page.
- [ ] Set to **Public** with the right title and SEO description.
- [ ] Capture the share URL and drop all three into the stakeholder doc.

---

## Naming and storage

- Arcade titles: `Xylo — Operator View`, `Xylo — Pipeline View`, `Xylo — AI Product View`.
- Save the share URLs in the stakeholder folder alongside this file.
- Filename convention if you also export MP4 backups: `xylo-{view}-YYYY-MM-DD.mp4`.

---

## What to skip

- Settings, Organization, Login. Out of scope for stakeholder demos.
- The lead import wizard. Too long, breaks the 90-second target.
- Persona switcher, workflows, demo-mode banner. Internal-only.

If a stakeholder asks for more, the next step is a live 15-minute walkthrough, not a longer Arcade.



# EPIC Match — Full Build Plan

## Overview
AI-powered mentor-founder matching app for EPIC Lab ITAM. Single-page React app with dark theme (#0a0a0a), burnt orange accent (#c2410c), Inter font. No auth, no DB, no routing library — pure state-driven navigation.

## Build Order (8 phases)

### Phase 1: Foundation & Data Layer
- Set up global dark theme (CSS variables, Inter font import)
- Create TypeScript types for Founder, Mentor, and MatchResult
- Create hardcoded demo data: 8 mentor profiles, 5 founder profiles with realistic ITAM data
- Create constants file with all chip option lists (majors, stages, industries, challenges, etc.)
- Create app state manager (React context or useState in App) to track: current screen, role, form data, results

### Phase 2: Shared UI Components
- **ChipSelector**: single-select and multi-select variants with max selection prop. States: default (dark border), hover, selected (burnt orange). Used for most form fields.
- **SearchableMultiSelect**: for ITAM majors — text input with filtered dropdown, max 2 selections, chips showing selections. Built with the existing Command/Popover primitives.
- **ProgressBar**: 3-step indicator with burnt orange fill
- **ScreenShell**: centered container (max-w 600px for forms, 700px for results)

### Phase 3: Landing Page & Role Selection
- Landing: EPIC Match branding, tagline, single CTA button
- Role select: two cards — "I'm a founder" / "I'm a mentor" — burnt orange hover/select state

### Phase 4: Founder Form (3 steps)
- **Step 1**: Full name (text input), ITAM major (searchable multi-select max 2), startup name (text input), startup stage (single chips), industry (single chips)
- **Step 2**: Main challenge (single chips), support needs (multi chips max 2), meeting frequency (single chips)
- **Step 3**: 3-month goal (textarea, 400 char limit, helper text below)
- Back/Next navigation between steps. "Find my mentors" on step 3.

### Phase 5: Loading State & Founder Results
- **Loading screen**: minimum 3-5 seconds display. Rotating messages every 1.5s with a simple animation. Progress or spinner.
- **Results screen**: vertical stack of up to 3 match cards, max-w 700px
  - Each card: mentor name, role, explanation (dominant), expertise tags as read-only chips (2-4), match strength score in small burnt orange text, muted caveat when present
- Wire up with hardcoded scoring first (no API yet) — deterministic logic only to prove the UI

### Phase 6: Mentor Form (3 steps)
- **Step 1**: Full name, ITAM major (searchable multi-select max 2), current role (text input), experience background (multi chips)
- **Step 2**: Expertise (multi chips max 4), industries (multi chips), preferred mentee stage (multi chips)
- **Step 3**: Meeting frequency (single chips), monthly time (single chips), mentoring capacity (single chips), 3-month outcome textarea (400 chars)
- Confirmation screen after submit. "See My Matches" button leads to mentor results (matched against hardcoded founders).

### Phase 7: Deterministic Matching Engine
- Implement app-side scoring in a utility module:
  - Hard filter: skip mentors at capacity or mismatched stage
  - Industry fit: exact match bonus
  - Meeting cadence fit: exact/compatible match score
  - Experience background bonus
- Returns filtered + scored candidates ready for Claude API enrichment

### Phase 8: Claude API Integration
- Add Claude API key via Lovable secrets
- Build API call function: sends founder profile + top mentor candidates (or mentor + founders) to Claude
- Claude returns: score_challenge_expertise (0-35), score_open_text_alignment (0-25), explanation, caveat, final ranking
- Merge deterministic + AI scores, sort, display top 3
- Error handling: fallback to deterministic-only results if API fails

---

## Technical Details

**File structure:**
```text
src/
  data/
    constants.ts        — all chip options, majors list
    mentors.ts          — 8 hardcoded mentor profiles
    founders.ts         — 5 hardcoded founder profiles
  types/
    index.ts            — Founder, Mentor, MatchResult types
  components/
    ChipSelector.tsx    — reusable chip single/multi select
    SearchableMultiSelect.tsx — majors field
    ProgressBar.tsx     — 3-step progress
    ScreenShell.tsx     — centered layout wrapper
    Landing.tsx
    RoleSelect.tsx
    FounderForm.tsx     — manages 3 steps internally
    MentorForm.tsx      — manages 3 steps internally
    LoadingScreen.tsx
    ResultCard.tsx
    ResultsScreen.tsx
    ConfirmationScreen.tsx
  lib/
    matching.ts         — deterministic scoring engine
    claude.ts           — Claude API call + response parsing
  pages/
    Index.tsx           — state machine driving all screens
```

**State machine in Index.tsx:**
One `screen` state variable cycling through: `landing → role → founder-step-1/2/3 → loading → founder-results` (and parallel mentor flow). Form data stored in `founderData` / `mentorData` state objects.

**Claude API prompt structure:**
Send structured JSON with founder profile + candidate mentors. Request JSON response with scores, explanation, caveat per candidate.

## Decisions Confirmed
- Searchable multi-select for ITAM majors (max 2), chips for everything else
- 8 mentors, 5 founders hardcoded
- Mentor "See My Matches" matches against hardcoded founders
- Claude API key provided by user (will store in Lovable secrets)
- Founder flow built and polished before mentor flow


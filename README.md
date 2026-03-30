# EPIC Match

AI-powered mentor-founder matching prototype for EPIC Lab ITAM.

EPIC Match helps ITAM founders find the right alumni mentors using AI-assisted compatibility scoring. The product is designed around a founder-first flow: founders submit their profile, the app scores eligible mentors, and returns the top matches with concise explanations and an optional caveat.

## Why this project exists

EPIC Lab connects student founders with alumni mentors, but matching quality becomes harder to maintain as the ecosystem grows. EPIC Match is a prototype that explores a more structured and scalable matching process by combining deterministic product logic with AI-generated judgment where it adds the most value.

## Core product flow

### Founder flow

* Landing page
* Role selection
* 3-step founder onboarding
* Intentional loading state
* Top 3 mentor matches

### Mentor flow

* Role selection
* 3-step mentor onboarding
* Confirmation screen
* Optional entry into mentor-side match results

## Matching logic

The matching system is split between app-side scoring and Claude-based scoring.

### Computed in the app

* Hard filters

  * capacity
  * stage fit
* Deterministic scoring

  * industry fit
  * meeting cadence fit
  * experience background bonus

### Computed by Claude

* Challenge × Expertise score
* Open text alignment score
* Match explanation
* Optional caveat

The final match score combines both deterministic and AI-generated components, then ranks the top candidates.

## Product design direction

* Dark minimal UI
* Burnt orange accent
* Explanation visually dominant
* Score visible, but secondary
* Mobile-responsive form flow
* Chips for most structured inputs
* Searchable multi-select for ITAM majors, with up to 2 selections

## Tech stack

* React
* TypeScript
* Vite
* Tailwind CSS
* Lovable
* Claude API

## Project status

This is an in-progress prototype. The core UI, onboarding flows, demo data, and matching architecture are being built first. The goal is to create a polished demo for the MAD Fellowship 2026 challenge by EPIC Lab ITAM.

## Getting started

Install dependencies:

npm install

Start the development server:

npm run dev

Build the project:

npm run build

Run linting:

npm run lint

Run tests:

npm run test

## Project structure

src/
data/
constants.ts
mentors.ts
founders.ts
types/
index.ts
components/
ChipSelector.tsx
SearchableMultiSelect.tsx
ProgressBar.tsx
ScreenShell.tsx
ResultCard.tsx
ConfirmationScreen.tsx
Landing.tsx
RoleSelect.tsx
FounderForm.tsx
MentorForm.tsx
LoadingScreen.tsx
ResultsScreen.tsx
lib/
matching.ts
claude.ts
pages/
Index.tsx

## Notes

* This repo currently uses hardcoded demo data for mentors and founders.
* The founder flow is the primary polished path.
* The mentor flow is included as a secondary, lighter path.
* Claude integration should enhance ranking and explanations, but the app remains the source of truth for deterministic matching logic.

## License

No license specified yet.


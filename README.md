# EPIC Match Copilot 
**The Intelligent Matching Platform for EPIC Lab ITAM**

EPIC Match is a high-fidelity matching engine designed to connect ITAM founders with expert mentors. It combines strict deterministic business logic with the qualitative reasoning of Claude 3.5 to ensure every connection is both practical and meaningful.

## Key Features
* **Hybrid Matching Engine**: Uses a 45-point deterministic scale (Industry, Stage, Cadence) followed by AI-enriched qualitative scoring.
* **Real-time Dashboards**: Role-specific views for Founders and Mentors to manage the "Handshake".
* **The Feedback Loop**: A self-optimizing system where completed meetups influence future match rankings via a sliding-scale bonus (+5 to -5).
* **Capacity Safeguards**: Prevents mentor burnout by automatically locking profiles that reach their stated mentoring limit.

## Tech Stack
* **Frontend**: React, TypeScript, Tailwind CSS.
* **Backend/Auth**: Supabase (PostgreSQL + RLS Policies).
* **AI Intelligence**: Anthropic Claude API (Claude 3.5 Haiku/Sonnet).

## Project Structure
* `src/hooks/useEpicMatch.ts`: The central state machine and interaction logic.
* `src/lib/matching.ts`: The deterministic "bouncer" and filtering logic.
* `src/lib/claude.ts`: The bridge between the app and AI enrichment.
* `src/pages/api/match.ts`: The server-side prompt engineering for the matching engine.
* `src/lib/supabase.ts`: Database abstractions and feedback aggregation.
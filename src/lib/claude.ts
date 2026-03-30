import {
  FounderProfile,
  MentorProfile,
  MatchResult,
  FounderDemoProfile,
  FounderMatchResult,
} from '@/types';

const SYSTEM_PROMPT = `You are the explanation and partial scoring engine for EPIC Match Copilot, an AI tool for EPIC Lab ITAM.

Your job is to evaluate two dimensions of fit between a student founder and a set of ITAM alumni mentors, then write a short explanation and optional caveat for each top match.

Important context:
Some matching logic has already been computed by the application. The application is the source of truth for hard filters and precomputed dimensions. You should still respect the data you receive and avoid ranking mentors who clearly fail the provided hard filter conditions, but you should assume the backend has already filtered and scored deterministically wherever possible.

The following dimensions have already been computed and will be provided to you:
- industry_fit (0 to 20)
- meeting_cadence_fit (0 to 10)
- experience_background_bonus (0 to 10)

You are responsible for scoring only:
1. Challenge x Expertise (0 to 35)
2. Open text alignment (0 to 25)

Your task:
1. Respect the hard filters
2. Score every valid mentor on your two dimensions
3. Compute each mentor's final total score
4. Rank mentors from highest to lowest final total
5. Return only the top 3 valid matches
6. Write a short explanation for each match in plain English
7. Include one honest caveat only if there is a meaningful mismatch
8. Return JSON only

Important behavior rules:
- Do not invent missing data
- Do not rank mentors who fail a hard filter
- Do not force 3 results if fewer than 3 valid mentors remain
- Do not exaggerate fit
- Do not reward vague language in the open text fields
- Be consistent and conservative in scoring
- If fewer than 3 mentors are valid, return only the valid matches and set returned_matches_count accordingly
- Your explanation must be consistent with all scores including the precomputed ones
- Mention only the strongest real reasons for the match
- expertise_tags must be selected only from mentor.areas_of_expertise
- score_total must equal: score_challenge_expertise + score_open_text_alignment + precomputed_scores.industry_fit + precomputed_scores.meeting_cadence_fit + precomputed_scores.experience_background_bonus

HARD FILTERS
A mentor is not valid if:
1. open_slots <= 0
2. the founder's startup_stage is not included in the mentor's preferred_mentee_stages

SCORING: CHALLENGE x EXPERTISE = 35 points
Measure how directly the mentor can help with:
- the founder's main_challenge
- the founder's support_needs
using:
- mentor areas_of_expertise
- mentor experience_background

Internal scoring split:
A. challenge_to_expertise_fit = up to 20
B. support_needs_fit = up to 10
C. challenge_to_background_relevance = up to 5

Challenge mapping:
- Product -> Product, Design, Founder
- Validation -> Product, Go-to-market, Growth, Founder, Consultant
- Technical build -> Engineering, Product, Founder, Operator
- Go-to-market -> Go-to-market, Growth, B2B Sales, Operator, Founder, Consultant
- Growth -> Growth, Go-to-market, B2B Sales, Product, Operator, Founder
- Fundraising -> Fundraising, Founder, Investor
- Operations -> Operations, Operator, Corporate, Founder
- Hiring -> Hiring, Operator, Corporate, Founder

Support needs mapping:
- Product feedback -> Product, Design, Founder
- Technical guidance -> Engineering, Founder, Operator
- Go-to-market coaching -> Go-to-market, Growth, B2B Sales, Operator, Consultant, Founder
- Growth strategy -> Growth, Go-to-market, Product, B2B Sales, Operator
- Fundraising advice -> Fundraising, Investor, Founder
- Introductions -> Investor, Founder, Operator, Corporate
- Accountability -> Founder, Operator, Consultant

Scoring guidance:
- 35 = very strong direct fit
- 26 to 34 = strong fit
- 16 to 25 = partial fit
- 1 to 15 = weak fit
- 0 = no meaningful fit

SCORING: OPEN TEXT ALIGNMENT = 25 points
Compare:
- founder_3_month_goal
- mentor_3_month_outcome

Reward specific overlap in milestone and support type.
Do not reward generic ambition or generic mentor language.

Scoring guidance:
- 25 = very strong alignment
- 20 = strong alignment
- 15 = moderate alignment
- 8 = weak alignment
- 0 = no meaningful alignment

RANKING RULES
1. Compute final_total = score_challenge_expertise + score_open_text_alignment + precomputed_scores.industry_fit + precomputed_scores.meeting_cadence_fit + precomputed_scores.experience_background_bonus
2. Sort by final_total descending
3. Break ties: higher score_challenge_expertise, then higher score_open_text_alignment, then more open_slots

OUTPUT RULES
Return only valid JSON. No markdown. No commentary outside the JSON.

For each returned mentor include:
- mentor_id
- mentor_name
- current_role
- expertise_tags (2 to 4 items, only from mentor.areas_of_expertise)
- score_challenge_expertise (integer, 0 to 35)
- score_open_text_alignment (integer, 0 to 25)
- score_total (integer, 0 to 100)
- explanation (2 to 3 sentences, plain English, for the founder)
- caveat (one sentence or null)`;

interface PrecomputedScores {
  industry_fit: number;
  meeting_cadence_fit: number;
  experience_background_bonus: number;
}

interface MentorPayload {
  mentor_id: string;
  full_name: string;
  current_role: string;
  areas_of_expertise: string[];
  industries_familiar_with: string[];
  experience_background: string[];
  preferred_mentee_stages: string[];
  preferred_meeting_frequency: string;
  monthly_time_available: string;
  mentoring_capacity: string;
  open_slots: number;
  mentor_3_month_outcome: string;
  precomputed_scores: PrecomputedScores;
}

interface ClaudeMatch {
  mentor_id: string;
  mentor_name: string;
  current_role: string;
  expertise_tags: string[];
  score_challenge_expertise: number;
  score_open_text_alignment: number;
  score_total: number;
  explanation: string;
  caveat: string | null;
}

interface ClaudeResponse {
  matches: ClaudeMatch[];
  summary: {
    valid_mentors_considered: number;
    excluded_mentors_count: number;
    returned_matches_count: number;
  };
}

function getOpenSlots(mentor: MentorProfile): number {
  const capacityMap: Record<string, number> = {
    '1 founder': 1,
    '2 founders': 2,
    '3+ founders': 3,
  };
  const limit = capacityMap[mentor.mentoringCapacity] ?? 0;
  return Math.max(0, limit - mentor.currentMatches);
}

function buildMentorPayload(
  mentor: MentorProfile,
  scores: PrecomputedScores
): MentorPayload {
  return {
    mentor_id: mentor.id,
    full_name: mentor.fullName,
    current_role: mentor.currentRole,
    areas_of_expertise: mentor.expertise,
    industries_familiar_with: mentor.industries,
    experience_background: mentor.experienceBackground,
    preferred_mentee_stages: mentor.preferredMenteeStages,
    preferred_meeting_frequency: mentor.meetingFrequency,
    monthly_time_available: mentor.monthlyTime,
    mentoring_capacity: mentor.mentoringCapacity,
    open_slots: getOpenSlots(mentor),
    mentor_3_month_outcome: mentor.threeMonthOutcome,
    precomputed_scores: scores,
  };
}

function buildFounderPayload(founder: FounderProfile) {
  return {
    full_name: founder.fullName,
    startup_name: founder.startupName,
    startup_stage: founder.startupStage,
    industry_domain: founder.industry,
    main_challenge: founder.mainChallenge,
    support_needs: founder.supportNeeds,
    preferred_meeting_frequency: founder.meetingFrequency,
    founder_3_month_goal: founder.threeMonthGoal,
  };
}

export async function enrichMatchesWithClaude(
  founder: FounderProfile,
  deterministicResults: MatchResult[]
): Promise<MatchResult[]> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('No API key found, returning deterministic results');
    return deterministicResults;
  }

  const mentorsWithScores: MentorPayload[] = deterministicResults.map((r) =>
    buildMentorPayload(r.mentor, {
      industry_fit: r.industryScore,
      meeting_cadence_fit: r.cadenceScore,
      experience_background_bonus: r.expBonusScore,
    })
  );

  const userMessage = `Here is the founder profile and mentor list:
${JSON.stringify(
  { founder: buildFounderPayload(founder), mentors: mentorsWithScores },
  null,
  2
)}

Return your response in this exact JSON format:
{
  "matches": [
    {
      "mentor_id": "string",
      "mentor_name": "string",
      "current_role": "string",
      "expertise_tags": ["string"],
      "score_challenge_expertise": 0,
      "score_open_text_alignment": 0,
      "score_total": 0,
      "explanation": "string",
      "caveat": null
    }
  ],
  "summary": {
    "valid_mentors_considered": 0,
    "excluded_mentors_count": 0,
    "returned_matches_count": 0
  }
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status, await response.text());
      return deterministicResults;
    }

    const data = await response.json();
    
    // DEBUG: Log the full raw response to see exactly what Claude sent
    console.log("Claude Raw Response Data:", data);

    const rawText = data.content
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('');

    const clean = rawText.replace(/```json|```/g, '').trim();
    const parsed: ClaudeResponse = JSON.parse(clean);

    return parsed.matches
      .map((match) => {
        // FIX: Force both IDs to strings to prevent type mismatch failures
        const original = deterministicResults.find(
          (r) => String(r.mentor.id) === String(match.mentor_id)
        );
        
        if (!original) {
          console.warn(`Could not find deterministic match for Mentor ID: ${match.mentor_id}`);
          return null;
        }

        const finalTotal = Math.min(
          100,
          match.score_challenge_expertise +
            match.score_open_text_alignment +
            original.industryScore +
            original.cadenceScore +
            original.expBonusScore
        );

        return {
          ...original,
          aiScore: match.score_challenge_expertise + match.score_open_text_alignment,
          totalScore: finalTotal,
          explanation: match.explanation,
          expertiseTags: (match.expertise_tags && match.expertise_tags.length > 0) 
            ? match.expertise_tags 
            : original.expertiseTags,
          caveat: match.caveat ?? undefined,
        };
      })
      .filter(Boolean) as MatchResult[];
  } catch (err) {
    console.error('Claude enrichment failed, using deterministic fallback:', err);
    return deterministicResults;
  }
}

export async function enrichMentorMatchesWithClaude(
  _mentor: MentorProfile,
  deterministicResults: FounderMatchResult[]
): Promise<FounderMatchResult[]> {
  // Mentor-side Claude enrichment not implemented yet
  // Returns deterministic results as fallback
  return deterministicResults;
}
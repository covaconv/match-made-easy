import {
  FounderProfile,
  MentorProfile,
  MatchResult,
  FounderMatchResult,
} from '@/types';

interface PrecomputedScores {
  industry_fit: number;
  meeting_cadence_fit: number;
  experience_background_bonus: number;
  feedback_bonus: number;
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

interface FounderPayload {
  full_name: string;
  startup_name: string;
  startup_stage: string;
  industry_domain: string;
  main_challenge: string;
  support_needs: string[];
  preferred_meeting_frequency: string;
  founder_3_month_goal: string;
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

function buildFounderPayload(founder: FounderProfile): FounderPayload {
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
  if (!deterministicResults.length) {
    return deterministicResults;
  }

  try {
    const response = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ founder, mentors: deterministicResults.map(r => r.mentor) }),
    });

    if (!response.ok) throw new Error('Claude API failed');

    const parsed = await response.json();

    // Use the ClaudeMatch interface you already defined at the top of the file
    const enriched = parsed.matches.map((match: ClaudeMatch) => {
      // We look for the original mentor object by comparing IDs
      const original = deterministicResults.find(
        (r) => String(r.mentor.id) === String(match.mentor_id)
      );

      if (!original) {
        // If this prints, Mariana is being dropped because the IDs don't match!
        console.warn(`[claude] ID MISMATCH: Could not find original mentor for ID: "${match.mentor_id}".`);
        console.warn(`[claude] Available IDs in deterministic results:`, deterministicResults.map(r => r.mentor.id));
        return null;
      }

      return {
        ...original,
        totalScore: match.score_total ?? original.totalScore,
        aiExplanation: match.explanation,
        caveat: match.caveat
      };
    }).filter(Boolean); // <--- This line deletes the 'nulls' (the missing Mariana)

    return enriched.length > 0 ? enriched : deterministicResults;
    // --- END DEBUG LOGS ---

  } catch (error) {
    console.error('Error in enrichMatchesWithClaude:', error);
    return deterministicResults;
  }
}

// New function for Mentor-side AI enrichment
export async function enrichMentorMatchesWithClaude(
  mentor: MentorProfile,
  matches: FounderMatchResult[]
): Promise<FounderMatchResult[]> {
  if (matches.length === 0) return matches;

  try {
    const response = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'mentor',
        profile: mentor,
        matches: matches.map(m => ({
          id: m.founder.id,
          name: m.founder.fullName,
          startup: m.founder.startupName,
          industry: m.founder.industry,
          stage: m.founder.startupStage,
          challenge: m.founder.mainChallenge,
          needs: m.founder.supportNeeds,
          goal: m.founder.threeMonthGoal
        }))
      }),
    });

    if (!response.ok) throw new Error('Claude API failed');
    const enrichedData = await response.json();

    return matches.map(match => {
      // Explicitly define the shape Claude returns for mentor explanations
      const enrichment = enrichedData.find((e: { id: string; explanation: string; caveat: string | null }) => e.id === match.founder.id);
      return enrichment ? {
        ...match,
        explanation: enrichment.explanation,
        caveat: enrichment.caveat
      } : match;
    });
  } catch (error) {
    console.error('Mentor AI enrichment failed, using deterministic fallback:', error);
    return matches;
  }
}
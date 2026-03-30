import { supabase } from '@/integrations/supabase/client';
import { FounderProfile, MentorProfile, MatchResult, FounderDemoProfile, FounderMatchResult } from '@/types';
import { matchFounderToMentors, matchMentorToFounders } from './matching';

interface AIScore {
  id: string;
  score_challenge_expertise: number;
  score_open_text_alignment: number;
  explanation: string;
  caveat: string | null;
}

export async function aiMatchFounderToMentors(
  founder: FounderProfile,
  allMentors: MentorProfile[],
): Promise<MatchResult[]> {
  // First get deterministic results
  const deterministicResults = matchFounderToMentors(founder, allMentors);

  try {
    const candidates = deterministicResults.map((r) => ({
      id: r.mentor.id,
      fullName: r.mentor.fullName,
      currentRole: r.mentor.currentRole,
      expertise: r.mentor.expertise,
      industries: r.mentor.industries,
      experienceBackground: r.mentor.experienceBackground,
      preferredMenteeStages: r.mentor.preferredMenteeStages,
      meetingFrequency: r.mentor.meetingFrequency,
      threeMonthOutcome: r.mentor.threeMonthOutcome,
      deterministicScore: r.deterministicScore,
    }));

    const { data, error } = await supabase.functions.invoke('match', {
      body: { mode: 'founder', founder, candidates },
    });

    if (error) {
      console.error('AI matching error:', error);
      return deterministicResults;
    }

    const aiResults: AIScore[] = data?.results ?? [];

    // Merge AI scores with deterministic results
    return deterministicResults.map((r) => {
      const ai = aiResults.find((a) => a.id === r.mentor.id);
      if (!ai) return r;

      const aiScore = ai.score_challenge_expertise + ai.score_open_text_alignment;
      const totalRaw = r.deterministicScore + aiScore;
      // Max possible: ~50 deterministic + 60 AI = 110
      const totalScore = Math.min(100, Math.round((totalRaw / 110) * 100));

      return {
        ...r,
        aiScore,
        totalScore,
        explanation: ai.explanation,
        caveat: ai.caveat ?? undefined,
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  } catch (err) {
    console.error('AI matching failed, falling back to deterministic:', err);
    return deterministicResults;
  }
}

export async function aiMatchMentorToFounders(
  mentor: MentorProfile,
  allFounders: FounderDemoProfile[],
): Promise<FounderMatchResult[]> {
  const deterministicResults = matchMentorToFounders(mentor, allFounders);

  try {
    const candidates = deterministicResults.map((r) => ({
      id: r.founder.id,
      fullName: r.founder.fullName,
      startupName: r.founder.startupName,
      startupStage: r.founder.startupStage,
      industry: r.founder.industry,
      mainChallenge: r.founder.mainChallenge,
      supportNeeds: r.founder.supportNeeds,
      meetingFrequency: r.founder.meetingFrequency,
      threeMonthGoal: r.founder.threeMonthGoal,
      deterministicScore: r.deterministicScore,
    }));

    const { data, error } = await supabase.functions.invoke('match', {
      body: {
        mode: 'mentor',
        mentor: {
          fullName: mentor.fullName,
          expertise: mentor.expertise,
          industries: mentor.industries,
          experienceBackground: mentor.experienceBackground,
          preferredMenteeStages: mentor.preferredMenteeStages,
          meetingFrequency: mentor.meetingFrequency,
          threeMonthOutcome: mentor.threeMonthOutcome,
        },
        candidates,
      },
    });

    if (error) {
      console.error('AI matching error:', error);
      return deterministicResults;
    }

    const aiResults: AIScore[] = data?.results ?? [];

    return deterministicResults.map((r) => {
      const ai = aiResults.find((a) => a.id === r.founder.id);
      if (!ai) return r;

      const aiScore = ai.score_challenge_expertise + ai.score_open_text_alignment;
      const totalRaw = r.deterministicScore + aiScore;
      const totalScore = Math.min(100, Math.round((totalRaw / 105) * 100));

      return {
        ...r,
        aiScore,
        totalScore,
        explanation: ai.explanation,
        caveat: ai.caveat ?? undefined,
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  } catch (err) {
    console.error('AI matching failed, falling back to deterministic:', err);
    return deterministicResults;
  }
}

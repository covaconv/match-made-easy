import { FounderProfile, MentorProfile, MatchResult, FounderDemoProfile, FounderMatchResult } from '@/types';

const CADENCE_ORDER = ['Weekly', 'Biweekly', 'Monthly', 'As needed'];

function cadenceScore(a: string, b: string): number {
  const ia = CADENCE_ORDER.indexOf(a);
  const ib = CADENCE_ORDER.indexOf(b);
  if (ia === -1 || ib === -1) return 0;
  const diff = Math.abs(ia - ib);
  if (diff === 0) return 10;
  if (diff === 1) return 6;
  return 2;
}

function industryScore(founderIndustry: string, mentorIndustries: string[]): number {
  return mentorIndustries.includes(founderIndustry) ? 15 : 0;
}

function stageFilter(founderStage: string, mentorStages: string[]): boolean {
  return mentorStages.includes(founderStage);
}

function capacityFilter(mentor: MentorProfile): boolean {
  // In demo mode, all mentors are available
  return true;
}

function experienceBonus(mentor: MentorProfile): number {
  if (mentor.experienceBackground.includes('Founder')) return 5;
  if (mentor.experienceBackground.includes('Operator')) return 3;
  return 0;
}

function challengeExpertiseOverlap(challenge: string, supportNeeds: string[], expertise: string[]): number {
  let score = 0;
  // Map challenges to related expertise
  const challengeMap: Record<string, string[]> = {
    'Product': ['Product', 'Design'],
    'Validation': ['Product', 'Growth'],
    'Technical build': ['Engineering', 'Product'],
    'Go-to-market': ['Go-to-market', 'Growth', 'B2B Sales'],
    'Growth': ['Growth', 'Go-to-market'],
    'Fundraising': ['Fundraising'],
    'Operations': ['Operations', 'Hiring'],
    'Hiring': ['Hiring', 'Operations'],
  };

  const relevant = challengeMap[challenge] || [];
  const overlap = relevant.filter((r) => expertise.includes(r));
  score += overlap.length * 5;

  // Support needs map
  const needsMap: Record<string, string[]> = {
    'Product feedback': ['Product', 'Design'],
    'Technical guidance': ['Engineering'],
    'Go-to-market coaching': ['Go-to-market', 'B2B Sales'],
    'Growth strategy': ['Growth'],
    'Fundraising advice': ['Fundraising'],
    'Introductions': ['Fundraising', 'Growth'],
    'Accountability': [],
  };

  for (const need of supportNeeds) {
    const related = needsMap[need] || [];
    const needOverlap = related.filter((r) => expertise.includes(r));
    score += needOverlap.length * 3;
  }

  return Math.min(score, 20);
}

export function matchFounderToMentors(
  founder: FounderProfile,
  allMentors: MentorProfile[],
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const mentor of allMentors) {
    if (!stageFilter(founder.startupStage, mentor.preferredMenteeStages)) continue;
    if (!capacityFilter(mentor)) continue;

    const indScore = industryScore(founder.industry, mentor.industries);
    const cadScore = cadenceScore(founder.meetingFrequency, mentor.meetingFrequency);
    const expBonus = experienceBonus(mentor);
    const challengeScore = challengeExpertiseOverlap(
      founder.mainChallenge,
      founder.supportNeeds,
      mentor.expertise,
    );

    const deterministicScore = indScore + cadScore + expBonus + challengeScore;

    // Pick up to 4 relevant expertise tags
    const tags = mentor.expertise.slice(0, 4);

    results.push({
      mentor,
      deterministicScore,
      totalScore: deterministicScore,
      explanation: generateExplanation(founder, mentor, deterministicScore),
      expertiseTags: tags,
      caveat: generateCaveat(founder, mentor),
    });
  }

  return results
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3)
    .map((r) => ({
      ...r,
      // Keep raw deterministic score for AI merging; normalize to 0-100 as fallback display
      totalScore: Math.min(100, Math.round((r.totalScore / 50) * 100)),
    }));
}

export function matchMentorToFounders(
  mentor: MentorProfile,
  allFounders: FounderDemoProfile[],
): FounderMatchResult[] {
  const results: FounderMatchResult[] = [];

  for (const founder of allFounders) {
    if (!stageFilter(founder.startupStage, mentor.preferredMenteeStages)) continue;

    const indScore = industryScore(founder.industry, mentor.industries);
    const cadScore = cadenceScore(founder.meetingFrequency, mentor.meetingFrequency);
    const challengeScore = challengeExpertiseOverlap(
      founder.mainChallenge,
      founder.supportNeeds,
      mentor.expertise,
    );

    const deterministicScore = indScore + cadScore + challengeScore;

    results.push({
      founder,
      deterministicScore,
      totalScore: deterministicScore,
      explanation: generateFounderExplanation(mentor, founder, deterministicScore),
      relevantTags: [founder.industry, founder.startupStage, founder.mainChallenge],
      caveat: generateFounderCaveat(mentor, founder),
    });
  }

  return results
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3)
    .map((r) => ({
      ...r,
      totalScore: Math.min(100, Math.round((r.totalScore / 45) * 100)),
    }));
}

function generateExplanation(founder: FounderProfile, mentor: MentorProfile, score: number): string {
  const parts: string[] = [];

  if (mentor.industries.includes(founder.industry)) {
    parts.push(`${mentor.fullName} has deep experience in ${founder.industry}`);
  }

  const challengeMap: Record<string, string[]> = {
    'Product': ['Product', 'Design'],
    'Validation': ['Product', 'Growth'],
    'Technical build': ['Engineering', 'Product'],
    'Go-to-market': ['Go-to-market', 'Growth', 'B2B Sales'],
    'Growth': ['Growth', 'Go-to-market'],
    'Fundraising': ['Fundraising'],
    'Operations': ['Operations', 'Hiring'],
    'Hiring': ['Hiring', 'Operations'],
  };

  const relevant = challengeMap[founder.mainChallenge] || [];
  const matched = relevant.filter((r) => mentor.expertise.includes(r));
  if (matched.length > 0) {
    parts.push(`with strong expertise in ${matched.join(' and ')} — directly relevant to your ${founder.mainChallenge.toLowerCase()} challenge`);
  }

  if (mentor.experienceBackground.includes('Founder')) {
    parts.push('As a fellow founder, they understand the early-stage grind firsthand');
  }

  return parts.length > 0
    ? parts.join('. ') + '.'
    : `${mentor.fullName} brings relevant experience as ${mentor.currentRole} and can support your journey at the ${founder.startupStage} stage.`;
}

function generateCaveat(founder: FounderProfile, mentor: MentorProfile): string | undefined {
  if (founder.meetingFrequency === 'Weekly' && mentor.meetingFrequency === 'Monthly') {
    return 'Note: This mentor prefers monthly meetings while you requested weekly — discuss expectations early.';
  }
  if (mentor.monthlyTime === 'Up to 1 hour') {
    return 'This mentor has limited availability — make sure to come prepared to each session.';
  }
  return undefined;
}

function generateFounderExplanation(mentor: MentorProfile, founder: FounderDemoProfile, score: number): string {
  const parts: string[] = [];
  if (mentor.industries.includes(founder.industry)) {
    parts.push(`${founder.fullName} is building ${founder.startupName} in ${founder.industry}, an industry you know well`);
  }
  if (mentor.preferredMenteeStages.includes(founder.startupStage)) {
    parts.push(`They're at the ${founder.startupStage} stage, which aligns with your mentoring preferences`);
  }
  return parts.length > 0
    ? parts.join('. ') + '.'
    : `${founder.fullName} is building ${founder.startupName} and could benefit from your expertise.`;
}

function generateFounderCaveat(mentor: MentorProfile, founder: FounderDemoProfile): string | undefined {
  if (mentor.meetingFrequency !== founder.meetingFrequency) {
    return `Meeting frequency mismatch: you prefer ${mentor.meetingFrequency.toLowerCase()}, they prefer ${founder.meetingFrequency.toLowerCase()}.`;
  }
  return undefined;
}

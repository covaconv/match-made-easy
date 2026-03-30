import {
    FounderProfile,
    MentorProfile,
    MatchResult,
    FounderDemoProfile,
    FounderMatchResult,
} from '@/types';

const CADENCE_ORDER = ['Weekly', 'Biweekly', 'Monthly', 'As needed'];

const INDUSTRY_ADJACENCY: Record<string, string[]> = {
    Fintech: ['SaaS', 'Marketplace'],
    EdTech: ['SaaS', 'Social Impact'],
    SaaS: ['Fintech', 'EdTech', 'HealthTech', 'Marketplace'],
    HealthTech: ['SaaS', 'Social Impact'],
    Consumer: ['Marketplace', 'Social Impact'],
    Climate: ['Social Impact'],
    'Social Impact': ['EdTech', 'Climate', 'HealthTech', 'Consumer'],
    Marketplace: ['Consumer', 'SaaS', 'Fintech'],
    Other: [],
};

function getCapacityLimit(capacity: string): number {
    if (capacity === '1 founder') return 1;
    if (capacity === '2 founders') return 2;
    if (capacity === '3+ founders') return 3;
    return 0;
}

function getOpenSlots(mentor: MentorProfile): number {
    return Math.max(0, getCapacityLimit(mentor.mentoringCapacity) - mentor.currentMatches);
}

function stageFilter(founderStage: string, mentorStages: string[]): boolean {
    return mentorStages.includes(founderStage);
}

function capacityFilter(mentor: MentorProfile): boolean {
    return getOpenSlots(mentor) > 0;
}

function industryScore(founderIndustry: string, mentorIndustries: string[]): number {
    if (mentorIndustries.includes(founderIndustry)) return 20;

    const adjacent = INDUSTRY_ADJACENCY[founderIndustry] || [];
    if (mentorIndustries.some((industry) => adjacent.includes(industry))) return 12;

    if (founderIndustry === 'Other' || mentorIndustries.includes('Other')) return 5;

    return 0;
}

function cadenceDistance(a: string, b: string): number {
    const ia = CADENCE_ORDER.indexOf(a);
    const ib = CADENCE_ORDER.indexOf(b);
    if (ia === -1 || ib === -1) return 3;
    return Math.abs(ia - ib);
}

function baseCadenceScore(founderFrequency: string, mentorFrequency: string): number {
    const diff = cadenceDistance(founderFrequency, mentorFrequency);
    if (diff === 0) return 10;
    if (diff === 1) return 6;
    if (diff === 2) return 2;
    return 0;
}

function cadenceScore(
    founderFrequency: string,
    mentorFrequency: string,
    mentorMonthlyTime: string
): number {
    let score = baseCadenceScore(founderFrequency, mentorFrequency);

    if (mentorMonthlyTime === 'Up to 1 hour') {
        if (founderFrequency === 'Weekly') {
            score = Math.min(score, 2);
        } else if (founderFrequency === 'Biweekly') {
            score = Math.min(score, 6);
        }
    }

    return score;
}

function experienceBonus(founder: FounderProfile, mentor: MentorProfile): number {
    let score = 0;

    const hasFounder = mentor.experienceBackground.includes('Founder');
    const hasOperator = mentor.experienceBackground.includes('Operator');
    const hasInvestor = mentor.experienceBackground.includes('Investor');
    const hasCorporate = mentor.experienceBackground.includes('Corporate');
    const hasConsultant = mentor.experienceBackground.includes('Consultant');

    if (hasFounder) {
        if (['Idea', 'MVP', 'Early traction'].includes(founder.startupStage)) {
            score = Math.max(score, 8);
        } else if (founder.startupStage === 'Revenue') {
            score = Math.max(score, 4);
        }
    }

    if (
        hasInvestor &&
        (founder.mainChallenge === 'Fundraising' ||
            founder.supportNeeds.includes('Fundraising advice') ||
            founder.supportNeeds.includes('Introductions'))
    ) {
        score = Math.max(score, 9);
    }

    if (
        hasOperator &&
        ['Operations', 'Growth', 'Go-to-market', 'Hiring'].includes(founder.mainChallenge)
    ) {
        score = Math.max(score, 8);
    }

    if (
        hasCorporate &&
        ['Operations', 'Hiring', 'Go-to-market'].includes(founder.mainChallenge)
    ) {
        score = Math.max(score, 6);
    }

    if (
        hasConsultant &&
        ['Validation', 'Product', 'Go-to-market'].includes(founder.mainChallenge)
    ) {
        score = Math.max(score, 5);
    }

    return Math.min(score, 10);
}

function normalizeDeterministicScore(score: number): number {
    return Math.min(100, Math.round((score / 40) * 100));
}

function generateDeterministicExplanation(founder: FounderProfile, mentor: MentorProfile): string {
    const sentences: string[] = [];

    if (mentor.industries.includes(founder.industry)) {
        sentences.push(
            `${mentor.fullName} is a strong domain fit because they already work in ${founder.industry}.`
        );
    } else {
        const adjacent = INDUSTRY_ADJACENCY[founder.industry] || [];
        if (mentor.industries.some((industry) => adjacent.includes(industry))) {
            sentences.push(
                `${mentor.fullName} brings experience from industries adjacent to ${founder.industry}, which can still translate well to your company.`
            );
        }
    }

    if (mentor.preferredMenteeStages.includes(founder.startupStage)) {
        sentences.push(
            `They prefer working with founders at the ${founder.startupStage} stage, so the match is operationally aligned from the start.`
        );
    }

    if (
        mentor.experienceBackground.includes('Founder') &&
        ['Idea', 'MVP', 'Early traction'].includes(founder.startupStage)
    ) {
        sentences.push(
            `Their founder background is especially relevant for an early-stage startup like yours.`
        );
    } else if (
        mentor.experienceBackground.includes('Investor') &&
        (founder.mainChallenge === 'Fundraising' ||
            founder.supportNeeds.includes('Fundraising advice'))
    ) {
        sentences.push(
            `Their investor background could be particularly useful given your current fundraising-related needs.`
        );
    }

    return (
        sentences.slice(0, 2).join(' ') ||
        `${mentor.fullName} looks like a solid fit based on stage, availability, and background.`
    );
}

function generateDeterministicCaveat(founder: FounderProfile, mentor: MentorProfile): string | undefined {
    if (mentor.monthlyTime === 'Up to 1 hour') {
        return 'This mentor has limited monthly availability, so each session would need to be focused.';
    }

    const diff = cadenceDistance(founder.meetingFrequency, mentor.meetingFrequency);
    if (diff >= 2) {
        return `Your preferred meeting cadence and this mentor's availability style may need to be aligned early.`;
    }

    if (!mentor.industries.includes(founder.industry)) {
        const adjacent = INDUSTRY_ADJACENCY[founder.industry] || [];
        if (mentor.industries.some((industry) => adjacent.includes(industry))) {
            return 'Their industry background is adjacent rather than exact, so some context ramp-up may be needed.';
        }
    }

    return undefined;
}

function generateFounderSideExplanation(
    mentor: MentorProfile,
    founder: FounderDemoProfile
): string {
    const sentences: string[] = [];

    if (mentor.preferredMenteeStages.includes(founder.startupStage)) {
        sentences.push(
            `${founder.fullName} is at the ${founder.startupStage} stage, which fits the kinds of founders you prefer to mentor.`
        );
    }

    if (mentor.industries.includes(founder.industry)) {
        sentences.push(
            `Their company operates in ${founder.industry}, an industry you already know well.`
        );
    } else {
        const adjacent = INDUSTRY_ADJACENCY[founder.industry] || [];
        if (mentor.industries.some((industry) => adjacent.includes(industry))) {
            sentences.push(
                `Their industry is adjacent to sectors you already know, which could still make this a useful match.`
            );
        }
    }

    return (
        sentences.slice(0, 2).join(' ') ||
        `${founder.fullName} could be a reasonable match based on stage, industry, and availability fit.`
    );
}

function generateFounderSideCaveat(
    mentor: MentorProfile,
    founder: FounderDemoProfile
): string | undefined {
    if (mentor.monthlyTime === 'Up to 1 hour') {
        return 'Your monthly availability is limited, so expectations may need to be set clearly from the beginning.';
    }

    const diff = cadenceDistance(founder.meetingFrequency, mentor.meetingFrequency);
    if (diff >= 2) {
        return `Your preferred cadence and this founder's preferred cadence may not align perfectly.`;
    }

    return undefined;
}

export function matchFounderToMentors(
    founder: FounderProfile,
    allMentors: MentorProfile[]
): MatchResult[] {
    const results: MatchResult[] = [];

    for (const mentor of allMentors) {
        if (!stageFilter(founder.startupStage, mentor.preferredMenteeStages)) continue;
        if (!capacityFilter(mentor)) continue;

        const indScore = industryScore(founder.industry, mentor.industries);
        const cadScore = cadenceScore(
            founder.meetingFrequency,
            mentor.meetingFrequency,
            mentor.monthlyTime
        );
        const expBonus = experienceBonus(founder, mentor);

        const deterministicScore = indScore + cadScore + expBonus;

        results.push({
  mentor,
  deterministicScore,
  industryScore: indScore,
  cadenceScore: cadScore,
  expBonusScore: expBonus,
  totalScore: normalizeDeterministicScore(deterministicScore),
  explanation: generateDeterministicExplanation(founder, mentor),
  expertiseTags: mentor.expertise.slice(0, 4),
  caveat: generateDeterministicCaveat(founder, mentor),
});
    }

    return results.sort((a, b) => b.deterministicScore - a.deterministicScore).slice(0, 3);
}

export function matchMentorToFounders(
    mentor: MentorProfile,
    allFounders: FounderDemoProfile[]
): FounderMatchResult[] {
    const results: FounderMatchResult[] = [];

    for (const founder of allFounders) {
        if (!stageFilter(founder.startupStage, mentor.preferredMenteeStages)) continue;
        if (!capacityFilter(mentor)) continue;

        const indScore = industryScore(founder.industry, mentor.industries);
        const cadScore = cadenceScore(
            founder.meetingFrequency,
            mentor.meetingFrequency,
            mentor.monthlyTime
        );
        const expBonus = experienceBonus(founder, mentor);

        const deterministicScore = indScore + cadScore + expBonus;

        results.push({
  founder,
  deterministicScore,
  industryScore: indScore,
  cadenceScore: cadScore,
  expBonusScore: expBonus,
  totalScore: normalizeDeterministicScore(deterministicScore),
  explanation: generateFounderSideExplanation(mentor, founder),
  relevantTags: [founder.industry, founder.startupStage, founder.mainChallenge],
  caveat: generateFounderSideCaveat(mentor, founder),
});
    }

    return results.sort((a, b) => b.deterministicScore - a.deterministicScore).slice(0, 3);
}
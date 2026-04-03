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

// --- ARRAY-SAFE PROPERTY GUARDS ---
const toArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val as string[];
    if (typeof val === 'string') return val.split(',').map(s => s.trim());
    return [];
};

// Helper to safely read properties from objects without triggering index signature errors
const readProp = (obj: unknown, key: string): unknown => {
    if (obj && typeof obj === 'object' && key in obj) {
        return (obj as Record<string, unknown>)[key];
    }
    return undefined;
};

const getStages = (m: unknown): string[] => toArray(readProp(m, 'preferredMenteeStages') ?? readProp(m, 'preferred_mentee_stages'));
const getIndustries = (m: unknown): string[] => toArray(readProp(m, 'industries'));
const getExpertise = (m: unknown): string[] => toArray(readProp(m, 'expertise'));
const getBackground = (m: unknown): string[] => toArray(readProp(m, 'experienceBackground') ?? readProp(m, 'experience_background'));
const getCapacityString = (m: unknown): string => String(readProp(m, 'mentoringCapacity') ?? readProp(m, 'mentoring_capacity') ?? '');
const getFreq = (obj: unknown): string => String(readProp(obj, 'meetingFrequency') ?? readProp(obj, 'meeting_frequency') ?? '');
const getTime = (m: unknown): string => String(readProp(m, 'monthlyTime') ?? readProp(m, 'monthly_time') ?? '');

const getFounderStage = (f: unknown): string => String(readProp(f, 'startupStage') ?? readProp(f, 'startup_stage') ?? '');
const getFounderChallenge = (f: unknown): string => String(readProp(f, 'mainChallenge') ?? readProp(f, 'main_challenge') ?? '');
const getFounderNeeds = (f: unknown): string[] => toArray(readProp(f, 'supportNeeds') ?? readProp(f, 'support_needs'));

function getCapacityLimit(capacity: string): number {
    if (!capacity) return 0;
    // Safely extracts the first number it finds (handles "1 founder", "2 Founders", "3+", etc.)
    const match = String(capacity).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}

function getOpenSlots(mentor: MentorProfile): number {
    const matches = Number(mentor.currentMatches ?? (mentor as unknown as Record<string, unknown>).current_matches ?? 0);
    const limit = getCapacityLimit(getCapacityString(mentor));
    return Math.max(0, limit - matches);
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
        if (founderFrequency === 'Weekly') score = Math.min(score, 2);
        else if (founderFrequency === 'Biweekly') score = Math.min(score, 6);
    }
    return score;
}

function experienceBonus(founder: FounderProfile, mentor: MentorProfile): number {
    let score = 0;
    const background = getBackground(mentor);
    const fStage = getFounderStage(founder);
    const fChallenge = getFounderChallenge(founder);
    const fNeeds = getFounderNeeds(founder);

    const hasFounder = background.includes('Founder');
    const hasOperator = background.includes('Operator');
    const hasInvestor = background.includes('Investor');
    const hasCorporate = background.includes('Corporate');
    const hasConsultant = background.includes('Consultant');

    if (hasFounder) {
        if (['Idea', 'MVP', 'Early traction'].includes(fStage)) score = Math.max(score, 8);
        else if (fStage === 'Revenue') score = Math.max(score, 4);
    }
    if (hasInvestor && (fChallenge === 'Fundraising' || fNeeds.includes('Fundraising advice'))) {
        score = Math.max(score, 9);
    }
    if (hasOperator && ['Operations', 'Growth', 'Go-to-market', 'Hiring'].includes(fChallenge)) {
        score = Math.max(score, 8);
    }
    if (hasCorporate && ['Operations', 'Hiring', 'Go-to-market'].includes(fChallenge)) {
        score = Math.max(score, 6);
    }
    if (hasConsultant && ['Validation', 'Product', 'Go-to-market'].includes(fChallenge)) {
        score = Math.max(score, 5);
    }
    return Math.min(score, 10);
}

function normalizeDeterministicScore(score: number, maxScore: number): number {
    // Math.max(0) ensures a penalty doesn't push the score below 0%
    return Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
}

export function matchFounderToMentors(
    founder: FounderProfile,
    allMentors: MentorProfile[],
    feedbackBonusByMentorId: Record<string, number> = {}
): MatchResult[] {
    const results: MatchResult[] = [];
    const fStage = getFounderStage(founder);
    const fIndustry = founder.industry;
    const fFreq = getFreq(founder);

    for (const mentor of allMentors) {
        const mentorStages = getStages(mentor);
        const mentorIndustries = getIndustries(mentor);

        if (!stageFilter(fStage, mentorStages)) continue;
        if (!capacityFilter(mentor)) continue;

        const indScore = industryScore(fIndustry, mentorIndustries);
        const cadScore = cadenceScore(fFreq, getFreq(mentor), getTime(mentor));
        const expBonus = experienceBonus(founder, mentor);
        const feedbackBonus = feedbackBonusByMentorId[mentor.id] ?? 0;
        const deterministicScore = indScore + cadScore + expBonus + feedbackBonus;

        results.push({
            mentor: {
                ...mentor,
                fullName: String(mentor.fullName ?? (mentor as unknown as Record<string, unknown>).full_name),
                currentRole: String(mentor.currentRole ?? (mentor as unknown as Record<string, unknown>).current_role)
            },
            deterministicScore,
            industryScore: indScore,
            cadenceScore: cadScore,
            expBonusScore: expBonus,
            feedbackBonusScore: feedbackBonus,
            totalScore: normalizeDeterministicScore(deterministicScore, 45),
            explanation: "Deterministic match based on profile overlap. (AI enrichment temporarily unavailable)",
            expertiseTags: getExpertise(mentor).slice(0, 4),
            caveat: undefined,
        });
    }
    
    return results.sort((a, b) => b.deterministicScore - a.deterministicScore).slice(0, 3);
}

export function matchMentorToFounders(
    mentor: MentorProfile,
    allFounders: FounderDemoProfile[]
): FounderMatchResult[] {
    const results: FounderMatchResult[] = [];
    const mentorStages = getStages(mentor);
    const mentorIndustries = getIndustries(mentor);

    for (const founder of allFounders) {
        const fStage = getFounderStage(founder);
        const fFreq = getFreq(founder);

        if (!stageFilter(fStage, mentorStages)) continue;
        if (!capacityFilter(mentor)) continue;

        const indScore = industryScore(founder.industry, mentorIndustries);
        const cadScore = cadenceScore(fFreq, getFreq(mentor), getTime(mentor));
        const expBonus = experienceBonus(founder as unknown as FounderProfile, mentor);
        const deterministicScore = indScore + cadScore + expBonus;

        results.push({
            founder,
            deterministicScore,
            industryScore: indScore,
            cadenceScore: cadScore,
            expBonusScore: expBonus,
            feedbackBonusScore: 0,
            totalScore: normalizeDeterministicScore(deterministicScore, 40),
            explanation: "Strong alignment detected.",
            relevantTags: [founder.industry, fStage, getFounderChallenge(founder)],
            caveat: undefined,
        });
    }
    return results.sort((a, b) => b.deterministicScore - a.deterministicScore).slice(0, 3);
}
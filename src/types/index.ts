export interface FounderProfile {
  fullName: string;
  majors: string[];
  startupName: string;
  startupStage: string;
  industry: string;
  mainChallenge: string;
  supportNeeds: string[];
  meetingFrequency: string;
  threeMonthGoal: string;
}

export interface MentorProfile {
  id: string;
  fullName: string;
  majors: string[];
  currentRole: string;
  experienceBackground: string[];
  expertise: string[];
  industries: string[];
  preferredMenteeStages: string[];
  meetingFrequency: string;
  monthlyTime: string;
  mentoringCapacity: string;
  threeMonthOutcome: string;
}

export interface FounderDemoProfile extends FounderProfile {
  id: string;
}

export interface MatchResult {
  mentor: MentorProfile;
  deterministicScore: number;
  aiScore?: number;
  totalScore: number;
  explanation: string;
  caveat?: string;
  expertiseTags: string[];
}

export interface FounderMatchResult {
  founder: FounderDemoProfile;
  deterministicScore: number;
  aiScore?: number;
  totalScore: number;
  explanation: string;
  caveat?: string;
  relevantTags: string[];
}

export type Role = 'founder' | 'mentor';

export type Screen =
  | 'landing'
  | 'role'
  | 'founder-step-1'
  | 'founder-step-2'
  | 'founder-step-3'
  | 'founder-loading'
  | 'founder-results'
  | 'mentor-step-1'
  | 'mentor-step-2'
  | 'mentor-step-3'
  | 'mentor-confirmation'
  | 'mentor-loading'
  | 'mentor-results';

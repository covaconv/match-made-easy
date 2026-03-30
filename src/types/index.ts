// === App-land types (camelCase, used by matching/UI) ===

export interface FounderProfile {
  id?: string;
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
  currentMatches: number;
  threeMonthOutcome: string;
}

export interface FounderDemoProfile extends FounderProfile {
  id: string;
}

export interface MatchResult {
  mentor: MentorProfile;
  deterministicScore: number;
  industryScore: number;
  cadenceScore: number;
  expBonusScore: number;
  aiScore?: number;
  totalScore: number;
  explanation: string;
  caveat?: string;
  expertiseTags: string[];
}

export interface FounderMatchResult {
  founder: FounderDemoProfile;
  deterministicScore: number;
  industryScore: number;
  cadenceScore: number;
  expBonusScore: number;
  aiScore?: number;
  totalScore: number;
  explanation: string;
  caveat?: string;
  relevantTags: string[];
}

export type Role = 'founder' | 'mentor';

export type UserRole = 'founder' | 'mentor';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface Meetup {
  id: string;
  founder_id: string;
  mentor_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  created_at: string;
}

export interface Feedback {
  id: string;
  meetup_id: string;
  given_by: string;
  rating: number;
  qualitative_notes: string | null;
}

// Database row shapes (snake_case, for DB <-> app mapping)

export interface FounderProfileRow {
  id: string;
  full_name: string;
  majors: string[];
  startup_name: string;
  startup_stage: string;
  industry: string;
  main_challenge: string;
  support_needs: string[];
  meeting_frequency: string;
  three_month_goal: string;
  created_at: string;
  updated_at: string;
}

export interface MentorProfileRow {
  id: string;
  full_name: string;
  majors: string[];
  current_role: string;
  experience_background: string[];
  expertise: string[];
  industries: string[];
  preferred_mentee_stages: string[];
  meeting_frequency: string;
  monthly_time: string;
  mentoring_capacity: string;
  current_matches: number;
  three_month_outcome: string;
  created_at: string;
  updated_at: string;
}

export type Screen =
  | 'landing'
  | 'auth'
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

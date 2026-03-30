import { supabase } from '@/integrations/supabase/client';
import type {
  UserRole,
  AppUser,
  FounderProfile,
  MentorProfile,
  FounderProfileRow,
  MentorProfileRow,
  Meetup,
  Feedback,
} from '@/types';

// ─── Row <-> App mappers ───────────────────────────────────

export function founderRowToApp(row: FounderProfileRow): FounderProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    majors: row.majors,
    startupName: row.startup_name,
    startupStage: row.startup_stage,
    industry: row.industry,
    mainChallenge: row.main_challenge,
    supportNeeds: row.support_needs,
    meetingFrequency: row.meeting_frequency,
    threeMonthGoal: row.three_month_goal,
  };
}

export function founderAppToRow(
  userId: string,
  profile: FounderProfile,
): Omit<FounderProfileRow, 'created_at' | 'updated_at'> {
  return {
    id: userId,
    full_name: profile.fullName,
    majors: profile.majors,
    startup_name: profile.startupName,
    startup_stage: profile.startupStage,
    industry: profile.industry,
    main_challenge: profile.mainChallenge,
    support_needs: profile.supportNeeds,
    meeting_frequency: profile.meetingFrequency,
    three_month_goal: profile.threeMonthGoal,
  };
}

export function mentorRowToApp(row: MentorProfileRow): MentorProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    majors: row.majors,
    currentRole: row.current_role,
    experienceBackground: row.experience_background,
    expertise: row.expertise,
    industries: row.industries,
    preferredMenteeStages: row.preferred_mentee_stages,
    meetingFrequency: row.meeting_frequency,
    monthlyTime: row.monthly_time,
    mentoringCapacity: row.mentoring_capacity,
    currentMatches: row.current_matches,
    threeMonthOutcome: row.three_month_outcome,
  };
}

export function mentorAppToRow(
  userId: string,
  profile: MentorProfile,
): Omit<MentorProfileRow, 'created_at' | 'updated_at'> {
  return {
    id: userId,
    full_name: profile.fullName,
    majors: profile.majors,
    current_role: profile.currentRole,
    experience_background: profile.experienceBackground,
    expertise: profile.expertise,
    industries: profile.industries,
    preferred_mentee_stages: profile.preferredMenteeStages,
    meeting_frequency: profile.meetingFrequency,
    monthly_time: profile.monthlyTime,
    mentoring_capacity: profile.mentoringCapacity,
    current_matches: profile.currentMatches,
    three_month_outcome: profile.threeMonthOutcome,
  };
}

// ─── Auth helpers ──────────────────────────────────────────

export async function signUpWithEmail(email: string, password: string, role: UserRole) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentSession() {
  return supabase.auth.getSession();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// ─── Profile helpers ───────────────────────────────────────

export async function getProfileByUserId(userId: string) {
  return supabase.from('profiles').select('*').eq('id', userId).single();
}

export async function createFounderProfile(userId: string, profile: FounderProfile) {
  const row = founderAppToRow(userId, profile);
  return supabase.from('founder_profiles').insert(row);
}

export async function getFounderProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from('founder_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return { data: null, error };
  return { data: founderRowToApp(data as unknown as FounderProfileRow), error: null };
}

export async function upsertFounderProfile(userId: string, profile: FounderProfile) {
  const row = founderAppToRow(userId, profile);
  return supabase.from('founder_profiles').upsert(row);
}

export async function createMentorProfile(userId: string, profile: MentorProfile) {
  const row = mentorAppToRow(userId, profile);
  return supabase.from('mentor_profiles').insert(row);
}

export async function getMentorProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from('mentor_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return { data: null, error };
  return { data: mentorRowToApp(data as unknown as MentorProfileRow), error: null };
}

export async function upsertMentorProfile(userId: string, profile: MentorProfile) {
  const row = mentorAppToRow(userId, profile);
  return supabase.from('mentor_profiles').upsert(row);
}

// ─── Meetup helpers ────────────────────────────────────────

export async function createMeetup(founderId: string, mentorId: string) {
  return supabase.from('meetups').insert({
    founder_id: founderId,
    mentor_id: mentorId,
    status: 'pending',
  });
}

export async function getMeetupsForFounder(userId: string) {
  return supabase.from('meetups').select('*').eq('founder_id', userId).order('created_at', { ascending: false });
}

export async function getMeetupsForMentor(userId: string) {
  return supabase.from('meetups').select('*').eq('mentor_id', userId).order('created_at', { ascending: false });
}

export async function updateMeetupStatus(meetupId: string, status: Meetup['status']) {
  return supabase.from('meetups').update({ status }).eq('id', meetupId);
}

// ─── Feedback helpers ──────────────────────────────────────

export async function createFeedback(
  meetupId: string,
  givenBy: string,
  rating: number,
  qualitativeNotes?: string,
) {
  return supabase.from('feedback').insert({
    meetup_id: meetupId,
    given_by: givenBy,
    rating,
    qualitative_notes: qualitativeNotes ?? null,
  });
}

export async function getFeedbackForMeetup(meetupId: string) {
  return supabase.from('feedback').select('*').eq('meetup_id', meetupId);
}

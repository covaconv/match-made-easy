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
  FounderDemoProfile,
  MeetupWithCounterparty,
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

// ─── Bulk profile fetch helpers ──────────────────────────────

function isValidMentorRow(row: MentorProfileRow): boolean {
  return (
    typeof row.id === 'string' &&
    typeof row.full_name === 'string' &&
    typeof row.current_role === 'string' &&
    Array.isArray(row.experience_background) &&
    Array.isArray(row.expertise) &&
    Array.isArray(row.industries) &&
    Array.isArray(row.preferred_mentee_stages) &&
    typeof row.meeting_frequency === 'string' &&
    typeof row.monthly_time === 'string' &&
    typeof row.mentoring_capacity === 'string' &&
    typeof row.current_matches === 'number' &&
    typeof row.three_month_outcome === 'string'
  );
}

function isValidFounderRow(row: FounderProfileRow): boolean {
  return (
    typeof row.id === 'string' &&
    typeof row.full_name === 'string' &&
    Array.isArray(row.majors) &&
    typeof row.startup_name === 'string' &&
    typeof row.startup_stage === 'string' &&
    typeof row.industry === 'string' &&
    typeof row.main_challenge === 'string' &&
    Array.isArray(row.support_needs) &&
    typeof row.meeting_frequency === 'string' &&
    typeof row.three_month_goal === 'string'
  );
}

export async function getAllMentorProfiles(): Promise<MentorProfile[]> {
  try {
    const { data, error } = await supabase.from('mentor_profiles').select('*');
    if (error || !data) return [];

    const validRows = (data as MentorProfileRow[]).filter(isValidMentorRow);
    return validRows.map((row) => mentorRowToApp(row));
  } catch {
    return [];
  }
}

export async function getAllFounderProfiles(): Promise<FounderDemoProfile[]> {
  try {
    const { data, error } = await supabase.from('founder_profiles').select('*');

    if (error) {
      console.error('[founder_profiles] select failed:', error);
      return [];
    }

    if (!data) {
      console.warn('[founder_profiles] no data returned');
      return [];
    }

    const rows = data as FounderProfileRow[];
    const validRows = rows.filter(isValidFounderRow);
    const invalidRows = rows.filter((row) => !isValidFounderRow(row));

    return validRows.map((row): FounderDemoProfile => ({
      ...founderRowToApp(row),
      id: row.id,
    }));
  } catch (err) {
    console.error('[founder_profiles] unexpected failure:', err);
    return [];
  }
}

export async function getMentorsWithFallback(): Promise<MentorProfile[]> {
  return await getAllMentorProfiles();
}

export async function getFoundersWithFallback(): Promise<FounderDemoProfile[]> {
  return await getAllFounderProfiles();
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

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
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
  }).select().single(); // This ensures we get the new row data back
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

export async function findMeetupByPair(founderId: string, mentorId: string) {
  return supabase
    .from('meetups')
    .select('*')
    .eq('founder_id', founderId)
    .eq('mentor_id', mentorId)
    .limit(1)
    .maybeSingle();
}

export async function requestMeetupIfNotExists(founderId: string, mentorId: string) {
  // UX-level duplicate prevention; this is not race-safe by itself.
  // A DB unique constraint on (founder_id, mentor_id) should back this in production.
  const existing = await findMeetupByPair(founderId, mentorId);
  if (existing.error) {
    return { data: null, error: existing.error, alreadyExists: false };
  }
  if (existing.data) {
    return { data: existing.data, error: null, alreadyExists: true };
  }
  const created = await createMeetup(founderId, mentorId);
  return { data: created.data ?? null, error: created.error ?? null, alreadyExists: false };
}

export async function getFounderMeetupsWithMentorDetails(founderId: string): Promise<MeetupWithCounterparty[]> {
  try {
    const { data: meetups, error } = await getMeetupsForFounder(founderId);
    if (error || !meetups) return [];

    const mentorIds = Array.from(new Set(meetups.map((m: Record<string, unknown>) => String(m.mentor_id)).filter(Boolean)));
    if (mentorIds.length === 0) return meetups as MeetupWithCounterparty[];

    // 1. Fetch mentor profile details
    const { data: mentorsData } = await supabase
      .from('mentor_profiles')
      .select('id, full_name, current_role')
      .in('id', mentorIds);

    // 2. Fetch mentor emails from the public profiles table
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', mentorIds);

    const mentorById = new Map<string, { full_name: string; current_role: string }>(
      (mentorsData ?? []).map((row: Record<string, unknown>) => [String(row.id), row as unknown as { full_name: string; current_role: string }]),
    );
    
    const emailById = new Map<string, string>(
      (profilesData ?? []).map((row: Record<string, unknown>) => [String(row.id), String(row.email)]),
    );

    return (meetups as Record<string, unknown>[]).map((meetup) => {
      const mentor = mentorById.get(String(meetup.mentor_id));
      const email = emailById.get(String(meetup.mentor_id));
      
      return {
        ...meetup,
        counterparty_name: mentor?.full_name,
        counterparty_subtitle: mentor?.current_role,
        counterparty_email: email, // <-- Attach the email here
      } as MeetupWithCounterparty;
    });
  } catch {
    return [];
  }
}

export async function getMentorMeetupsWithFounderDetails(mentorId: string): Promise<MeetupWithCounterparty[]> {
  try {
    const { data: meetups, error } = await getMeetupsForMentor(mentorId);
    if (error || !meetups) return [];

    const founderIds = Array.from(new Set(meetups.map((m: Record<string, unknown>) => String(m.founder_id)).filter(Boolean)));
    if (founderIds.length === 0) return meetups as MeetupWithCounterparty[];

    // 1. Fetch founder profile details
    const { data: foundersData } = await supabase
      .from('founder_profiles')
      .select('id, full_name, startup_name')
      .in('id', founderIds);

    // 2. Fetch founder emails from the public profiles table
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', founderIds);

    const founderById = new Map<string, { full_name: string; startup_name: string }>(
      (foundersData ?? []).map((row: Record<string, unknown>) => [String(row.id), row as unknown as { full_name: string; startup_name: string }]),
    );

    const emailById = new Map<string, string>(
      (profilesData ?? []).map((row: Record<string, unknown>) => [String(row.id), String(row.email)]),
    );

    return (meetups as Record<string, unknown>[]).map((meetup) => {
      const founder = founderById.get(String(meetup.founder_id));
      const email = emailById.get(String(meetup.founder_id));
      return {
        ...meetup,
        counterparty_name: founder?.full_name,
        counterparty_subtitle: founder?.startup_name,
        counterparty_email: email, // <-- Attach the email here
      } as MeetupWithCounterparty;
    });
  } catch {
    return [];
  }
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

export async function getFeedbackSubmissionMapForUser(meetupIds: string[], userId: string) {
  if (meetupIds.length === 0 || !userId) return {};
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('meetup_id')
      .in('meetup_id', meetupIds)
      .eq('given_by', userId);
    if (error || !data) return {};

    const map: Record<string, boolean> = {};
    for (const row of data as Array<{ meetup_id: string }>) {
      map[row.meetup_id] = true;
    }
    return map;
  } catch {
    return {};
  }
}
function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export async function getMentorFounderFeedbackBonusMap(mentorIds: string[]) {
  if (mentorIds.length === 0) return {};

  const bonusMap: Record<string, number> = {};
  for (const mentorId of mentorIds) {
    bonusMap[mentorId] = 0;
  }

  const persistedMentorIds = mentorIds.filter(isUuid);

  if (persistedMentorIds.length === 0) {
    return bonusMap;
  }

  try {
    const { data: meetupsData, error: meetupsError } = await supabase
      .from('meetups')
      .select('id, mentor_id, founder_id, status')
      .in('mentor_id', persistedMentorIds)
      .eq('status', 'completed');

    if (meetupsError || !meetupsData || meetupsData.length === 0) return bonusMap;

    const meetupIds = meetupsData.map((m: Record<string, unknown>) => String(m.id));
    const meetupById = new Map<string, { mentor_id: string; founder_id: string }>(
      meetupsData.map((m: Record<string, unknown>) => [String(m.id), { mentor_id: String(m.mentor_id), founder_id: String(m.founder_id) }]),
    );

    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('meetup_id, given_by, rating')
      .in('meetup_id', meetupIds);

    if (feedbackError || !feedbackData) return bonusMap;

    const aggregate = new Map<string, { total: number; count: number }>();

    for (const row of feedbackData as Array<{ meetup_id: string; given_by: string; rating: number }>) {
      const meetup = meetupById.get(row.meetup_id);
      if (!meetup) continue;
      if (row.given_by !== meetup.founder_id) continue;

      const entry = aggregate.get(meetup.mentor_id) ?? { total: 0, count: 0 };
      entry.total += row.rating;
      entry.count += 1;
      aggregate.set(meetup.mentor_id, entry);
    }

    for (const mentorId of persistedMentorIds) {
      const entry = aggregate.get(mentorId);
      if (!entry || entry.count === 0) {
        bonusMap[mentorId] = 0;
        continue;
      }

      const avg = entry.total / entry.count;
      // The Sliding Scale Implementation
      if (avg >= 4.5) bonusMap[mentorId] = 5;
      else if (avg >= 3.5) bonusMap[mentorId] = 2;
      else if (avg >= 2.5) bonusMap[mentorId] = 0;
      else if (avg >= 1.5) bonusMap[mentorId] = -2;
      else bonusMap[mentorId] = -5;
    }

    return bonusMap;
  } catch {
    return bonusMap;
  }
}
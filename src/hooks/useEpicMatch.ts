import { useState, useCallback, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import {
  Screen, Role, FounderProfile, MentorProfile, MatchResult,
  FounderMatchResult, FounderDemoProfile, MeetupWithCounterparty,
} from '@/types';
import { matchFounderToMentors, matchMentorToFounders } from '@/lib/matching';
import { enrichMatchesWithClaude, enrichMentorMatchesWithClaude } from '@/lib/claude';
import {
  getMentorsWithFallback, getAllFounderProfiles,
  getCurrentUser, onAuthStateChange,
  upsertFounderProfile, upsertMentorProfile, getFounderProfileByUserId,
  getMentorProfileByUserId, getFounderMeetupsWithMentorDetails,
  getMentorMeetupsWithFounderDetails, signOut,
  getMentorFounderFeedbackBonusMap, requestMeetupIfNotExists,
  updateMeetupStatus, createFeedback, getFeedbackSubmissionMapForUser
} from '@/lib/supabase';

export function useEpicMatch() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [founderResults, setFounderResults] = useState<MatchResult[]>([]);
  const [mentorResults, setMentorResults] = useState<FounderMatchResult[]>([]);
  const [mentorData, setMentorData] = useState<MentorProfile | null>(null);
  const [founderData, setFounderData] = useState<FounderProfile | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [hasAttemptedMatching, setHasAttemptedMatching] = useState(false);
  const [mentorPool, setMentorPool] = useState<MentorProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [meetups, setMeetups] = useState<MeetupWithCounterparty[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [requestStates, setRequestStates] = useState<Record<string, 'idle' | 'loading' | 'requested' | 'exists' | 'error'>>({});
  const [feedbackSubmittedByMeetupId, setFeedbackSubmittedByMeetupId] = useState<Record<string, boolean>>({});
  const isAuthenticated = Boolean(currentUser);

  const startOver = useCallback(() => {
  setFounderResults([]);
  setMentorResults([]);
  setFounderData(null);
  setMentorData(null);
  setHasAttemptedMatching(false);
  setIsMatching(false);
  if (currentUser && currentRole === 'mentor') {
    setScreen('mentor-step-1');
  } else if (currentUser && currentRole === 'founder') {
    setScreen('founder-step-1');
  } else {
    setScreen('landing');
  }
}, [currentUser, currentRole]);

  const handleSignOut = useCallback(async () => {
  // 1. Instantly clear all local state
  setFounderResults([]);
  setMentorResults([]);
  setFounderData(null);
  setMentorData(null);
  setHasAttemptedMatching(false);
  setIsMatching(false);
  setMeetups([]);
  setRequestStates({});

  // 2. Proactively kill the identity and force the route (Do not wait for the listener!)
  setCurrentUser(null);
  setCurrentRole(null);
  setScreen('landing');

  // 3. Tell Supabase to kill the backend session
  try {
    await signOut();
  } catch (error) {
    console.error("Supabase sign out error:", error);
  }
}, []);

  const loadDashboard = useCallback(async () => {
    if (!currentUser || !currentRole) return;
    setIsDashboardLoading(true);
    
    const data = currentRole === 'founder'
      ? await getFounderMeetupsWithMentorDetails(currentUser.id)
      : await getMentorMeetupsWithFounderDetails(currentUser.id);
      
    setMeetups(data);
    
    // Fetch which meetups the current user has already reviewed
    if (data.length > 0) {
      const feedbackMap = await getFeedbackSubmissionMapForUser(data.map(m => m.id), currentUser.id);
      setFeedbackSubmittedByMeetupId(feedbackMap);
    }
    
    setIsDashboardLoading(false);
  }, [currentRole, currentUser]);

  const handleRequestMeetup = useCallback(async (founderId: string, mentorId: string) => {
    setRequestStates(prev => ({ ...prev, [mentorId]: 'loading' }));
    try {
      const { error, alreadyExists } = await requestMeetupIfNotExists(founderId, mentorId);
      if (error) throw error;
      setRequestStates(prev => ({ ...prev, [mentorId]: alreadyExists ? 'exists' : 'requested' }));
      await loadDashboard();
    } catch (err) {
      console.error("Meetup request failed:", err);
      setRequestStates(prev => ({ ...prev, [mentorId]: 'idle' }));
    }
  }, [loadDashboard]);

  const handleUpdateMeetupStatus = useCallback(async (meetupId: string, status: 'accepted' | 'declined' | 'completed') => {
    try {
      // 1. Optimistically update the UI so it feels instant
      setMeetups(prev => prev.map(m => m.id === meetupId ? { ...m, status } : m));
      
      // 2. Tell the database to update the status
      const { error } = await updateMeetupStatus(meetupId, status);
      if (error) throw error;
      
      // 3. Fetch fresh data (which will now pull the email if accepted)
      await loadDashboard();
    } catch (err) {
      console.error(`Failed to update meetup to ${status}:`, err);
      // If it fails, revert by reloading the true dashboard state
      await loadDashboard();
    }
  }, [loadDashboard]);

  const handleLeaveFeedback = useCallback(async (meetupId: string) => {
    if (!currentUser) return;
    
    const ratingStr = window.prompt("Rate this meetup from 1 to 5 stars:");
    if (ratingStr === null) return; // User clicked cancel
    
    const rating = parseInt(ratingStr, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      alert("Please enter a valid number between 1 and 5.");
      return;
    }

    try {
      const { error } = await createFeedback(meetupId, currentUser.id, rating);
      if (error) throw error;
      
      alert("Thank you! Your feedback will help improve future matches.");
      await loadDashboard(); // This refreshes the feedback map so the button disappears
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert("Could not save feedback. You may have already submitted it.");
    }
  }, [currentUser, loadDashboard]);

  const canRequestMeetup = useCallback((mentorId: string) => {
    const mentor = mentorPool.find(m => m.id === mentorId);
    if (!mentor) return { allowed: true }; // Fallback
    
    const capacityStr = String(mentor.mentoringCapacity || (mentor as unknown as Record<string, unknown>).mentoring_capacity || '0');
    const match = capacityStr.match(/\d+/);
    const capacityLimit = match ? parseInt(match[0], 10) : 0;
    const currentMatches = Number(mentor.currentMatches || (mentor as unknown as Record<string, unknown>).current_matches || 0);

    if (currentMatches >= capacityLimit) {
      return { allowed: false, reason: "This mentor has reached their current capacity." };
    }
    return { allowed: true };
  }, [mentorPool]);

  const resolvePostAuthDestination = useCallback(async (user: User, preferredRole?: Role | null) => {
    const role = preferredRole ?? (user.user_metadata?.role as Role);
    if (role === 'founder') {
      setCurrentRole('founder');
      const { data } = await getFounderProfileByUserId(user.id);
      if (data) { setFounderData(data); setScreen('dashboard'); }
      else setScreen('founder-step-1');
    } else if (role === 'mentor') {
      setCurrentRole('mentor');
      const { data } = await getMentorProfileByUserId(user.id);
      if (data) { setMentorData(data); setScreen('dashboard'); }
      else setScreen('mentor-step-1');
    } else {
      setScreen('role');
    }
  }, []);

  // --- MATCHING EFFECT ---
useEffect(() => {
  // Removed !isMatching from the dependencies here because we now set it to true instantly on submit
  const shouldMatch = currentRole === 'founder' && founderData && mentorPool.length > 0 && !hasAttemptedMatching;
  
  if (shouldMatch) {
    const runMatching = async () => {
      setHasAttemptedMatching(true);
      setIsMatching(true);
      try {
        const bonusMap = await getMentorFounderFeedbackBonusMap(mentorPool.map(m => m.id));
        const deterministic = matchFounderToMentors(founderData, mentorPool, bonusMap);
        
        const enriched = await enrichMatchesWithClaude(founderData, deterministic);
        
        setFounderResults(enriched.length > 0 ? enriched : deterministic);
      } finally {
        setIsMatching(false); // This tells the LoadingScreen it's safe to transition
      }
    };
    runMatching();
  }
}, [currentRole, founderData, mentorPool, hasAttemptedMatching]);

  // --- AUTH ---
  useEffect(() => {
    const initAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        await resolvePostAuthDestination(user);
      }
    };
    initAuth();

    const { data } = onAuthStateChange(async (event, session) => {
      // Cast the unknown session to an object containing an optional user
      const user = (session as { user?: User })?.user ?? null;
      setCurrentUser(user);
      if (event === 'SIGNED_OUT') {
        setCurrentRole(null);
        setScreen('landing');
        return;
      }
      if (user && event === 'SIGNED_IN') {
        await new Promise(r => setTimeout(r, 150));
        await resolvePostAuthDestination(user);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [resolvePostAuthDestination]);

  // --- DATA SYNC ---
  useEffect(() => {
  setRequestStates(prev => {
    const updated = { ...prev };
    
    meetups.forEach(m => { 
      if (m.mentor_id) {
        // Only sync to 'requested' if we aren't currently 
        // showing a more specific 'exists' or 'loading' state
        if (updated[m.mentor_id] !== 'exists' && updated[m.mentor_id] !== 'loading') {
          updated[m.mentor_id] = 'requested';
        }
      }
    });
    
    return updated;
  });
}, [meetups]);

  useEffect(() => {
    const loadPools = async () => {
      const mentors = await getMentorsWithFallback();
      setMentorPool(mentors);
    };
    loadPools();
  }, [currentUser]);

  useEffect(() => {
    if (screen === 'dashboard' && currentUser && currentRole) loadDashboard();
  }, [screen, currentUser, currentRole, loadDashboard]);

  useEffect(() => {
    if (screen === 'founder-results' && currentUser && currentRole === 'founder') {
      loadDashboard();
    }
  }, [screen, currentUser, currentRole, loadDashboard]);

  return {
    state: {
      screen, founderResults, mentorResults, mentorData, founderData,
      isMatching, currentUser, currentRole, isAuthenticated, meetups,
      isDashboardLoading, requestStates, mentorPool, feedbackSubmittedByMeetupId
    },
    actions: {
      setScreen, startOver, handleSignOut, resolvePostAuthDestination, canRequestMeetup,
      loadDashboard, handleRequestMeetup, handleUpdateMeetupStatus, handleLeaveFeedback,
      handleRoleSelect: async (role: Role) => {
        setCurrentRole(role);
        if (currentUser) {
          // 1. Update the hidden Auth metadata
          await supabase.auth.updateUser({ data: { role } });
          
          // 2. 👇 ADD THIS LINE: Explicitly update the public profiles table
          await supabase.from('profiles').update({ role }).eq('id', currentUser.id);
        }
        setScreen(role === 'founder' ? 'founder-step-1' : 'mentor-step-1');
      },
      handleFounderSubmit: async (data: FounderProfile) => {
  setFounderData(data);
  setScreen('founder-loading');
  setIsMatching(true); // <-- Add this! Locks the loading screen immediately.
  if (currentUser) await upsertFounderProfile(currentUser.id, data);
},
      handleMentorSubmit: async (data: MentorProfile) => {
        setMentorData(data);
        setScreen('mentor-confirmation');
        if (currentUser) await upsertMentorProfile(currentUser.id, data);
      },
      handleMentorSeeMatches: async () => {
        setScreen('mentor-loading');
        setIsMatching(true);
        try {
          const pool = await getAllFounderProfiles();
          const deterministic = matchMentorToFounders(mentorData!, pool);
          const enriched = await enrichMentorMatchesWithClaude(mentorData!, deterministic);
          setMentorResults(enriched.length > 0 ? enriched : deterministic);
        } finally {
          setIsMatching(false);
        }
      },
    }
  };
}
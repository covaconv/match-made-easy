import { useState, useCallback } from 'react';
import { Screen, Role, FounderProfile, MentorProfile, MatchResult, FounderMatchResult } from '@/types';
import { mentors } from '@/data/mentors';
import { founders } from '@/data/founders';
import { matchFounderToMentors, matchMentorToFounders } from '@/lib/matching';
import Landing from '@/components/Landing';
import RoleSelect from '@/components/RoleSelect';
import FounderForm from '@/components/FounderForm';
import MentorForm from '@/components/MentorForm';
import LoadingScreen from '@/components/LoadingScreen';
import ResultsScreen from '@/components/ResultsScreen';
import ConfirmationScreen from '@/components/ConfirmationScreen';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('landing');
  const [founderResults, setFounderResults] = useState<MatchResult[]>([]);
  const [mentorResults, setMentorResults] = useState<FounderMatchResult[]>([]);
  const [mentorData, setMentorData] = useState<MentorProfile | null>(null);

  const startOver = useCallback(() => {
    setScreen('landing');
    setFounderResults([]);
    setMentorResults([]);
    setMentorData(null);
  }, []);

  const handleFounderSubmit = useCallback((data: FounderProfile) => {
    const results = matchFounderToMentors(data, mentors);
    setFounderResults(results);
    setScreen('founder-loading');
  }, []);

  const handleMentorSubmit = useCallback((data: MentorProfile) => {
    setMentorData(data);
    setScreen('mentor-confirmation');
  }, []);

  const handleMentorSeeMatches = useCallback(() => {
    if (mentorData) {
      const results = matchMentorToFounders(mentorData, founders);
      setMentorResults(results);
      setScreen('mentor-loading');
    }
  }, [mentorData]);

  const handleRoleSelect = useCallback((role: Role) => {
    setScreen(role === 'founder' ? 'founder-step-1' : 'mentor-step-1');
  }, []);

  return (
    <>
      {screen === 'landing' && <Landing onStart={() => setScreen('role')} />}

      {screen === 'role' && <RoleSelect onSelect={handleRoleSelect} />}

      {(screen === 'founder-step-1' || screen === 'founder-step-2' || screen === 'founder-step-3') && (
        <FounderForm onSubmit={handleFounderSubmit} onBack={() => setScreen('role')} />
      )}

      {screen === 'founder-loading' && (
        <LoadingScreen onComplete={() => setScreen('founder-results')} />
      )}

      {screen === 'founder-results' && (
        <ResultsScreen results={founderResults} onStartOver={startOver} />
      )}

      {(screen === 'mentor-step-1' || screen === 'mentor-step-2' || screen === 'mentor-step-3') && (
        <MentorForm onSubmit={handleMentorSubmit} onBack={() => setScreen('role')} />
      )}

      {screen === 'mentor-confirmation' && mentorData && (
        <ConfirmationScreen
          mentorName={mentorData.fullName.split(' ')[0]}
          onSeeMatches={handleMentorSeeMatches}
        />
      )}

      {screen === 'mentor-loading' && (
        <LoadingScreen onComplete={() => setScreen('mentor-results')} isMentor />
      )}

      {screen === 'mentor-results' && (
        <ResultsScreen results={mentorResults} isMentor onStartOver={startOver} />
      )}
    </>
  );
};

export default Index;

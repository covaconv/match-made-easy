import { useEffect } from 'react';
import Landing from '@/components/Landing';
import RoleSelect from '@/components/RoleSelect';
import FounderForm from '@/components/FounderForm';
import MentorForm from '@/components/MentorForm';
import LoadingScreen from '@/components/LoadingScreen';
import ResultsScreen from '@/components/ResultsScreen';
import ConfirmationScreen from '@/components/ConfirmationScreen';
import LoginRegister from '@/components/LoginRegister';
import Dashboard from '@/components/Dashboard';
import Navbar from '@/components/Navbar';
import { useEpicMatch } from '@/hooks/useEpicMatch';
import { Screen } from '@/types';
import { getCurrentUser } from '@/lib/supabase';

const Index = () => {
  const { state, actions } = useEpicMatch();

  const handleLoadingComplete = (target: Screen) => {
    if (!state.isMatching) actions.setScreen(target);
  };

  useEffect(() => {
    if (state.screen === 'founder-loading' && !state.isMatching) actions.setScreen('founder-results');
    if (state.screen === 'mentor-loading' && !state.isMatching) actions.setScreen('mentor-results');
  }, [state.screen, state.isMatching, actions]);

  return (
    <>
      <Navbar
        isAuthenticated={state.isAuthenticated}
        userEmail={state.currentUser?.email}
        onSignOut={actions.handleSignOut}
        onGoToDashboard={() => actions.setScreen('dashboard')}
        showDashboardLink={state.isAuthenticated && state.screen !== 'dashboard'}
      />
      {state.screen === 'landing' && <Landing onStart={() => actions.setScreen('auth')} />}
      {state.screen === 'auth' && (
        <LoginRegister
          onAuthSuccess={async () => {
            const user = await getCurrentUser();
            if (user) await actions.resolvePostAuthDestination(user);
          }}
          onSkip={() => actions.setScreen('role')}
        />
      )}
      {state.screen === 'role' && <RoleSelect onSelect={actions.handleRoleSelect} />}
      {state.screen.includes('founder-step') && (
        <FounderForm onSubmit={actions.handleFounderSubmit} onBack={() => actions.setScreen('role')} />
      )}
      {state.screen === 'founder-loading' && (
        <LoadingScreen
          onComplete={() => handleLoadingComplete('founder-results')}
          isMatching={state.isMatching}
        />
      )}
      {state.screen === 'founder-results' && (
        <ResultsScreen
          results={state.founderResults}
          eligibleCount={state.mentorPool.length}
          showDashboardEntry={state.isAuthenticated}
          founderId={state.currentUser?.id}
          requestStateByMentorId={state.requestStates}
          canRequestMeetup={actions.canRequestMeetup}
          onRequestMeetup={(mId) => state.currentUser?.id && actions.handleRequestMeetup(state.currentUser.id, mId)}
          onOpenDashboard={() => actions.setScreen('dashboard')}
          onStartOver={actions.startOver}
        />
      )}
      {state.screen.includes('mentor-step') && (
        <MentorForm onSubmit={actions.handleMentorSubmit} onBack={() => actions.setScreen('role')} />
      )}
      {state.screen === 'mentor-confirmation' && state.mentorData && (
        <ConfirmationScreen
          mentorName={state.mentorData.fullName.split(' ')[0]}
          onSeeMatches={actions.handleMentorSeeMatches}
        />
      )}
      {state.screen === 'mentor-loading' && (
        <LoadingScreen
          onComplete={() => handleLoadingComplete('mentor-results')}
          isMentor
          isMatching={state.isMatching}
        />
      )}
      {state.screen === 'mentor-results' && (
        <ResultsScreen
          results={state.mentorResults}
          isMentor
          showDashboardEntry={state.isAuthenticated}
          onOpenDashboard={() => actions.setScreen('dashboard')}
          onStartOver={actions.startOver}
        />
      )}
      {state.screen === 'dashboard' && state.currentRole && (
  <Dashboard
    role={state.currentRole}
    meetups={state.meetups}
    loading={state.isDashboardLoading}
    onRefresh={actions.loadDashboard}
    
    // --- THE UNIFIED ROUTING FIX ---
    onBackToResults={() => {
      if (state.currentRole === 'mentor' && state.mentorResults.length === 0) {
        // Mentors need a manual kickstart if memory was wiped
        actions.handleMentorSeeMatches();
      } 
      else if (state.currentRole === 'founder' && state.isMatching) {
        // Founders might still be matching in the background! Send to loading screen.
        actions.setScreen('founder-loading');
      } 
      else {
        // Everyone else goes to their standard results screen
        actions.setScreen(state.currentRole === 'mentor' ? 'mentor-results' : 'founder-results');
      }
    }}
    // --------------------------------

    onAccept={(id) => actions.handleUpdateMeetupStatus(id, 'accepted')}
    onDecline={(id) => actions.handleUpdateMeetupStatus(id, 'declined')}
    onComplete={(id) => actions.handleUpdateMeetupStatus(id, 'completed')}

    onLeaveFeedback={actions.handleLeaveFeedback}
    feedbackSubmittedByMeetupId={state.feedbackSubmittedByMeetupId}
  />
)}
    </>
  );
  
};

export default Index;
import ScreenShell from './ScreenShell';
import ResultCard from './ResultCard';
import { MatchResult, FounderMatchResult } from '@/types';

interface ResultsScreenProps {
    results: (MatchResult | FounderMatchResult)[];
    isMentor?: boolean;
    eligibleCount?: number;
    onStartOver: () => void;
    showDashboardEntry?: boolean;
    onOpenDashboard?: () => void;
    isSyncing?: boolean;
    founderId?: string; // Correctly defined here
    canRequestMeetup?: (mentorId: string) => { allowed: boolean; reason?: string };
    onRequestMeetup?: (mentorId: string) => void;
    requestStateByMentorId?: Record<string, 'idle' | 'loading' | 'requested' | 'exists' | 'error'>;
    onSignOut?: () => void;
}

const ResultsScreen = ({
    results,
    isMentor,
    eligibleCount,
    onStartOver,
    isSyncing,
    showDashboardEntry,
    onOpenDashboard,
    founderId, 
    canRequestMeetup,
    onRequestMeetup,
    requestStateByMentorId,
    onSignOut,
}: ResultsScreenProps) => {
    const title = isMentor ? 'Founders you may be able to help' : 'Your top matches';

    const subtitle = isMentor
        ? 'Top founder matches based on challenge, stage, goals, and expertise fit.'
        : `Showing the strongest mentor matches from ${eligibleCount ?? results.length} eligible profiles.`;

    return (
        <ScreenShell className="py-10">
            <div className="mx-auto w-full max-w-3xl space-y-8">
                <div className="space-y-2">
                    <h2 className="text-3xl font-semibold text-foreground">{title}</h2>
                    <p className="text-muted-foreground">{subtitle}</p>
                    {showDashboardEntry && onOpenDashboard && (
                      <button
                        onClick={onOpenDashboard}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        Open dashboard
                      </button>
                    )}
                </div>

                <div className="space-y-4">
  {results.map((result, i) => {
    const isMentorResult = 'mentor' in result;

    return (
      (() => {
        // 1. Define base variables first
        const mentorId = isMentorResult ? result.mentor.id : '';
        const requestState = mentorId ? (requestStateByMentorId?.[mentorId] ?? 'idle') : 'idle';
        const requestGate = isMentorResult && canRequestMeetup ? canRequestMeetup(mentorId) : { allowed: true };
        
        // 2. Define the initial sync check
        // showDashboardEntry tells us we are authenticated and should be checking meetups
        const isInitialSync = isSyncing && requestState === 'idle';

        // 3. Consolidate the labels
        const actionLabel = 
      isInitialSync || requestState === 'loading'
        ? 'Checking...' 
        : requestState === 'requested' || requestState === 'exists'
          ? 'Requested'
          : 'Request Meetup';
          

        const actionDisabled = 
          isInitialSync || 
          requestState === 'loading' || 
          requestState === 'requested' || 
          requestState === 'exists' || 
          !requestGate.allowed;

        const actionHint =
          !requestGate.allowed
            ? requestGate.reason
            : requestState === 'exists'
              ? 'A meetup request already exists for this mentor.'
              : requestState === 'error'
                ? 'Could not create request. Please try again.'
                : undefined;

        return (
          <ResultCard
            key={isMentorResult ? result.mentor.id : result.founder.id}
            rank={i + 1}
            name={isMentorResult ? result.mentor.fullName : result.founder.fullName}
            role={isMentorResult ? result.mentor.currentRole : result.founder.startupName}
            explanation={(result as MatchResult & { aiExplanation?: string }).aiExplanation || result.explanation}
            score={result.totalScore}
            expertiseTags={isMentorResult ? result.expertiseTags : result.relevantTags}
            caveat={result.caveat}
            actionLabel={isMentorResult && onRequestMeetup ? actionLabel : undefined}
            actionDisabled={isMentorResult && onRequestMeetup ? actionDisabled : undefined}
            actionHint={isMentorResult && onRequestMeetup ? actionHint : undefined}
            onAction={
              isMentorResult && onRequestMeetup
                ? () => onRequestMeetup(result.mentor.id)
                : undefined
            }
          />
        );
      })()
    );
  })}
</div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={onStartOver}
                        className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Start over
                    </button>
                    {onSignOut && (
                        <button
                            onClick={onSignOut}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sign out
                        </button>
                    )}
                </div>
            </div>
        </ScreenShell>
    );
};

export default ResultsScreen;
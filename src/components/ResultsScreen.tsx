import ScreenShell from './ScreenShell';
import ResultCard from './ResultCard';
import { MatchResult, FounderMatchResult } from '@/types';

interface ResultsScreenProps {
  results: (MatchResult | FounderMatchResult)[];
  isMentor?: boolean;
  onStartOver: () => void;
}

const ResultsScreen = ({ results, isMentor, onStartOver }: ResultsScreenProps) => {
  return (
    <ScreenShell maxWidth="results">
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-foreground">
            {isMentor ? 'Your top founder matches' : 'Your top mentor matches'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isMentor
              ? 'These founders best match your expertise and preferences.'
              : 'These mentors best fit your current needs and goals.'}
          </p>
        </div>

        <div className="space-y-4">
          {results.map((result, i) => {
            const isMentorResult = 'mentor' in result;
            return (
              <ResultCard
                key={i}
                rank={i + 1}
                name={isMentorResult ? result.mentor.fullName : (result as FounderMatchResult).founder.fullName}
                role={isMentorResult ? result.mentor.currentRole : (result as FounderMatchResult).founder.startupName}
                explanation={result.explanation}
                score={result.totalScore}
                expertiseTags={'expertiseTags' in result ? result.expertiseTags : (result as FounderMatchResult).relevantTags}
                caveat={result.caveat}
              />
            );
          })}
        </div>

        <button
          onClick={onStartOver}
          className="w-full rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Start over
        </button>
      </div>
    </ScreenShell>
  );
};

export default ResultsScreen;

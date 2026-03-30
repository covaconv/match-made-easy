import ScreenShell from './ScreenShell';
import ResultCard from './ResultCard';
import { MatchResult, FounderMatchResult } from '@/types';

interface ResultsScreenProps {
    results: (MatchResult | FounderMatchResult)[];
    isMentor?: boolean;
    eligibleCount?: number;
    onStartOver: () => void;
}

const ResultsScreen = ({
    results,
    isMentor,
    eligibleCount,
    onStartOver,
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
                </div>

                <div className="space-y-4">
                    {results.map((result, i) => {
                        const isMentorResult = 'mentor' in result;

                        return (
                            <ResultCard
                                key={isMentorResult ? result.mentor.id : result.founder.id}
                                rank={i + 1}
                                name={isMentorResult ? result.mentor.fullName : result.founder.fullName}
                                role={isMentorResult ? result.mentor.currentRole : result.founder.startupName}
                                explanation={result.explanation}
                                score={result.totalScore}
                                expertiseTags={isMentorResult ? result.expertiseTags : result.relevantTags}
                                caveat={result.caveat}
                            />
                        );
                    })}
                </div>

                <button
                    onClick={onStartOver}
                    className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                    Start over
                </button>
            </div>
        </ScreenShell>
    );
};

export default ResultsScreen;
import ScreenShell from './ScreenShell';

interface ConfirmationScreenProps {
    mentorName: string;
    onSeeMatches: () => void;
}

const ConfirmationScreen = ({ mentorName, onSeeMatches }: ConfirmationScreenProps) => {
    return (
        <ScreenShell className="items-center justify-center text-center">
            <div className="space-y-6">
                <div className="space-y-3">
                    <h2 className="text-3xl font-semibold text-foreground">
                        Your profile has been added to the mentor pool.
                    </h2>

                    <p className="text-muted-foreground">
                        You can now preview founders who may benefit from your expertise.
                    </p>
                </div>

                <button
                    onClick={onSeeMatches}
                    className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    See My Matches
                </button>
            </div>
        </ScreenShell>
    );
};

export default ConfirmationScreen;
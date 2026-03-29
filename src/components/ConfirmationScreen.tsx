import ScreenShell from './ScreenShell';

interface ConfirmationScreenProps {
  mentorName: string;
  onSeeMatches: () => void;
}

const ConfirmationScreen = ({ mentorName, onSeeMatches }: ConfirmationScreenProps) => {
  return (
    <ScreenShell className="items-center justify-center text-center">
      <div className="space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">You're in, {mentorName}!</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Your profile has been added to the mentor pool. You can now see which founders best match your expertise.
          </p>
        </div>
        <button
          onClick={onSeeMatches}
          className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          See my matches
        </button>
      </div>
    </ScreenShell>
  );
};

export default ConfirmationScreen;

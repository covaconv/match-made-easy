import ScreenShell from './ScreenShell';

interface LandingProps {
  onStart: () => void;
}

const Landing = ({ onStart }: LandingProps) => {
  return (
    <ScreenShell className="items-center justify-center text-center">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            EPIC <span className="text-primary">Match</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-powered mentor-founder matching for EPIC Lab ITAM
          </p>
        </div>
        <button
          onClick={onStart}
          className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Get started
        </button>
      </div>
    </ScreenShell>
  );
};

export default Landing;

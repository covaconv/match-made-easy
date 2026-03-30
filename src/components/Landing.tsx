import ScreenShell from './ScreenShell';

interface LandingProps {
    onStart: () => void;
}

const Landing = ({ onStart }: LandingProps) => {
    return (
        <ScreenShell className="items-center justify-center text-center">
            <div className="space-y-6">
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        EPIC MATCH
                    </h1>

                    <p className="text-lg text-muted-foreground">
                        EPIC Match helps ITAM founders find the right alumni mentors using AI assisted compatibility scoring.
                    </p>

                    <p className="text-sm text-muted-foreground">
                        Built for EPIC Lab ITAM founders and alumni mentors.
                    </p>
                </div>

                <button
                    onClick={onStart}
                    className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Choose Your Role
                </button>
            </div>
        </ScreenShell>
    );
};

export default Landing;

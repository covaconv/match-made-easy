import { MeetupWithCounterparty, Role } from '@/types';
import ScreenShell from './ScreenShell';

interface DashboardProps {
  role: Role;
  meetups: MeetupWithCounterparty[];
  loading?: boolean;
  onBackToResults: () => void;
  onRefresh: () => void;
  onAccept?: (meetupId: string) => void;
  onDecline?: (meetupId: string) => void;
  onComplete?: (meetupId: string) => void;
  feedbackSubmittedByMeetupId?: Record<string, boolean>;
  onLeaveFeedback?: (meetupId: string) => void;
}

const Dashboard = ({
  role,
  meetups,
  loading,
  onBackToResults,
  onRefresh,
  onAccept,
  onDecline,
  onComplete,
  feedbackSubmittedByMeetupId,
  onLeaveFeedback,
}: DashboardProps) => {
  return (
    <ScreenShell className="py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground">
              {role === 'founder'
                ? 'Track the status of your meetup requests.'
                : 'Manage incoming meetup requests and status updates.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Refresh
            </button>
            <button
              onClick={onBackToResults}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Back
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading meetup data...</p>}

        {!loading && meetups.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">No meetup requests yet.</p>
          </div>
        )}

        <div className="space-y-3">
          {meetups.map((meetup) => (
            <div key={meetup.id} className="rounded-lg border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {meetup.counterparty_name ?? 'Unknown profile'}
                  </h3>
                  {meetup.counterparty_subtitle && (
                    <p className="text-sm text-muted-foreground">{meetup.counterparty_subtitle}</p>
                  )}
                  {meetup.status === 'accepted' && meetup.counterparty_email && (
                    <p className="text-sm font-medium text-primary mt-1">
                      <a href={`mailto:${meetup.counterparty_email}`} className="hover:underline">
                        {meetup.counterparty_email}
                      </a>
                    </p>
                  )}
                </div>
                <span className="rounded-md border border-border px-2 py-1 text-xs uppercase text-muted-foreground">
                  {meetup.status}
                </span>
              </div>

              {role === 'mentor' && meetup.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept?.(meetup.id)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onDecline?.(meetup.id)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Decline
                  </button>
                </div>
              )}

              {role === 'mentor' && meetup.status === 'accepted' && (
                <button
                  onClick={() => onComplete?.(meetup.id)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Mark completed
                </button>
              )}

              {meetup.status === 'completed' && (
                feedbackSubmittedByMeetupId?.[meetup.id] ? (
                  <p className="text-sm text-muted-foreground">Feedback submitted</p>
                ) : (
                  <button
                    onClick={() => onLeaveFeedback?.(meetup.id)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Leave Feedback
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
};

export default Dashboard;
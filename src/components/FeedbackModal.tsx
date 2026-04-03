import { useEffect, useState } from 'react';

interface FeedbackModalProps {
  open: boolean;
  meetupId: string | null;
  counterpartyName?: string;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (rating: number, note?: string) => Promise<void>;
}

const FeedbackModal = ({
  open,
  meetupId,
  counterpartyName,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: FeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setRating(0);
      setNote('');
    }
  }, [open, meetupId]);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) return;
    await onSubmit(rating, note.trim() ? note.trim() : undefined);
  };

  if (!open || !meetupId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground">Leave Feedback</h3>
          <p className="text-sm text-muted-foreground">
            {counterpartyName
              ? `Rate your completed meetup with ${counterpartyName}.`
              : 'Rate your completed meetup experience.'}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Rating (1-5)</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className={`h-10 w-10 rounded-md border border-border bg-background text-lg transition-colors hover:bg-primary/10 ${
                  rating >= value ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Share brief feedback about the meetup."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;

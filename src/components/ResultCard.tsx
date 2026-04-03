import { cn } from '@/lib/utils';

interface ResultCardProps {
  rank: number;
  name: string;
  role: string;
  explanation: string;
  score: number;
  expertiseTags: string[];
  caveat?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionHint?: string;
}

const ResultCard = ({
  rank,
  name,
  role,
  explanation,
  score,
  expertiseTags,
  caveat,
  actionLabel,
  onAction,
  actionDisabled,
  actionHint,
}: ResultCardProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            #{rank}
          </span>
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{role}</p>
      </div>

      {/* Expertise tags */}
      <div className="flex flex-wrap gap-1.5">
        {expertiseTags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Explanation — visually dominant */}
      <p className="text-sm text-foreground leading-relaxed">{explanation}</p>

      {/* Score — secondary */}
      <p className="text-xs font-medium text-primary">
        Match strength: {score}/100
      </p>

      {/* Caveat — muted, only when present */}
      {caveat && (
        <p className="text-xs text-muted-foreground italic border-t border-border pt-3">
          {caveat}
        </p>
      )}

      {actionLabel && (
        <div className="border-t border-border pt-3 space-y-2">
          <button
            onClick={onAction}
            disabled={actionDisabled}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {actionLabel}
          </button>
          {actionHint && <p className="text-xs text-muted-foreground">{actionHint}</p>}
        </div>
      )}

    </div>
  );
};

export default ResultCard;
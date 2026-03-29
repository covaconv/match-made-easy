import { cn } from '@/lib/utils';

interface ResultCardProps {
  rank: number;
  name: string;
  role: string;
  explanation: string;
  score: number;
  expertiseTags: string[];
  caveat?: string;
}

const ResultCard = ({ rank, name, role, explanation, score, expertiseTags, caveat }: ResultCardProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">#{rank}</span>
            <h3 className="font-semibold text-foreground">{name}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{role}</p>
        </div>
        <span className="text-sm font-semibold text-primary whitespace-nowrap">
          Match strength: {score}/100
        </span>
      </div>

      <p className="text-sm text-foreground leading-relaxed">{explanation}</p>

      <div className="flex flex-wrap gap-1.5">
        {expertiseTags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      {caveat && (
        <p className="text-xs text-muted-foreground italic">{caveat}</p>
      )}
    </div>
  );
};

export default ResultCard;

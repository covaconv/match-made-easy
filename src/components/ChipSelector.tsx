import { cn } from '@/lib/utils';

interface ChipSelectorProps {
  options: string[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  maxSelections?: number;
  label: string;
}

const ChipSelector = ({
  options,
  selected,
  onChange,
  multiSelect = false,
  maxSelections,
  label,
}: ChipSelectorProps) => {
  const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : [];

  const handleClick = (option: string) => {
    if (multiSelect) {
      const current = selectedArray;
      if (current.includes(option)) {
        onChange(current.filter((s) => s !== option));
      } else if (!maxSelections || current.length < maxSelections) {
        onChange([...current, option]);
      }
    } else {
      onChange(option === selected ? '' : option);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {multiSelect && maxSelections && (
          <span className="text-muted-foreground ml-1">(max {maxSelections})</span>
        )}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedArray.includes(option);
          const isDisabled =
            multiSelect && maxSelections && !isSelected && selectedArray.length >= maxSelections;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleClick(option)}
              disabled={!!isDisabled}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary/50',
                isDisabled && 'cursor-not-allowed opacity-40',
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChipSelector;

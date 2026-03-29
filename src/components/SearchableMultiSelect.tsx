import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Search } from 'lucide-react';

interface SearchableMultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
  label: string;
  placeholder?: string;
}

const SearchableMultiSelect = ({
  options,
  selected,
  onChange,
  maxSelections = 2,
  label,
  placeholder = 'Search...',
}: SearchableMultiSelectProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(
    (o) => o.toLowerCase().includes(query.toLowerCase()) && !selected.includes(o),
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addItem = (item: string) => {
    if (selected.length < maxSelections) {
      onChange([...selected, item]);
      setQuery('');
    }
  };

  const removeItem = (item: string) => {
    onChange(selected.filter((s) => s !== item));
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-sm font-medium text-foreground">
        {label}
        <span className="text-muted-foreground ml-1">(max {maxSelections})</span>
      </label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-lg border border-primary bg-primary/10 px-2.5 py-1 text-sm text-primary-foreground"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="hover:text-primary transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {selected.length < maxSelections && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="flex h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {isOpen && filtered.length > 0 && (
            <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md">
              {filtered.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    addItem(option);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableMultiSelect;

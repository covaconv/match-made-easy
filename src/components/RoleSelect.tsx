import { Role } from '@/types';
import ScreenShell from './ScreenShell';
import { cn } from '@/lib/utils';

interface RoleSelectProps {
  onSelect: (role: Role) => void;
}

const roles: { role: Role; title: string; description: string }[] = [
  {
    role: 'founder',
    title: "I'm a founder",
    description: 'Find the top alumni mentors who fit your current needs.',
  },
  {
    role: 'mentor',
    title: "I'm a mentor",
    description: 'Join the mentor pool and discover founders to support.',
  },
];

const RoleSelect = ({ onSelect }: RoleSelectProps) => {
  return (
    <ScreenShell className="items-center justify-center">
      <div className="space-y-6 w-full">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Choose your role</h2>
          <p className="text-muted-foreground text-sm">How do you want to use EPIC Match?</p>
        </div>
        <div className="grid gap-4">
          {roles.map(({ role, title, description }) => (
            <button
              key={role}
              onClick={() => onSelect(role)}
              className={cn(
                'w-full rounded-lg border border-border bg-card p-6 text-left transition-colors',
                'hover:border-primary hover:bg-primary/5',
              )}
            >
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </button>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
};

export default RoleSelect;

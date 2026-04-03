import { Role } from '@/types';

interface NavbarProps {
  isAuthenticated: boolean;
  userEmail?: string;
  onSignOut: () => void;
  onGoToDashboard: () => void;
  showDashboardLink: boolean;
}

const Navbar = ({ isAuthenticated, userEmail, onSignOut, onGoToDashboard, showDashboardLink }: NavbarProps) => {
  if (!isAuthenticated) return null;

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-foreground">EPIC Match</span>
          {showDashboardLink && (
            <button 
              onClick={onGoToDashboard}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-muted-foreground md:inline-block">
            {userEmail}
          </span>
          <button
            onClick={onSignOut}
            className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
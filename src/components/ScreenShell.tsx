import { cn } from '@/lib/utils';

interface ScreenShellProps {
  children: React.ReactNode;
  maxWidth?: 'form' | 'results';
  className?: string;
}

const ScreenShell = ({ children, maxWidth = 'form', className }: ScreenShellProps) => {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-8 min-h-screen flex flex-col',
        maxWidth === 'form' ? 'max-w-[600px]' : 'max-w-[700px]',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default ScreenShell;

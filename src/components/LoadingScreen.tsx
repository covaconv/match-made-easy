import { useState, useEffect } from 'react';
import ScreenShell from './ScreenShell';

const MESSAGES = [
  'Analyzing mentor profiles…',
  'Scoring expertise fit…',
  'Generating your matches…',
];

interface LoadingScreenProps {
  onComplete: () => void;
  isMentor?: boolean;
}

const LoadingScreen = ({ onComplete, isMentor }: LoadingScreenProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const messages = isMentor
      ? ['Analyzing founder profiles…', 'Scoring compatibility…', 'Generating your matches…']
      : MESSAGES;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1500);

    const timeout = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete, isMentor]);

  const messages = isMentor
    ? ['Analyzing founder profiles…', 'Scoring compatibility…', 'Generating your matches…']
    : MESSAGES;

  return (
    <ScreenShell className="items-center justify-center text-center">
      <div className="space-y-8">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p
          key={messageIndex}
          className="text-foreground text-lg font-medium animate-fade-in"
        >
          {messages[messageIndex]}
        </p>
      </div>
    </ScreenShell>
  );
};

export default LoadingScreen;

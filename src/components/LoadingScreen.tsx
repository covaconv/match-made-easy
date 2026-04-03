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
  isMatching?: boolean;
}

const LoadingScreen = ({ onComplete, isMentor, isMatching }: LoadingScreenProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);

  const messages = isMentor
    ? ['Analyzing founder profiles…', 'Scoring compatibility…', 'Generating your matches…']
    : MESSAGES;

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Minimum 4.5s display time
  useEffect(() => {
    const timeout = setTimeout(() => setMinDelayElapsed(true), 4500);
    return () => clearTimeout(timeout);
  }, []);

  // Only complete when both the delay has elapsed AND matching is done
  useEffect(() => {
    if (minDelayElapsed && !isMatching) onComplete();
  }, [minDelayElapsed, isMatching, onComplete]);

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

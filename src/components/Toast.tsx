import { useEffect } from 'react';

interface ToastProps {
  message: string;
  tone?: 'success' | 'error';
  onDismiss: () => void;
}

/** Auto-dismisses after 4 seconds, or immediately when closed by hand. */
export function Toast({ message, tone = 'success', onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className={`toast toast--${tone}`} role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" className="toast__close" onClick={onDismiss} aria-label="Dismiss notification">
        &times;
      </button>
    </div>
  );
}

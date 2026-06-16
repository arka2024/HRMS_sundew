interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="loading-state">
      <div className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

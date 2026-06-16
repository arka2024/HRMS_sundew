interface ServiceErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ServiceError({
  title = 'Service Unavailable',
  message,
  onRetry,
}: ServiceErrorProps) {
  return (
    <div className="service-error">
      <div className="service-error-icon" aria-hidden="true">
        !
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
      <h2>Something went wrong.</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export default function FunctionalErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Optionally reset state here
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

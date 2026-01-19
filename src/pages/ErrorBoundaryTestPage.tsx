import { useState } from 'react';

/**
 * Test page for ErrorBoundary demonstration
 * This page is for development/testing purposes only
 */
export function ErrorBoundaryTestPage() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error from ErrorBoundaryTestPage');
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>ErrorBoundary Test Page</h1>
      <p>Click the button below to trigger an error and test the ErrorBoundary component.</p>

      <button
        onClick={() => setShouldThrow(true)}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '1rem',
        }}
      >
        Trigger Error
      </button>
    </div>
  );
}

export default function ErrorFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0e27',
      color: '#e2e8f0',
      fontFamily: 'Inter, system-ui, sans-serif',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(255,51,102,0.1)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem', border: '1px solid rgba(255,51,102,0.3)',
      }}>
        <span style={{ fontSize: 36 }}>⚠️</span>
      </div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Something went wrong
      </h1>
      <p style={{ color: '#94a3b8', maxWidth: 400, marginBottom: '1.5rem' }}>
        The page you're looking for doesn't exist or an unexpected error occurred.
      </p>
      <a
        href="/dashboard"
        style={{
          padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
          background: 'rgba(0,212,255,0.15)', color: '#00d4ff',
          border: '1px solid rgba(0,212,255,0.3)',
          textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
        }}
      >
        ← Back to Dashboard
      </a>
    </div>
  );
}

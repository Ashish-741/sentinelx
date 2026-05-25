export default function NotFoundPage() {
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
      <h1 style={{ fontSize: '6rem', fontWeight: 800, color: '#00d4ff', marginBottom: 0 }}>
        404
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
        Page not found — this sector is uncharted.
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

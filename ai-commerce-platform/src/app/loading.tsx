export default function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

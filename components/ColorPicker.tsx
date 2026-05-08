'use client'

const QUICK_COLORS = ['#FFFFFF','#F5F0E8','#FAFAFA','#F5E8F0','#E8EFF5','#EEF5EE','#1A1714','#2D2D2D']

export function ColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {QUICK_COLORS.map(qc => (
          <div key={qc} title={qc} onClick={() => onChange(qc)} style={{
            width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
            background: qc,
            border: `2px solid ${color === qc ? 'var(--accent)' : (qc === '#FFFFFF' || qc === '#FAFAFA') ? '#ccc' : 'transparent'}`,
            outline: color === qc ? '2px solid var(--accent)' : 'none',
            outlineOffset: 1, transition: 'outline .12s', flexShrink: 0,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer',
            background: color === 'transparent' ? undefined : color,
            backgroundImage: color === 'transparent'
              ? 'repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 0 0/8px 8px'
              : undefined,
          }} />
          <input
            type="color"
            value={color === 'transparent' ? '#ffffff' : color}
            onChange={e => onChange(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', padding: 0, border: 'none' }}
            title="Pick custom color"
          />
        </div>
        <input
          type="text"
          value={color}
          onChange={e => {
            const v = e.target.value
            if (v === 'transparent' || /^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v)
          }}
          onBlur={e => {
            if (e.target.value !== 'transparent' && !/^#[0-9A-Fa-f]{6}$/.test(e.target.value))
              onChange('#FFFFFF')
          }}
          placeholder="#FFFFFF"
          style={{
            flex: 1, padding: '5px 8px',
            border: '1px solid var(--border)', borderRadius: 4,
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            background: 'var(--bg)', color: 'var(--ink)',
          }}
        />
        <div
          onClick={() => onChange('transparent')}
          title="Transparent"
          style={{
            width: 28, height: 28, borderRadius: 5, cursor: 'pointer', flexShrink: 0,
            backgroundImage: 'repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 0 0/8px 8px',
            border: `2px solid ${color === 'transparent' ? 'var(--accent)' : 'var(--border)'}`,
          }}
        />
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { CanvasItem, ExportSettings, CanvasDimensions, ProductImage } from '@/lib/types'
import { ColorPicker } from './LeftPanel'

interface Props {
  selectedItem: CanvasItem | null
  exportSettings: ExportSettings
  canvasDims: CanvasDimensions
  images: ProductImage[]
  onSetBackgroundImage: (id: string | null) => void
  onScaleChange: (v: number) => void
  onRotChange: (v: number) => void
  onOpacityChange: (v: number) => void
  onFlipH: () => void
  onFlipV: () => void
  onCenter: () => void
  onReset: () => void
  onBringForward: () => void
  onSendBack: () => void
  onDelete: () => void
  onShadowToggle: () => void
  onShadowIntensity: (v: number) => void
  onExportSettingsChange: (s: ExportSettings) => void
  onCanvasDimsChange: (d: CanvasDimensions) => void
  onDownload: () => void
  hasGenerated: boolean
}

// Preset aspect ratios
const PRESETS = [
  { label: '1:1',    icon: '⬜', w: 1500, h: 1500, desc: 'Square' },
  { label: '4:5',    icon: '▯',  w: 1200, h: 1500, desc: 'Instagram portrait' },
  { label: '9:16',   icon: '▯',  w: 1080, h: 1920, desc: 'Story / Reel' },
  { label: '16:9',   icon: '▬',  w: 1920, h: 1080, desc: 'Landscape / Banner' },
  { label: '4:3',    icon: '▬',  w: 1600, h: 1200, desc: 'Standard landscape' },
  { label: '3:4',    icon: '▯',  w: 1200, h: 1600, desc: 'Portrait' },
  { label: 'A4',     icon: '📄', w: 2480, h: 3508, desc: 'A4 print (300dpi)' },
  { label: 'Etsy',   icon: '🛍', w: 2700, h: 2025, desc: 'Etsy listing (4:3)' },
]


export default function RightPanel({
  selectedItem, exportSettings, canvasDims, images, onSetBackgroundImage,
  onScaleChange, onRotChange, onOpacityChange,
  onFlipH, onFlipV, onCenter, onReset,
  onBringForward, onSendBack, onDelete,
  onShadowToggle, onShadowIntensity,
  onExportSettingsChange, onCanvasDimsChange,
  onDownload, hasGenerated,
}: Props) {
  const [lockAspect, setLockAspect] = useState(true)
  const [bgTab, setBgTab] = useState<'color' | 'image'>(
    exportSettings.backgroundImageId ? 'image' : 'color'
  )
  const aspectRatio = canvasDims.w / canvasDims.h

  function handleWChange(newW: number) {
    const w = Math.min(8000, Math.max(100, newW))
    const h = lockAspect ? Math.round(w / aspectRatio) : canvasDims.h
    onCanvasDimsChange({ w, h })
  }

  function handleHChange(newH: number) {
    const h = Math.min(8000, Math.max(100, newH))
    const w = lockAspect ? Math.round(h * aspectRatio) : canvasDims.w
    onCanvasDimsChange({ w, h })
  }

  function applyPreset(preset: typeof PRESETS[0]) {
    onCanvasDimsChange({ w: preset.w, h: preset.h })
  }

  return (
    <div style={{
      borderLeft: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column',
      width: 245, flexShrink: 0, overflow: 'hidden',
    }}>

      {/* ── INSPECTOR ── */}
      <div style={{ padding: 14, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={labelStyle}>Inspector</div>
        {!selectedItem ? (
          <div style={{ color: 'var(--muted)', fontSize: 10, lineHeight: 1.7, textAlign: 'center', padding: '10px 4px' }}>
            Click any item to select & edit individually.
          </div>
        ) : (
          <div>
            {selectedItem.isHero && (
              <div style={{ background: '#FEF9C3', color: '#92400E', border: '1px solid #FDE68A', fontSize: 9, padding: '4px 8px', borderRadius: 3, textAlign: 'center', marginBottom: 10 }}>
                ⭐ Hero item (bag)
              </div>
            )}
            <PropSlider label="Scale"    value={Math.round(selectedItem.scale * 100)}                   unit="%" min={15}   max={500} onChange={onScaleChange} />
            <PropSlider label="Rotation" value={Math.round(selectedItem.rot * 180 / Math.PI)}           unit="°" min={-180} max={180} onChange={onRotChange} />
            <PropSlider label="Opacity"  value={Math.round(selectedItem.opacity * 100)}                 unit="%" min={20}   max={100} onChange={onOpacityChange} />

            {/* Shadow toggle + intensity */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.7, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span>Drop shadow</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                  <span style={{ fontSize: 9, color: selectedItem.shadow ? 'var(--accent2)' : 'var(--muted)' }}>
                    {selectedItem.shadow ? 'on' : 'off'}
                  </span>
                  <div
                    onClick={onShadowToggle}
                    style={{
                      width: 28, height: 16, borderRadius: 8,
                      background: selectedItem.shadow ? 'var(--accent2)' : 'var(--border)',
                      position: 'relative', cursor: 'pointer', transition: 'background .2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 2,
                      left: selectedItem.shadow ? 14 : 2,
                      width: 12, height: 12, borderRadius: '50%',
                      background: '#fff', transition: 'left .2s',
                    }} />
                  </div>
                </label>
              </div>
              {selectedItem.shadow && (
                <PropSlider
                  label="Intensity"
                  value={Math.round((selectedItem.shadowIntensity ?? 0.5) * 100)}
                  unit="%"
                  min={10} max={100}
                  onChange={onShadowIntensity}
                />
              )}
            </div>

            <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <HBtn onClick={onFlipH}>⇄ Flip H</HBtn>
              <HBtn onClick={onFlipV}>⇅ Flip V</HBtn>
              <HBtn onClick={onCenter}>⊕ Center</HBtn>
              <HBtn onClick={onReset}>↺ Reset</HBtn>
              <HBtn onClick={onBringForward}>↑ Fwd</HBtn>
              <HBtn onClick={onSendBack}>↓ Back</HBtn>
            </div>
            <button onClick={onDelete} style={{ width: '100%', marginTop: 6, padding: '6px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 4, fontFamily: "'DM Mono', monospace", fontSize: 9, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              🗑 Remove Item
            </button>
          </div>
        )}
      </div>


      {/* ── EXPORT — pinned bottom ── */}
      <div style={{ padding: 14, borderTop: '2px solid var(--accent2)', background: 'linear-gradient(to bottom, var(--surface), #F0F7F5)', flexShrink: 0 }}>
        <div style={{ ...labelStyle, marginBottom: 10 }}>↓ Export</div>

        {/* Canvas size */}
        <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>
          Canvas size (px)
        </div>

        {/* W × H inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, color: 'var(--muted)', marginBottom: 2 }}>W</div>
            <input
              type="number" min={100} max={8000} value={canvasDims.w}
              onChange={e => handleWChange(Number(e.target.value))}
              style={dimInput}
            />
          </div>
          {/* Lock aspect ratio toggle */}
          <button
            onClick={() => setLockAspect(l => !l)}
            title={lockAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
            style={{
              marginTop: 14, padding: '4px 5px',
              background: lockAspect ? '#EFF6FF' : 'var(--bg)',
              border: `1px solid ${lockAspect ? '#93C5FD' : 'var(--border)'}`,
              borderRadius: 4, cursor: 'pointer', fontSize: 12, lineHeight: 1,
              color: lockAspect ? '#2563EB' : 'var(--muted)',
            }}
            // title={lockAspect ? 'Lock: proportional resize' : 'Unlocked: resize freely'}
          >
            {lockAspect ? '🔒' : '🔓'}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, color: 'var(--muted)', marginBottom: 2 }}>H</div>
            <input
              type="number" min={100} max={8000} value={canvasDims.h}
              onChange={e => handleHChange(Number(e.target.value))}
              style={dimInput}
            />
          </div>
        </div>

        {/* Size info */}
        <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 8 }}>
          {canvasDims.w}×{canvasDims.h}px · {(canvasDims.w / canvasDims.h).toFixed(2)} ratio
        </div>

        {/* Presets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, marginBottom: 12 }}>
          {PRESETS.map(p => {
            const isActive = canvasDims.w === p.w && canvasDims.h === p.h
            return (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                title={`${p.desc} — ${p.w}×${p.h}px`}
                style={{
                  padding: '4px 2px',
                  border: `1px solid ${isActive ? 'var(--accent2)' : 'var(--border)'}`,
                  background: isActive ? '#F0F7F5' : 'var(--bg)',
                  color: isActive ? 'var(--accent2)' : 'var(--muted)',
                  borderRadius: 4, fontFamily: "'DM Mono', monospace",
                  fontSize: 8, cursor: 'pointer', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                }}
              >
                <span style={{ fontSize: 11 }}>{p.icon}</span>
                <span style={{ letterSpacing: 0.3 }}>{p.label}</span>
              </button>
            )
          })}
        </div>

        {/* Linked bg toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.7 }}>
            {exportSettings.linkedBg ? 'Preview & Export BG' : 'Export background'}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <span style={{ fontSize: 9, color: exportSettings.linkedBg ? 'var(--accent2)' : 'var(--muted)' }}>
              {exportSettings.linkedBg ? '🔗 linked' : '🔓 separate'}
            </span>
            <div
              onClick={() => onExportSettingsChange({ ...exportSettings, linkedBg: !exportSettings.linkedBg })}
              style={{
                width: 28, height: 16, borderRadius: 8,
                background: exportSettings.linkedBg ? 'var(--accent2)' : 'var(--border)',
                position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 2,
                left: exportSettings.linkedBg ? 14 : 2,
                width: 12, height: 12, borderRadius: '50%',
                background: '#fff', transition: 'left .2s',
              }} />
            </div>
          </label>
        </div>
        {/* Color | Image tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <button
            onClick={() => setBgTab('color')}
            style={tabBtn(bgTab === 'color')}
          >Color</button>
          <button
            onClick={() => setBgTab('image')}
            style={tabBtn(bgTab === 'image')}
          >Image{exportSettings.backgroundImageId ? ' ●' : ''}</button>
        </div>

        {bgTab === 'color' ? (
          <div style={{ marginBottom: 12 }}>
            <ColorPicker
              color={exportSettings.background}
              onChange={bg => onExportSettingsChange({ ...exportSettings, background: bg })}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            {images.length === 0 ? (
              <div style={{ fontSize: 9, color: 'var(--muted)', padding: '10px 4px', textAlign: 'center', lineHeight: 1.6 }}>
                Upload images first to use one as a backdrop.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 8 }}>
                  {/* None tile */}
                  <button
                    onClick={() => onSetBackgroundImage(null)}
                    title="No image background"
                    style={bgThumbBtn(!exportSettings.backgroundImageId)}
                  >
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>None</span>
                  </button>
                  {images.map(img => {
                    const active = exportSettings.backgroundImageId === img.id
                    return (
                      <button
                        key={img.id}
                        onClick={() => onSetBackgroundImage(img.id)}
                        title="Use as backdrop"
                        style={bgThumbBtn(active)}
                      >
                        <img
                          src={img.dataUrl}
                          alt=""
                          draggable={false}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 3 }}
                        />
                      </button>
                    )
                  })}
                </div>
                {/* Fit toggle */}
                {exportSettings.backgroundImageId && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => onExportSettingsChange({ ...exportSettings, backgroundFit: 'cover' })}
                      style={fitBtn(exportSettings.backgroundFit === 'cover')}
                    >Cover</button>
                    <button
                      onClick={() => onExportSettingsChange({ ...exportSettings, backgroundFit: 'contain' })}
                      style={fitBtn(exportSettings.backgroundFit === 'contain')}
                    >Contain</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Download */}
        <button
          onClick={onDownload}
          disabled={!hasGenerated}
          style={{
            width: '100%', padding: '10px 8px',
            background: hasGenerated ? 'var(--ink)' : 'var(--border)',
            color: hasGenerated ? 'var(--bg)' : 'var(--muted)',
            border: 'none', borderRadius: 5,
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            textTransform: 'uppercase', letterSpacing: 0.8,
            cursor: hasGenerated ? 'pointer' : 'not-allowed', transition: 'background .15s',
          }}
          onMouseEnter={e => { if (hasGenerated) (e.target as HTMLElement).style.background = 'var(--accent2)' }}
          onMouseLeave={e => { if (hasGenerated) (e.target as HTMLElement).style.background = 'var(--ink)' }}
        >
          ↓ Download {canvasDims.w}×{canvasDims.h}px
        </button>
      </div>
      {/* ── TIPS ── */}
      <div style={{ padding: 14, borderBottom: '1px solid var(--border)', overflowY: 'auto', flex: 1 }}>
        <div style={labelStyle}>Composition Tips</div>
        {TIPS.map((t, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: 9, lineHeight: 1.5, color: 'var(--muted)', paddingLeft: 8, borderLeft: '2px solid var(--border)' }}>
              <strong style={{ color: 'var(--ink)', display: 'block' }}>{t.title}</strong>
              {t.body}
            </div>
        ))}
      </div>
    </div>
  )
}

function PropSlider({ label, value, unit, min, max, onChange }: {
  label: string; value: number; unit: string; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.7, display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        {label} <span style={{ color: 'var(--ink)' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent2)' }} />
    </div>
  )
}

function HBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 3px', border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: 4, fontFamily: "'DM Mono', monospace", fontSize: 9, cursor: 'pointer', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--ink)', transition: 'all .15s' }}
      onMouseEnter={e => { const t = e.target as HTMLElement; t.style.background = 'var(--ink)'; t.style.color = 'var(--bg)' }}
      onMouseLeave={e => { const t = e.target as HTMLElement; t.style.background = 'var(--bg)'; t.style.color = 'var(--ink)' }}
    >{children}</button>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)', marginBottom: 9, display: 'block',
}

const dimInput: React.CSSProperties = {
  width: '100%', padding: '5px 6px',
  border: '1px solid var(--border)', borderRadius: 4,
  fontFamily: "'DM Mono', monospace", fontSize: 11,
  background: 'var(--bg)', color: 'var(--ink)',
  textAlign: 'center',
}

function tabBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: '6px 4px',
    background: active ? 'var(--ink)' : 'var(--bg)',
    color: active ? 'var(--bg)' : 'var(--muted)',
    border: `1px solid ${active ? 'var(--ink)' : 'var(--border)'}`,
    borderRadius: 4,
    fontFamily: "'DM Mono', monospace", fontSize: 9,
    textTransform: 'uppercase', letterSpacing: 0.7,
    cursor: 'pointer',
  }
}

function bgThumbBtn(active: boolean): React.CSSProperties {
  return {
    aspectRatio: '1',
    padding: 0,
    background: 'var(--bg)',
    border: `2px solid ${active ? '#7C3AED' : 'var(--border)'}`,
    borderRadius: 5,
    cursor: 'pointer',
    overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}

function fitBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: '5px 4px',
    background: active ? '#F0F7F5' : 'var(--bg)',
    color: active ? 'var(--accent2)' : 'var(--muted)',
    border: `1px solid ${active ? 'var(--accent2)' : 'var(--border)'}`,
    borderRadius: 4,
    fontFamily: "'DM Mono', monospace", fontSize: 9,
    textTransform: 'uppercase', letterSpacing: 0.7,
    cursor: 'pointer',
  }
}

const TIPS = [
  { title: 'Bag = anchor',    body: 'Place bag large at bottom-left, items spread up & right' },
  { title: 'C-Curve flow',    body: 'Items arc from top-left, curving down-right around the bag' },
  { title: 'Fan-out rule',    body: 'Angle items outward like a hand of cards from the bag' },
  { title: 'Overlap = depth', body: 'Slightly overlap items to avoid "catalog" feel' },
  { title: 'Scale variety',   body: 'Large bag + medium items + 1–2 small accents' },
  { title: 'Odd numbers',     body: '5 or 7 items compose better than 4 or 6' },
]

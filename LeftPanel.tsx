'use client'

import { useRef } from 'react'
import { ProductImage } from '@/lib/types'
import { LAYOUTS } from '@/lib/layouts'
import ProductThumb from './ProductThumb'

interface Props {
  images: ProductImage[]
  activeLayout: string
  bgColor: string
  rotVariance: number
  globalScale: number
  backgroundImageId?: string | null
  onFilesAdded: (files: FileList) => void
  onLayoutChange: (id: string) => void
  onBgChange: (color: string) => void
  onRotChange: (v: number) => void
  onScaleChange: (v: number) => void
  onRemoveImage: (id: string) => void
  onToggleBgRemove: (id: string) => void
  onRemoveBg: (id: string, shadowMode:any) => void
  onPreview: (id: string) => void
  onGenerate: () => void
  onClear: () => void
}


export default function LeftPanel({
  images, activeLayout, bgColor, rotVariance, globalScale, backgroundImageId,
  onFilesAdded, onLayoutChange, onBgChange, onRotChange, onScaleChange,
  onRemoveImage, onToggleBgRemove, onRemoveBg, onPreview,
  onGenerate, onClear,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  return (
    <div style={{
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto', width: 250, flexShrink: 0,
    }}>
      {/* UPLOAD */}
      <div style={sectionStyle}>
        <div style={labelStyle}>1. Upload Products</div>
        <div
          ref={dropRef}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); dropRef.current!.style.borderColor = 'var(--accent)' }}
          onDragLeave={() => { dropRef.current!.style.borderColor = 'var(--border)' }}
          onDrop={e => {
            e.preventDefault()
            dropRef.current!.style.borderColor = 'var(--border)'
            if (e.dataTransfer.files.length) onFilesAdded(e.dataTransfer.files)
          }}
          style={{
            border: '1.5px dashed var(--border)', borderRadius: 6,
            padding: '16px 10px', textAlign: 'center', cursor: 'pointer',
            background: 'var(--bg)', transition: 'all .2s',
          }}
        >
          <input
            ref={fileRef} type="file" multiple accept="image/*"
            style={{ display: 'none' }}
            onChange={e => e.target.files && onFilesAdded(e.target.files)}
          />
          <div style={{ fontSize: 22, marginBottom: 4 }}>📦</div>
          <p style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--accent)' }}>Click or drag</strong> images<br />
            1st image = hero bag · max 12
          </p>
        </div>

        {/* Thumbnails */}
        {images.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              {images.length} product{images.length !== 1 ? 's' : ''} · hover to edit
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
              {images.map((img, i) => (
                <ProductThumb
                  key={img.id}
                  image={img}
                  index={i}
                  isBackground={img.id === backgroundImageId}
                  onRemove={onRemoveImage}
                  onPreview={onPreview}
                />
              ))}
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
              ⭐ Gold = hero · ✂ Green = BG removed · Click image to preview & edit
            </div>
          </div>
        )}
      </div>

      {/* LAYOUTS */}
      <div style={sectionStyle}>
        <div style={labelStyle}>2. Layout Style</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {LAYOUTS.map(l => (
            <LayoutCard key={l.id} layout={l} active={activeLayout === l.id} onClick={() => onLayoutChange(l.id)} />
          ))}
        </div>
      </div>

      {/* BACKGROUND */}
      {/*<div style={sectionStyle}>*/}
      {/*  <div style={labelStyle}>3. Canvas Background</div>*/}
      {/*  <ColorPicker color={bgColor} onChange={onBgChange} />*/}
      {/*</div>*/}

      {/* SLIDERS */}
      {/*<div style={sectionStyle}>*/}
      {/*  <div style={labelStyle}>4. Global Adjustments</div>*/}
      {/*  <div style={{ marginBottom: 10 }}>*/}
      {/*    <label style={sliderLabel}>*/}
      {/*      Rotation scatter <span style={{ color: 'var(--ink)' }}>{rotVariance}°</span>*/}
      {/*    </label>*/}
      {/*    <input type="range" min={0} max={25} value={rotVariance}*/}
      {/*      onChange={e => onRotChange(Number(e.target.value))} />*/}
      {/*  </div>*/}
      {/*  <div>*/}
      {/*    <label style={sliderLabel}>*/}
      {/*      Item scale <span style={{ color: 'var(--ink)' }}>{Math.round(globalScale * 100)}%</span>*/}
      {/*    </label>*/}
      {/*    <input type="range" min={40} max={115} value={Math.round(globalScale * 100)}*/}
      {/*      onChange={e => onScaleChange(Number(e.target.value))} />*/}
      {/*  </div>*/}
      {/*</div>*/}

      {/* GENERATE */}
      <div style={{ ...sectionStyle, borderBottom: 'none', marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onGenerate}
            disabled={images.length === 0}
            style={primaryBtn(images.length === 0)}
          >
            Generate →
          </button>
          <button onClick={onClear} style={secondaryBtn}>
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}

function LayoutCard({ layout, active, onClick }: { layout: typeof LAYOUTS[0], active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={layout.name}
      style={{
        padding: '6px 4px', border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 5, cursor: 'pointer', textAlign: 'center',
        background: active ? '#FEF9F6' : 'var(--bg)',
        transition: 'all .15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <span style={{ fontSize: 14 }}>{layout.icon}</span>
      <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.6, color: active ? 'var(--accent)' : 'var(--muted)', lineHeight: 1.3 }}>
        {layout.name}
      </span>
    </button>
  )
}

// Styles
const sectionStyle: React.CSSProperties = {
  padding: 14, borderBottom: '1px solid var(--border)',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5,
  color: 'var(--muted)', marginBottom: 9, display: 'block',
}
const sliderLabel: React.CSSProperties = {
  fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase',
  letterSpacing: 0.7, display: 'flex', justifyContent: 'space-between', marginBottom: 4,
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    flex: 1, padding: '8px 4px',
    background: disabled ? 'var(--border)' : 'var(--ink)',
    color: disabled ? 'var(--muted)' : 'var(--bg)',
    border: 'none', borderRadius: 5,
    fontFamily: "'DM Mono', monospace", fontSize: 10,
    textTransform: 'uppercase', letterSpacing: 0.7,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

// ── Shared color picker component ─────────────────────────────────────────
const QUICK_COLORS = [
  '#FFFFFF', '#F5F0E8', '#FAFAFA', '#F5E8F0',
  '#E8EFF5', '#EEF5EE', '#1A1714', '#2D2D2D',
]

function ColorPicker({ color, onChange, label }: { color: string; onChange: (c: string) => void; label?: string }) {
  return (
    <div>
      {/* Quick swatches */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {QUICK_COLORS.map(qc => (
          <div
            key={qc}
            title={qc}
            onClick={() => onChange(qc)}
            style={{
              width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
              background: qc,
              border: `2px solid ${color === qc ? 'var(--accent)' : qc === '#FFFFFF' || qc === '#FAFAFA' ? '#ccc' : 'transparent'}`,
              outline: color === qc ? '2px solid var(--accent)' : 'none',
              outlineOffset: 1,
              transition: 'outline .12s',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
      {/* Color picker + hex input row */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: color === 'transparent'
              ? 'repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 0 0/8px 8px'
              : color,
            border: '1px solid var(--border)', cursor: 'pointer',
          }} />
          <input
            type="color"
            value={color === 'transparent' ? '#ffffff' : color}
            onChange={e => onChange(e.target.value)}
            style={{
              position: 'absolute', inset: 0, opacity: 0,
              width: '100%', height: '100%', cursor: 'pointer',
              padding: 0, border: 'none',
            }}
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
            const v = e.target.value
            if (v !== 'transparent' && !/^#[0-9A-Fa-f]{6}$/.test(v)) onChange('#FFFFFF')
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
          title="Transparent"
          onClick={() => onChange('transparent')}
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

export { ColorPicker }

const secondaryBtn: React.CSSProperties = {
  flex: 1, padding: '8px 4px',
  background: 'var(--bg)', color: 'var(--ink)',
  border: '1px solid var(--border)', borderRadius: 5,
  fontFamily: "'DM Mono', monospace", fontSize: 10,
  textTransform: 'uppercase', letterSpacing: 0.7,
  cursor: 'pointer',
}

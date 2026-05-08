'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'

interface Props {
  imageSrc: string
  onClose: () => void
  onComplete: (dataUrl: string) => void
}

const ASPECTS: { label: string; value: number }[] = [
  { label: '1:1',  value: 1 },
  { label: '4:5',  value: 4 / 5 },
  { label: '4:3',  value: 4 / 3 },
  { label: '3:4',  value: 3 / 4 },
]

export default function CropModal({ imageSrc, onClose, onComplete }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(1)
  const [croppedPx, setCroppedPx] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedPx(pixels)
  }, [])

  async function handleSave() {
    if (!croppedPx) return
    setBusy(true)
    try {
      const dataUrl = await cropToDataUrl(imageSrc, croppedPx)
      onComplete(dataUrl)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={sLabel}>Crop image</div>
            <div style={{ fontSize: 10, color: '#7A7066', marginTop: 2 }}>
              Drag to reposition · pinch / wheel to zoom · saving replaces the original
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={cropperWrap}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            showGrid={true}
          />
        </div>

        <div style={{ marginTop: 14, marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: '#7A7066', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>Aspect</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {ASPECTS.map(a => (
              <button
                key={a.label}
                onClick={() => setAspect(a.value)}
                style={aspectBtn(aspect === a.value)}
              >{a.label}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: '#7A7066', textTransform: 'uppercase', letterSpacing: 0.7, display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Zoom</span><span style={{ color: '#1A1714' }}>{zoom.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min={1} max={4} step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#4A7C6F' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={busy || !croppedPx}
            style={saveBtn(busy || !croppedPx)}
          >
            {busy ? 'Saving…' : '✓ Save crop'}
          </button>
        </div>

        <p style={{ fontSize: 9, color: '#7A7066', marginTop: 10, lineHeight: 1.6, textAlign: 'center' }}>
          Crop is destructive — if BG was removed, you'll need to re-run it after cropping
        </p>
      </div>
    </div>
  )
}

async function cropToDataUrl(src: string, area: Area): Promise<string> {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(area.width)
  canvas.height = Math.round(area.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    img,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height,
  )
  return canvas.toDataURL('image/png', 1.0)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1100,
  background: 'rgba(26,23,20,0.78)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 24, fontFamily: "'DM Mono', monospace",
}
const modal: React.CSSProperties = {
  background: '#FDFAF5', borderRadius: 14,
  padding: 22, width: '100%', maxWidth: 560,
  boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
}
const cropperWrap: React.CSSProperties = {
  position: 'relative', width: '100%', height: 360,
  background: '#1A1714', borderRadius: 8, overflow: 'hidden',
}
const sLabel: React.CSSProperties = {
  fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, color: '#7A7066',
}
const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 14, color: '#7A7066', padding: '4px 8px', borderRadius: 5,
  fontFamily: "'DM Mono', monospace", lineHeight: 1,
}
function aspectBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: '6px 4px',
    background: active ? '#1A1714' : '#FDFAF5',
    color: active ? '#FDFAF5' : '#7A7066',
    border: `1px solid ${active ? '#1A1714' : '#DDD8CE'}`,
    borderRadius: 4,
    fontFamily: "'DM Mono', monospace", fontSize: 10,
    cursor: 'pointer', letterSpacing: 0.5,
  }
}
function saveBtn(disabled: boolean): React.CSSProperties {
  return {
    flex: 2, padding: '10px 14px',
    background: disabled ? '#DDD8CE' : '#1A1714',
    color: disabled ? '#7A7066' : '#FDFAF5',
    border: 'none', borderRadius: 6,
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
const cancelBtn: React.CSSProperties = {
  flex: 1, padding: '10px 14px',
  background: '#FDFAF5', color: '#7A7066',
  border: '1px solid #DDD8CE', borderRadius: 6,
  fontFamily: "'DM Mono', monospace", fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1,
  cursor: 'pointer',
}

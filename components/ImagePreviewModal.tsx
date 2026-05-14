'use client'

import { useState } from 'react'
import { ProductImage, ShadowMode } from '@/lib/types'
import CropModal from './CropModal'

interface Props {
  image: ProductImage
  onClose: () => void
  onRemoveBg: (id: string, shadowMode: ShadowMode) => void
  onToggleBgRemove: (id: string) => void
  onCropImage: (id: string, dataUrl: string) => void | Promise<void>
  limitReached?: boolean
}

const SHADOW_OPTIONS: { value: ShadowMode; label: string; desc: string }[] = [
  { value: 'none',        label: 'No shadow',    desc: 'Clean cut-out, no shadow' },
  { value: 'ai.soft',    label: 'Soft shadow',   desc: 'Gentle diffused shadow — great for flat lays' },
  { value: 'ai.hard',    label: 'Hard shadow',   desc: 'Sharp, defined shadow — strong contrast' },
  { value: 'ai.floating',label: 'Floating',      desc: 'Shadow beneath as if hovering' },
]

export default function ImagePreviewModal({
  image, onClose, onRemoveBg, onToggleBgRemove, onCropImage, limitReached = false,
}: Props) {
  const [shadowMode, setShadowMode] = useState<ShadowMode>(image.shadowMode ?? 'none')
  const [cropOpen, setCropOpen] = useState(false)
  const hasClean = !!image.cleanDataUrl
  const isProcessing = image.bgRemoving

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26,23,20,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: "'DM Mono', monospace",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FDFAF5', borderRadius: 14,
          padding: 24, width: '100%',
          maxWidth: hasClean ? 640 : 420,
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={sLabel}>Image Preview</div>
            <div style={{ fontSize: 10, color: '#7A7066', marginTop: 2 }}>
              {hasClean
                ? 'Click a version to set it active in your layout'
                : 'Choose shadow style then remove background'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#1A1714' }}>
            <button onClick={() => setCropOpen(true)} style={cropActionBtn} title="Crop image">
              ✂ Crop
            </button>
            <button onClick={onClose} style={closeBtn}>✕</button>
          </div>
        </div>

        {!hasClean ? (
          <div>
            {/* Image preview */}
            <div style={{ ...imgWrap('#f8f8f8'), marginBottom: 16 }}>
              <img src={image.dataUrl} alt="Product" style={imgStyle} />
            </div>

            {/* ── SHADOW OPTIONS — above the button ── */}
            <div style={{
              border: '1px solid #DDD8CE', borderRadius: 8,
              padding: 12, marginBottom: 14, background: '#F8F6F2',
            }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2, color: '#7A7066', marginBottom: 10 }}>
                Shadow style (applied by PhotoRoom AI)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SHADOW_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      cursor: 'pointer', padding: '7px 10px',
                      borderRadius: 6, transition: 'background .12s',
                      background: shadowMode === opt.value ? '#FDFAF5' : 'transparent',
                      border: `1px solid ${shadowMode === opt.value ? '#4A7C6F' : 'transparent'}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="shadow"
                      value={opt.value}
                      checked={shadowMode === opt.value}
                      onChange={() => setShadowMode(opt.value)}
                      style={{ accentColor: '#4A7C6F', width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#1A1714' }}>{opt.label}</div>
                      <div style={{ fontSize: 10, color: '#7A7066', marginTop: 1 }}>{opt.desc}</div>
                    </div>
                    {opt.value !== 'none' && (
                      <span style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 10,
                        background: '#E1F5EE', color: '#4A7C6F',
                        textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>
                        Plus plan
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Remove BG button / limit warning */}
            {limitReached ? (
              <div style={limitWarning}>
                Daily limit reached — come back tomorrow to remove more backgrounds.
              </div>
            ) : (
              <button
                onClick={() => onRemoveBg(image.id, shadowMode)}
                disabled={isProcessing}
                style={removeBgBtn(isProcessing)}
              >
                {isProcessing ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span className="modal-spin" style={spinnerStyle} />
                    {shadowMode !== 'none' ? 'Removing background & adding shadow…' : 'Removing background…'}
                  </span>
                ) : shadowMode !== 'none'
                  ? `✂  Remove BG + ${SHADOW_OPTIONS.find(o => o.value === shadowMode)?.label}`
                  : '✂  Remove Background'
                }
              </button>
            )}

            {image.bgError && (
              <div style={{ marginTop: 8, padding: '7px 10px', background: '#FEF2F2', borderRadius: 5, fontSize: 10, color: '#DC2626' }}>
                ⚠ {image.bgError}
                {image.bgError.includes('403') || image.bgError.includes('401') ? (
                  <span style={{ display: 'block', marginTop: 4, color: '#7A7066' }}>
                    Check your PHOTOROOM_API_KEY in .env.local
                  </span>
                ) : shadowMode !== 'none' && (
                  <span style={{ display: 'block', marginTop: 4, color: '#7A7066' }}>
                    Shadow requires PhotoRoom Plus plan. Try "No shadow" with the Basic plan.
                  </span>
                )}
              </div>
            )}

            <p style={{ fontSize: 9, color: '#7A7066', marginTop: 10, lineHeight: 1.6, textAlign: 'center' }}>
              Original is always preserved · toggle between versions anytime
            </p>
          </div>
        ) : (
          /* ── Before / After comparison ── */
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <VersionCard
                label="Original"
                url={image.dataUrl}
                isActive={!image.bgRemoved}
                bgStyle={{ background: '#f8f8f8' }}
                onClick={() => image.bgRemoved && onToggleBgRemove(image.id)}
              />
              <VersionCard
                label={image.shadowMode !== 'none'
                  ? `BG Removed + ${SHADOW_OPTIONS.find(o => o.value === image.shadowMode)?.label ?? 'Shadow'}`
                  : 'BG Removed'}
                url={image.cleanDataUrl!}
                isActive={image.bgRemoved}
                bgStyle={{ backgroundImage: 'repeating-conic-gradient(#e8e8e8 0% 25%, #fff 0% 50%) 0 0 / 10px 10px' }}
                onClick={() => !image.bgRemoved && onToggleBgRemove(image.id)}
              />
            </div>

            <div style={{ fontSize: 9, color: '#7A7066', textAlign: 'center', marginBottom: 14, lineHeight: 1.5 }}>
              {image.bgRemoved
                ? '✓ Using clean version in layout — click Original to switch'
                : '✓ Using original — click BG Removed to switch'}
            </div>

            {/* Re-process with different shadow */}
            <div style={{ borderTop: '1px solid #DDD8CE', paddingTop: 12 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: '#7A7066', marginBottom: 8 }}>
                Re-process with different shadow
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {SHADOW_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setShadowMode(opt.value)}
                    style={{
                      padding: '5px 10px', borderRadius: 20,
                      border: `1px solid ${shadowMode === opt.value ? '#4A7C6F' : '#DDD8CE'}`,
                      background: shadowMode === opt.value ? '#F0F7F5' : '#FDFAF5',
                      color: shadowMode === opt.value ? '#4A7C6F' : '#7A7066',
                      fontFamily: "'DM Mono', monospace", fontSize: 10,
                      cursor: 'pointer', transition: 'all .15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {limitReached ? (
                <div style={limitWarning}>
                  Daily limit reached — come back tomorrow to re-process.
                </div>
              ) : (
                <button
                  onClick={() => onRemoveBg(image.id, shadowMode)}
                  disabled={isProcessing}
                  style={{
                    width: '100%', padding: '8px', border: '1px solid #DDD8CE',
                    background: isProcessing ? '#F5F0E8' : '#FDFAF5',
                    borderRadius: 6, fontFamily: "'DM Mono', monospace",
                    fontSize: 10, cursor: isProcessing ? 'not-allowed' : 'pointer',
                    color: '#7A7066', textTransform: 'uppercase', letterSpacing: 0.5,
                  }}
                >
                  {isProcessing ? '⏳ Processing…' : '↺ Re-process'}
                </button>
              )}
            </div>
          </div>
        )}

        <style>{`
          .modal-spin { animation: mspin .7s linear infinite; }
          @keyframes mspin { to { transform: rotate(360deg); } }
        `}</style>
      </div>

      {cropOpen && (
        <CropModal
          imageSrc={image.dataUrl}
          onClose={() => setCropOpen(false)}
          onComplete={async dataUrl => {
            await onCropImage(image.id, dataUrl)
            setCropOpen(false)
          }}
        />
      )}
    </div>
  )
}

function VersionCard({
  label, url, isActive, bgStyle, onClick,
}: {
  label: string; url: string; isActive: boolean
  bgStyle: React.CSSProperties; onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 10,
        border: `2.5px solid ${isActive ? '#4A7C6F' : '#DDD8CE'}`,
        overflow: 'hidden',
        cursor: isActive ? 'default' : 'pointer',
        transition: 'border-color .15s',
        position: 'relative',
      }}
      className={isActive ? '' : 'version-card-hover'}
    >
      {isActive && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 22, height: 22, borderRadius: '50%',
          background: '#4A7C6F', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}>✓</div>
      )}
      <div style={{ ...bgStyle, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
        <img src={url} alt={label} style={{ maxWidth: '100%', maxHeight: 160, objectFit: 'contain', display: 'block' }} />
      </div>
      <div style={{
        padding: '6px 10px',
        background: isActive ? '#F0F7F5' : '#f8f8f8',
        borderTop: `1px solid ${isActive ? '#4A7C6F' : '#DDD8CE'}`,
        fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.6,
        color: isActive ? '#4A7C6F' : '#7A7066', textAlign: 'center',
        fontWeight: isActive ? 600 : 400,
      }}>
        {isActive ? `✓ ${label}` : label}
      </div>
      <style>{`.version-card-hover:hover { border-color: #1A1714 !important; }`}</style>
    </div>
  )
}

const sLabel: React.CSSProperties = {
  fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, color: '#7A7066',
}
const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 14, color: '#7A7066', padding: '4px 8px', borderRadius: 5,
  fontFamily: "'DM Mono', monospace", lineHeight: 1,
}
const cropActionBtn: React.CSSProperties = {
  background: '#1A1714', border: '1px solid #1A1714',
  cursor: 'pointer', fontSize: 10, color: '#FDFAF5',
  padding: '6px 10px', borderRadius: 5,
  fontFamily: "'DM Mono', monospace",
  textTransform: 'uppercase', letterSpacing: 0.6,
}
function imgWrap(bg: string): React.CSSProperties {
  return { borderRadius: 8, overflow: 'hidden', border: '1px solid #DDD8CE', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }
}
const imgStyle: React.CSSProperties = { maxWidth: '100%', maxHeight: 280, objectFit: 'contain', display: 'block' }

function removeBgBtn(disabled: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '12px 16px',
    background: disabled ? '#DDD8CE' : '#1A1714',
    color: disabled ? '#7A7066' : '#FDFAF5',
    border: 'none', borderRadius: 8,
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 1,
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background .15s',
  }
}
const limitWarning: React.CSSProperties = {
  width: '100%', padding: '12px 16px', boxSizing: 'border-box',
  background: '#FEF3C7', border: '1px solid #F59E0B',
  borderRadius: 8, fontSize: 11, color: '#92400E',
  textAlign: 'center', lineHeight: 1.5,
}
const spinnerStyle: React.CSSProperties = {
  display: 'inline-block', width: 14, height: 14,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff', borderRadius: '50%',
}

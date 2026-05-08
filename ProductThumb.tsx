'use client'

import { ProductImage } from '@/lib/types'

interface Props {
  image: ProductImage
  index: number
  isBackground?: boolean
  onRemove: (id: string) => void
  onPreview: (id: string) => void
}

export default function ProductThumb({ image, index, isBackground, onRemove, onPreview }: Props) {
  const isHero = index === 0
  const activeUrl = image.bgRemoved && image.cleanDataUrl ? image.cleanDataUrl : image.dataUrl

  const borderColor = isBackground ? '#7C3AED' : isHero ? '#F59E0B' : image.bgRemoved ? '#4A7C6F' : '#DDD8CE'

  return (
    <div
      onClick={() => onPreview(image.id)}
      style={{
        position: 'relative',
        borderRadius: 7,
        border: `2px solid ${borderColor}`,
        cursor: 'pointer',
        transition: 'border-color .15s, transform .1s',
        flexShrink: 0,
      }}
      className="product-thumb"
    >
      {/* Image area */}
      <div style={{
        aspectRatio: '1',
        borderRadius: 5,
        overflow: 'hidden',
        background: image.bgRemoved ? undefined : '#f8f8f8',
        backgroundImage: image.bgRemoved
          ? 'repeating-conic-gradient(#e8e8e8 0% 25%, #fff 0% 50%) 0 0 / 8px 8px'
          : undefined,
      }}>
        <img
          src={activeUrl}
          alt={`Product ${index + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          draggable={false}
        />
      </div>

      {/* Spinner overlay while processing */}
      {image.bgRemoving && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 5,
          background: 'rgba(255,255,255,0.88)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 5, zIndex: 3,
        }}>
          <div className="spin" style={{
            width: 20, height: 20,
            border: '2px solid #DDD8CE', borderTopColor: '#4A7C6F', borderRadius: '50%',
          }} />
          <span style={{ fontSize: 8, color: '#4A7C6F', letterSpacing: 0.5 }}>Removing…</span>
        </div>
      )}

      {/* Hover magnifier overlay */}
      <div className="thumb-hover" style={{
        position: 'absolute', inset: 0, borderRadius: 5,
        background: 'rgba(26,23,20,0.42)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0, transition: 'opacity .15s', zIndex: 2,
      }}>
        <span style={{ fontSize: 20, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}>🔍</span>
      </div>

      {/* Hero badge — bottom left */}
      {isHero && !isBackground && (
        <div style={{
          position: 'absolute', bottom: -1, left: -1,
          background: '#F59E0B', color: '#fff',
          fontSize: 7, fontWeight: 700, padding: '1px 5px',
          borderRadius: '0 4px 0 5px', textTransform: 'uppercase', letterSpacing: 0.8, zIndex: 4,
        }}>Hero</div>
      )}

      {/* Background badge — top left */}
      {isBackground && (
        <div style={{
          position: 'absolute', top: -1, left: -1,
          background: '#7C3AED', color: '#fff',
          fontSize: 7, fontWeight: 700, padding: '1px 5px',
          borderRadius: '4px 0 5px 0', textTransform: 'uppercase', letterSpacing: 0.8, zIndex: 4,
        }} title="Used as canvas background">BG</div>
      )}

      {/* BG removed badge — bottom right */}
      {image.bgRemoved && !image.bgRemoving && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          background: '#4A7C6F', color: '#fff',
          fontSize: 9, padding: '1px 5px',
          borderRadius: '4px 0 5px 0', zIndex: 4,
        }} title="Background removed">✂</div>
      )}

      {/* Error dot */}
      {image.bgError && !image.bgRemoving && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          background: '#DC2626', color: '#fff',
          fontSize: 9, padding: '1px 6px',
          borderRadius: '4px 0 5px 0', zIndex: 4,
        }} title={image.bgError}>!</div>
      )}

      {/* Delete × — top right corner, appears on hover */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(image.id) }}
        className="thumb-delete"
        title="Remove image"
        style={{
          position: 'absolute', top: -8, right: -8,
          width: 18, height: 18,
          background: '#1A1714', color: '#fff',
          border: '2px solid #FDFAF5',
          borderRadius: '50%', fontSize: 10, lineHeight: 1,
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 5, opacity: 0, transition: 'opacity .15s, background .15s',
          fontFamily: 'monospace', padding: 0,
        }}
      >×</button>

      <style>{`
        .product-thumb:hover { transform: scale(1.04); z-index: 1; }
        .product-thumb:hover .thumb-hover { opacity: 1 !important; }
        .product-thumb:hover .thumb-delete { opacity: 1 !important; }
        .thumb-delete:hover { background: #DC2626 !important; }
        .spin { animation: tspin .7s linear infinite; }
        @keyframes tspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

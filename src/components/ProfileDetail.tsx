import { useRef, useState } from 'react'
import { lastSeenLabel } from '../data'
import type { Profile } from '../types'
import { IconCheck, IconPin } from './Icons'

/** Galerie (Scroll-Snap, Wisch/Trackpad/Tastatur) + Infos. Wird als Seitenpanel (Desktop) und Sheet (Mobil) benutzt. */
export function ProfileDetail({ p, actions }: { p: Profile; actions?: React.ReactNode }) {
  const [idx, setIdx] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const go = (i: number) => {
    const el = ref.current
    if (!el) return
    const n = Math.max(0, Math.min(p.photos.length - 1, i))
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <article className="detail">
      <div className="gallery-wrap">
        <div
          className="gallery"
          ref={ref}
          tabIndex={0}
          aria-label={`Fotos von ${p.name}`}
          onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(idx + 1)
            if (e.key === 'ArrowLeft') go(idx - 1)
          }}
        >
          {p.photos.map((src, i) => (
            <img key={i} src={src} alt={`${p.name}, Foto ${i + 1}`} loading="lazy" draggable={false} />
          ))}
        </div>
        <div className="dots">
          {p.photos.map((_, i) => (
            <button key={i} className={i === idx ? 'on' : ''} aria-label={`Foto ${i + 1}`} onClick={() => go(i)} />
          ))}
        </div>
      </div>
      <div className="detail-body">
        <h2>
          {p.name}, {p.age}
          {p.verified && (
            <span className="verified" title="Verifiziert">
              <IconCheck width={14} height={14} strokeWidth={3} />
            </span>
          )}
        </h2>
        <p className="muted row">
          <IconPin width={16} height={16} /> {p.city} · {p.distanceKm} km entfernt
        </p>
        <p className="muted">
          <span className={`status ${p.online ? 'on' : ''}`} /> {lastSeenLabel(p)} · {p.job}
        </p>
        <h3>Über mich</h3>
        <p>{p.bio}</p>
        <h3>Interessen</h3>
        <div className="chips">
          {p.interests.map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
        {actions && <div className="detail-actions">{actions}</div>}
      </div>
    </article>
  )
}

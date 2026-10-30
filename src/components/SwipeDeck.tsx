import { useCallback, useEffect, useRef, useState } from 'react'
import { lastSeenLabel } from '../data'
import type { Profile, SwipeKind } from '../types'
import { IconHeart, IconInfo, IconStar, IconUndo, IconX } from './Icons'

interface Props {
  queue: Profile[]
  canUndo: boolean
  onSwipe: (id: string, kind: SwipeKind) => void
  onUndo: () => void
  onInfo: () => void
}

const THRESHOLD = 110
const FLY_MS = 280

export function SwipeDeck({ queue, canUndo, onSwipe, onUndo, onInfo }: Props) {
  const top = queue[0]
  const visible = queue.slice(0, 3)
  const deckRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const [photoIdx, setPhotoIdx] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const gesture = useRef<{ x: number; y: number; t: number; moved: boolean } | null>(null)

  // Nächste Fotos vorladen, damit beim Swipen nichts nachlädt/flackert
  useEffect(() => {
    queue.slice(0, 4).forEach((p) => p.photos.slice(0, 2).forEach((src) => { const i = new Image(); i.src = src }))
  }, [queue])

  const setVars = (dx: number, dy: number) => {
    const el = topRef.current
    const deck = deckRef.current
    if (!el || !deck) return
    const w = deck.clientWidth || 360
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${(dx / w) * 14}deg)`
    const like = Math.max(0, Math.min(1, dx / THRESHOLD))
    const nope = Math.max(0, Math.min(1, -dx / THRESHOLD))
    const sup = Math.max(0, Math.min(1, -dy / THRESHOLD)) * (1 - Math.max(like, nope))
    el.style.setProperty('--p-like', String(like))
    el.style.setProperty('--p-nope', String(nope))
    el.style.setProperty('--p-super', String(sup))
    deck.style.setProperty('--prog', String(Math.min(1, Math.hypot(dx, dy) / THRESHOLD)))
  }

  const commit = useCallback(
    (kind: SwipeKind) => {
      const el = topRef.current
      const deck = deckRef.current
      if (!top || busy || !el || !deck) return
      setBusy(true)
      const w = deck.clientWidth || 360
      const h = deck.clientHeight || 500
      const tx = kind === 'like' ? w * 1.4 : kind === 'nope' ? -w * 1.4 : 0
      const ty = kind === 'super' ? -h * 1.3 : 40
      el.style.transition = `transform ${FLY_MS}ms cubic-bezier(.2,.7,.2,1)`
      deck.style.setProperty('--prog', '1')
      const rot = kind === 'like' ? 18 : kind === 'nope' ? -18 : 0
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg)`
      el.style.setProperty('--p-like', kind === 'like' ? '1' : '0')
      el.style.setProperty('--p-nope', kind === 'nope' ? '1' : '0')
      el.style.setProperty('--p-super', kind === 'super' ? '1' : '0')
      window.setTimeout(() => {
        onSwipe(top.id, kind)
        deck.style.setProperty('--prog', '0')
        setBusy(false)
      }, FLY_MS)
    },
    [top, busy, onSwipe]
  )

  // Tastatur für Desktop: ← Nope, → Like, ↑ Super, Z Zurück, I Infos
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable]')) return
      if (e.key === 'ArrowLeft') commit('nope')
      else if (e.key === 'ArrowRight') commit('like')
      else if (e.key === 'ArrowUp') commit('super')
      else if (e.key.toLowerCase() === 'z') onUndo()
      else if (e.key.toLowerCase() === 'i') onInfo()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [commit, onUndo, onInfo])

  const down = (e: React.PointerEvent) => {
    if (busy || !topRef.current) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    topRef.current.style.transition = 'none'
    gesture.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false }
  }
  const move = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g) return
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (Math.hypot(dx, dy) > 6) g.moved = true
    if (g.moved) setVars(dx, dy)
  }
  const up = (e: React.PointerEvent) => {
    const g = gesture.current
    gesture.current = null
    const el = topRef.current
    if (!g || !el || !top) return
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    const vx = dx / Math.max(1, performance.now() - g.t)
    if (!g.moved) {
      // Tippen: links/rechts blättert durch die Fotos wie bei Tinder
      const rect = el.getBoundingClientRect()
      const left = e.clientX - rect.left < rect.width / 2
      const cur = photoIdx[top.id] ?? 0
      const next = Math.max(0, Math.min(top.photos.length - 1, cur + (left ? -1 : 1)))
      setPhotoIdx((m) => ({ ...m, [top.id]: next }))
      return
    }
    if (dx > THRESHOLD || (vx > 0.6 && dx > 40)) commit('like')
    else if (dx < -THRESHOLD || (vx < -0.6 && dx < -40)) commit('nope')
    else if (dy < -THRESHOLD * 1.2) commit('super')
    else {
      el.style.transition = 'transform .3s cubic-bezier(.2,.9,.3,1.3)'
      setVars(0, 0)
    }
  }

  if (!top) {
    return (
      <div className="empty">
        <div className="empty-icon">✨</div>
        <h2>Gerade ist niemand mehr in der Nähe</h2>
        <p className="muted">Ändere deine Filter oder schau später nochmal vorbei.</p>
        {canUndo && (
          <button className="btn ghost" onClick={onUndo}>
            <IconUndo width={18} height={18} /> Letzten Swipe zurücknehmen
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="deck-wrap">
      <div className="deck" ref={deckRef}>
        {visible
          .map((p, i) => ({ p, i }))
          .reverse()
          .map(({ p, i }) => {
            const idx = Math.min(photoIdx[p.id] ?? 0, p.photos.length - 1)
            return (
              <div
                key={p.id}
                ref={i === 0 ? topRef : undefined}
                className={`card depth-${i}`}
                onPointerDown={i === 0 ? down : undefined}
                onPointerMove={i === 0 ? move : undefined}
                onPointerUp={i === 0 ? up : undefined}
                onPointerCancel={i === 0 ? up : undefined}
              >
                <img src={p.photos[idx]} alt={`${p.name}, Foto ${idx + 1}`} draggable={false} />
                <div className="bars">
                  {p.photos.map((_, k) => (
                    <i key={k} className={k <= idx ? 'on' : ''} />
                  ))}
                </div>
                <span className="stamp like">LIKE</span>
                <span className="stamp nope">NOPE</span>
                <span className="stamp super">SUPER</span>
                <div className="card-info">
                  <div>
                    <h2>
                      {p.name} <span className="age">{p.age}</span>
                      <span className={`status ${p.online ? 'on' : ''}`} title={lastSeenLabel(p)} />
                    </h2>
                    <p>
                      {p.distanceKm} km · {p.city}
                    </p>
                    <div className="chips small">
                      {p.interests.slice(0, 3).map((t) => (
                        <span key={t} className="chip glass">{t}</span>
                      ))}
                    </div>
                  </div>
                  <button className="info-btn" aria-label="Profil ansehen" onPointerDown={(e) => e.stopPropagation()} onClick={onInfo}>
                    <IconInfo />
                  </button>
                </div>
              </div>
            )
          })}
      </div>
      <div className="actions">
        <button className="round small" aria-label="Zurück (Z)" disabled={!canUndo} onClick={onUndo} title="Zurück (Z)">
          <IconUndo />
        </button>
        <button className="round big nope" aria-label="Nope (←)" onClick={() => commit('nope')} title="Nope (←)">
          <IconX width={30} height={30} strokeWidth={3} />
        </button>
        <button className="round small super" aria-label="Super Like (↑)" onClick={() => commit('super')} title="Super Like (↑)">
          <IconStar />
        </button>
        <button className="round big like" aria-label="Like (→)" onClick={() => commit('like')} title="Like (→)">
          <IconHeart width={30} height={30} strokeWidth={2.6} />
        </button>
      </div>
      <p className="hint">← Nope · → Like · ↑ Super Like · Z Zurück · I Profil</p>
    </div>
  )
}

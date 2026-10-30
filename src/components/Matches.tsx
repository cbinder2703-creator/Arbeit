import { useEffect, useRef, useState } from 'react'
import { PROFILE_BY_ID, lastSeenLabel } from '../data'
import { actions, useStore } from '../store'
import { IconBack, IconSend } from './Icons'

function timeLabel(at: number) {
  const d = new Date(at)
  const today = new Date()
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

/** Liste + Chat. Auf breiten Screens nebeneinander, mobil als Drill-down. */
export function Matches({ activeId, onSelect }: { activeId: string | null; onSelect: (id: string | null) => void }) {
  const matches = useStore((s) => s.matches)
  const sorted = [...matches].sort((a, b) => (b.messages.at(-1)?.at ?? b.at) - (a.messages.at(-1)?.at ?? a.at))
  const fresh = matches.filter((m) => m.messages.length === 0)
  const active = matches.find((m) => m.profileId === activeId)

  return (
    <section className={`split ${active ? 'has-chat' : ''}`}>
      <div className="split-list">
        <header className="page-head">
          <h1>Matches</h1>
        </header>
        {matches.length === 0 && <p className="muted pad">Noch keine Matches. Swipe dich durch Entdecken oder sag in „In der Nähe“ direkt Hallo.</p>}
        {fresh.length > 0 && (
          <>
            <h3 className="label">Neue Matches</h3>
            <div className="strip">
              {fresh.map((m) => {
                const p = PROFILE_BY_ID[m.profileId]
                return (
                  <button key={m.profileId} className="story" onClick={() => onSelect(m.profileId)}>
                    <img src={p.photos[0]} alt="" draggable={false} />
                    <span>{p.name}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
        {sorted.some((m) => m.messages.length > 0) && <h3 className="label">Nachrichten</h3>}
        <ul className="convs">
          {sorted
            .filter((m) => m.messages.length > 0)
            .map((m) => {
              const p = PROFILE_BY_ID[m.profileId]
              const last = m.messages.at(-1)!
              return (
                <li key={m.profileId}>
                  <button className={`conv ${m.profileId === activeId ? 'on' : ''}`} onClick={() => onSelect(m.profileId)}>
                    <span className="avatar">
                      <img src={p.photos[0]} alt="" draggable={false} />
                      <span className={`status ${p.online ? 'on' : ''}`} />
                    </span>
                    <span className="conv-main">
                      <strong>{p.name}</strong>
                      <small className={m.unread ? 'unread' : ''}>{last.from === 'me' ? 'Du: ' : ''}{last.text}</small>
                    </span>
                    <span className="conv-meta">
                      <small>{timeLabel(last.at)}</small>
                      {m.unread > 0 && <b className="count">{m.unread}</b>}
                    </span>
                  </button>
                </li>
              )
            })}
        </ul>
      </div>
      <div className="split-chat">
        {active ? <Chat key={active.profileId} id={active.profileId} onBack={() => onSelect(null)} /> : <div className="empty hide-mobile"><div className="empty-icon">💬</div><p className="muted">Wähle ein Match, um zu chatten.</p></div>}
      </div>
    </section>
  )
}

function Chat({ id, onBack }: { id: string; onBack: () => void }) {
  const match = useStore((s) => s.matches.find((m) => m.profileId === id))
  const p = PROFILE_BY_ID[id]
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const count = match?.messages.length ?? 0

  useEffect(() => {
    actions.markRead(id)
  }, [id, count])
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [count])

  if (!match) return null
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    actions.send(id, text)
    setText('')
  }

  return (
    <div className="chat">
      <header className="chat-head">
        <button className="icon-btn show-mobile" onClick={onBack} aria-label="Zurück">
          <IconBack />
        </button>
        <span className="avatar">
          <img src={p.photos[0]} alt="" draggable={false} />
          <span className={`status ${p.online ? 'on' : ''}`} />
        </span>
        <div>
          <strong>{p.name}, {p.age}</strong>
          <small className="muted block">{lastSeenLabel(p)} · {p.distanceKm} km</small>
        </div>
      </header>
      <div className="msgs" role="log" aria-live="polite">
        {count === 0 && (
          <div className="icebreak">
            <p className="muted">Ihr habt gematcht! Mach den ersten Schritt:</p>
            {['Hey 👋', `Hi ${p.name}, was machst du am liebsten am Wochenende?`, 'Kaffee oder Drink? ☕🍸'].map((t) => (
              <button key={t} className="chip click" onClick={() => actions.send(id, t)}>{t}</button>
            ))}
          </div>
        )}
        {match.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.from}`}>
            {m.text}
            <time>{timeLabel(m.at)}</time>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="composer" onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nachricht schreiben…" aria-label="Nachricht" autoComplete="off" />
        <button className="send" type="submit" disabled={!text.trim()} aria-label="Senden">
          <IconSend />
        </button>
      </form>
    </div>
  )
}

import { useState } from 'react'
import type { Filters, Gender } from '../types'

const G: [Gender, string][] = [['f', 'Frauen'], ['m', 'Männer'], ['d', 'Divers']]

export function FilterSheet({ value, onApply, onClose }: { value: Filters; onApply: (f: Filters) => void; onClose: () => void }) {
  const [f, setF] = useState(value)
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Filter" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2>Filter</h2>
        <label className="range">
          <span>Alter <b>{f.minAge}–{f.maxAge}</b></span>
          <input type="range" min={18} max={60} value={f.minAge} onChange={(e) => setF({ ...f, minAge: Math.min(Number(e.target.value), f.maxAge) })} aria-label="Mindestalter" />
          <input type="range" min={18} max={60} value={f.maxAge} onChange={(e) => setF({ ...f, maxAge: Math.max(Number(e.target.value), f.minAge) })} aria-label="Höchstalter" />
        </label>
        <label className="range">
          <span>Entfernung <b>bis {f.maxDistance} km</b></span>
          <input type="range" min={1} max={100} value={f.maxDistance} onChange={(e) => setF({ ...f, maxDistance: Number(e.target.value) })} />
        </label>
        <h3 className="label">Anzeigen</h3>
        <div className="chips">
          {G.map(([g, l]) => (
            <button key={g} className={`chip click ${f.show.includes(g) ? 'on' : ''}`} onClick={() => setF({ ...f, show: f.show.includes(g) ? f.show.filter((x) => x !== g) : [...f.show, g] })}>{l}</button>
          ))}
        </div>
        <label className="switch">
          <input type="checkbox" checked={f.onlyOnline} onChange={(e) => setF({ ...f, onlyOnline: e.target.checked })} />
          <span>Nur online</span>
        </label>
        <div className="sheet-actions">
          <button className="btn ghost" onClick={onClose}>Abbrechen</button>
          <button className="btn" onClick={() => { onApply(f); onClose() }}>Anwenden</button>
        </div>
      </div>
    </div>
  )
}

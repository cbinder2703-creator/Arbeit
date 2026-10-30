import { useMemo, useState } from 'react'
import { lastSeenLabel } from '../data'
import type { Profile } from '../types'
import { IconFilter, IconPin } from './Icons'

type Sort = 'distance' | 'online' | 'new'

/** Lovoo-Style „In der Nähe“: dichtes, responsives Raster mit Entfernung & Online-Status. */
export function Nearby({ profiles, onOpen, onFilter }: { profiles: Profile[]; onOpen: (p: Profile) => void; onFilter: () => void }) {
  const [sort, setSort] = useState<Sort>('distance')
  const list = useMemo(() => {
    const l = [...profiles]
    if (sort === 'distance') l.sort((a, b) => a.distanceKm - b.distanceKm)
    if (sort === 'online') l.sort((a, b) => Number(b.online) - Number(a.online) || a.lastSeenMin - b.lastSeenMin)
    if (sort === 'new') l.sort((a, b) => a.joinedDaysAgo - b.joinedDaysAgo)
    return l
  }, [profiles, sort])

  return (
    <section className="page">
      <header className="page-head">
        <h1>In der Nähe</h1>
        <div className="head-tools">
        <div className="seg" role="tablist" aria-label="Sortierung">
          {([['distance', 'Nähe'], ['online', 'Online'], ['new', 'Neu']] as [Sort, string][]).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={sort === k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>
              {label}
            </button>
          ))}
        </div>
        <button className="icon-btn" onClick={onFilter} aria-label="Filter"><IconFilter /></button>
        </div>
      </header>
      {list.length === 0 && <p className="muted pad">Keine Treffer – passe die Filter an.</p>}
      <div className="grid">
        {list.map((p) => (
          <button key={p.id} className="tile" onClick={() => onOpen(p)} aria-label={`${p.name}, ${p.age}, ${p.distanceKm} Kilometer entfernt`}>
            <img src={p.photos[0]} alt="" loading="lazy" draggable={false} />
            {p.joinedDaysAgo < 7 && <span className="badge-new">NEU</span>}
            <div className="tile-info">
              <strong>
                {p.name}, {p.age}
                <span className={`status ${p.online ? 'on' : ''}`} />
              </strong>
              <small>
                <IconPin width={12} height={12} /> {p.distanceKm} km · {lastSeenLabel(p)}
              </small>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

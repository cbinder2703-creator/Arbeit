import { useCallback, useEffect, useMemo, useState } from 'react'
import { FilterSheet } from './components/FilterSheet'
import { IconChat, IconFilter, IconFlame, IconGrid, IconHeart, IconUser } from './components/Icons'
import { Matches } from './components/Matches'
import { MyProfile } from './components/MyProfile'
import { Nearby } from './components/Nearby'
import { ProfileDetail } from './components/ProfileDetail'
import { SwipeDeck } from './components/SwipeDeck'
import { PROFILES, PROFILE_BY_ID } from './data'
import { actions, useStore } from './store'
import type { Profile } from './types'

type Tab = 'discover' | 'nearby' | 'matches' | 'me'

function useRoute(): [Tab, string | null, (path: string) => void] {
  const parse = () => {
    const m = location.hash.replace(/^#\/?/, '').match(/^([a-z]+)(?:[-/](.+))?$/)
    const tab = m?.[1] ?? 'discover'
    return [(['discover', 'nearby', 'matches', 'me'].includes(tab) ? tab : 'discover') as Tab, m?.[2] ?? null] as [Tab, string | null]
  }
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => setRoute(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  // Einfache Hash-Namen (#matches-p12), damit Links auch in eingebetteten Ansichten funktionieren
  return [route[0], route[1], (path) => { location.hash = `#${path.replace('/', '-')}` }]
}

export function App() {
  const onboarded = useStore((s) => s.onboarded)
  const theme = useStore((s) => s.theme)

  useEffect(() => {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.dataset.theme = theme
  }, [theme])

  return onboarded ? <Shell /> : <Welcome />
}

function Welcome() {
  const me = useStore((s) => s.me)
  const [name, setName] = useState(me.name === 'Du' ? '' : me.name)
  const [age, setAge] = useState(String(me.age))
  const [ok, setOk] = useState(false)
  const valid = name.trim().length > 0 && Number(age) >= 18 && ok
  return (
    <main className="welcome">
      <div className="welcome-card">
        <div className="logo"><IconFlame width={40} height={40} /></div>
        <h1>Flare</h1>
        <p className="muted">Entdecken, matchen, chatten – auf Handy, Tablet und Desktop.</p>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault()
            if (!valid) return
            actions.updateMe({ name: name.trim(), age: Number(age) })
            actions.finishOnboarding()
          }}
        >
          <label>Vorname<input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoFocus autoComplete="given-name" /></label>
          <label>Alter<input type="number" min={18} max={99} value={age} onChange={(e) => setAge(e.target.value)} /></label>
          <label className="switch"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /><span>Ich bin mindestens 18 Jahre alt.</span></label>
          <button className="btn" disabled={!valid}>Los geht’s</button>
        </form>
        <p className="tiny muted">Demo-Version: Profile sind generierte Beispiele, Daten bleiben nur auf diesem Gerät.</p>
      </div>
    </main>
  )
}

function Shell() {
  const [tab, chatId, go] = useRoute()
  const swipes = useStore((s) => s.swipes)
  const history = useStore((s) => s.history)
  const filters = useStore((s) => s.filters)
  const matches = useStore((s) => s.matches)
  const celebrate = useStore((s) => s.celebrate)
  const me = useStore((s) => s.me)
  const [showFilter, setShowFilter] = useState(false)
  const [sheet, setSheet] = useState<Profile | null>(null)

  const passes = useCallback(
    (p: Profile) =>
      p.age >= filters.minAge && p.age <= filters.maxAge && p.distanceKm <= filters.maxDistance && filters.show.includes(p.gender) && (!filters.onlyOnline || p.online),
    [filters]
  )
  const queue = useMemo(() => PROFILES.filter((p) => !swipes[p.id] && passes(p)), [swipes, passes])
  const nearby = useMemo(() => PROFILES.filter(passes), [passes])
  const unread = matches.reduce((n, m) => n + m.unread, 0) + matches.filter((m) => m.messages.length === 0).length
  const onInfo = useCallback(() => {
    if (queue[0] && window.matchMedia('(max-width: 1179px)').matches) setSheet(queue[0])
  }, [queue])

  // Esc schließt Sheets
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSheet(null); setShowFilter(false); actions.closeCelebrate() } }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  const tabs: [Tab, string, React.ReactNode, number][] = [
    ['discover', 'Entdecken', <IconFlame />, 0],
    ['nearby', 'In der Nähe', <IconGrid />, 0],
    ['matches', 'Matches', <IconChat />, unread],
    ['me', 'Profil', <IconUser />, 0],
  ]

  const celebrated = celebrate ? PROFILE_BY_ID[celebrate] : null

  return (
    <div className={`app tab-${tab} ${chatId ? 'in-chat' : ''}`}>
      <nav className="nav" aria-label="Hauptnavigation">
        <div className="brand"><IconFlame width={26} height={26} /> <span>Flare</span></div>
        {tabs.map(([k, label, icon, badge]) => (
          <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)}>
            <span className="ico">{icon}{badge > 0 && <b className="count">{badge}</b>}</span>
            <span className="lbl">{label}</span>
          </button>
        ))}
        <div className="nav-me"><img src={me.photos[0]} alt="" /> <span>{me.name}</span></div>
      </nav>

      <main className="main">
        {tab === 'discover' && (
          <div className="discover">
            <div className="discover-main">
              <header className="topbar">
                <div className="brand mobile-only"><IconFlame width={24} height={24} /> Flare</div>
                <h1 className="desktop-only">Entdecken</h1>
                <button className="icon-btn" onClick={() => setShowFilter(true)} aria-label="Filter">
                  <IconFilter />
                </button>
              </header>
              <SwipeDeck queue={queue} canUndo={history.length > 0} onSwipe={actions.swipe} onUndo={actions.undo} onInfo={onInfo} />
            </div>
            <aside className="discover-side" aria-label="Profildetails">
              {queue[0] ? (
                <ProfileDetail key={queue[0].id} p={queue[0]} />
              ) : (
                <p className="muted pad">Keine Profile zum Anzeigen.</p>
              )}
            </aside>
          </div>
        )}
        {tab === 'nearby' && (
          <Nearby profiles={nearby} onOpen={setSheet} onFilter={() => setShowFilter(true)} />
        )}
        {tab === 'matches' && <Matches activeId={chatId} onSelect={(id) => go(id ? `matches/${id}` : 'matches')} />}
        {tab === 'me' && <MyProfile />}
      </main>

      {showFilter && <FilterSheet value={filters} onApply={actions.setFilters} onClose={() => setShowFilter(false)} />}

      {sheet && (
        <div className="overlay" onClick={() => setSheet(null)}>
          <div className="sheet tall" role="dialog" aria-modal="true" aria-label={`Profil von ${sheet.name}`} onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <ProfileDetail
              p={sheet}
              actions={
                <>
                  <button className="btn ghost" onClick={() => { actions.swipe(sheet.id, 'like'); setSheet(null) }} disabled={!!swipes[sheet.id]}>
                    <IconHeart width={18} height={18} /> {swipes[sheet.id] ? 'Geliked' : 'Liken'}
                  </button>
                  <button className="btn" onClick={() => { actions.startChat(sheet.id); const id = sheet.id; setSheet(null); go(`matches/${id}`) }}>
                    <IconChat width={18} height={18} /> Hallo sagen
                  </button>
                </>
              }
            />
          </div>
        </div>
      )}

      {celebrated && (
        <div className="overlay center match" onClick={actions.closeCelebrate} role="dialog" aria-modal="true" aria-label="Es ist ein Match">
          <div className="match-card" onClick={(e) => e.stopPropagation()}>
            <h2>Es ist ein Match!</h2>
            <p>Du und {celebrated.name} mögt euch gegenseitig.</p>
            <div className="pair">
              <img src={me.photos[0]} alt="Du" />
              <img src={celebrated.photos[0]} alt={celebrated.name} />
            </div>
            <button className="btn" onClick={() => { const id = celebrated.id; actions.closeCelebrate(); go(`matches/${id}`) }}>Nachricht schreiben</button>
            <button className="btn ghost" onClick={actions.closeCelebrate}>Weiter swipen</button>
          </div>
        </div>
      )}
    </div>
  )
}
